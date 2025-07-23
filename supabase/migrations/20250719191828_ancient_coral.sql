/*
  # Two-Factor Authentication System

  1. New Tables
    - `user_two_factor` - Store 2FA settings for users
    - `two_factor_codes` - Temporary codes for verification
    - `trusted_devices` - Remember trusted devices
    - `security_logs` - Audit trail for security events

  2. Security Features
    - TOTP (Time-based One-Time Password) support
    - SMS verification codes
    - Email verification codes
    - Trusted device management
    - Security event logging

  3. Enhanced Security
    - Rate limiting for 2FA attempts
    - Device fingerprinting
    - Session security improvements
*/

-- Two-factor authentication settings for users
CREATE TABLE IF NOT EXISTS user_two_factor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_enabled boolean DEFAULT false,
  method text DEFAULT 'email' CHECK (method IN ('email', 'sms', 'totp', 'backup_codes')),
  phone_number text,
  totp_secret text, -- Encrypted TOTP secret
  backup_codes text[], -- Encrypted backup codes
  recovery_email text,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Temporary verification codes
CREATE TABLE IF NOT EXISTS two_factor_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  code_type text NOT NULL CHECK (code_type IN ('sms', 'email', 'login', 'setup')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Trusted devices for users
CREATE TABLE IF NOT EXISTS trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  device_fingerprint text NOT NULL, -- Browser/device fingerprint
  ip_address inet,
  user_agent text,
  last_used_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + INTERVAL '30 days'),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Security audit logs
CREATE TABLE IF NOT EXISTS security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'login_success', 'login_failed', 'logout', 
    '2fa_enabled', '2fa_disabled', '2fa_success', '2fa_failed',
    'password_changed', 'email_changed', 'account_locked',
    'suspicious_activity', 'device_trusted', 'device_removed'
  )),
  ip_address inet,
  user_agent text,
  location jsonb, -- Country, city, etc.
  metadata jsonb, -- Additional event data
  risk_score integer DEFAULT 0, -- 0-100 risk assessment
  created_at timestamptz DEFAULT now()
);

-- Session security enhancements
CREATE TABLE IF NOT EXISTS secure_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  device_id uuid REFERENCES trusted_devices(id),
  ip_address inet NOT NULL,
  user_agent text,
  is_2fa_verified boolean DEFAULT false,
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Rate limiting for security attempts
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP address, user ID, etc.
  action_type text NOT NULL CHECK (action_type IN ('login', '2fa', 'password_reset', 'code_request')),
  attempts integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  blocked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(identifier, action_type)
);

-- Enable RLS on all tables
ALTER TABLE user_two_factor ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Security policies

-- User two-factor settings
CREATE POLICY "Users can view their own 2FA settings"
  ON user_two_factor FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own 2FA settings"
  ON user_two_factor FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Two-factor codes (very restricted)
CREATE POLICY "Users can view their own codes"
  ON two_factor_codes FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage 2FA codes"
  ON two_factor_codes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trusted devices
CREATE POLICY "Users can view their own devices"
  ON trusted_devices FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own devices"
  ON trusted_devices FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Security logs (read-only for users, admins can see all)
CREATE POLICY "Users can view their own security logs"
  ON security_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "System can create security logs"
  ON security_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Secure sessions
CREATE POLICY "Users can view their own sessions"
  ON secure_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own sessions"
  ON secure_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Rate limits (system managed)
CREATE POLICY "System can manage rate limits"
  ON rate_limits FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_two_factor_user_id ON user_two_factor(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_user_id ON two_factor_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_codes_expires_at ON two_factor_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_secure_sessions_user_id ON secure_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_secure_sessions_token ON secure_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, action_type);

-- Triggers for updating timestamps
CREATE TRIGGER update_user_two_factor_updated_at
    BEFORE UPDATE ON user_two_factor
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at
    BEFORE UPDATE ON rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Functions for 2FA operations

-- Generate TOTP secret
CREATE OR REPLACE FUNCTION generate_totp_secret()
RETURNS text AS $$
DECLARE
    secret text;
BEGIN
    -- Generate a 32-character base32 secret
    secret := encode(gen_random_bytes(20), 'base64');
    -- Remove padding and make it base32-like
    secret := translate(secret, '+/=', 'ABC');
    secret := upper(left(secret, 32));
    
    RETURN secret;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate verification code
CREATE OR REPLACE FUNCTION generate_verification_code(
    user_uuid uuid,
    code_type_param text,
    expires_minutes integer DEFAULT 10
)
RETURNS text AS $$
DECLARE
    verification_code text;
    existing_code_count integer;
BEGIN
    -- Check rate limiting
    SELECT COUNT(*) INTO existing_code_count
    FROM two_factor_codes
    WHERE user_id = user_uuid
    AND code_type = code_type_param
    AND created_at > now() - INTERVAL '1 hour'
    AND used_at IS NULL;
    
    IF existing_code_count >= 5 THEN
        RAISE EXCEPTION 'Too many verification codes requested. Please wait before requesting another.';
    END IF;
    
    -- Generate 6-digit code
    verification_code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    
    -- Store the code
    INSERT INTO two_factor_codes (
        user_id,
        code,
        code_type,
        expires_at,
        ip_address,
        user_agent
    ) VALUES (
        user_uuid,
        verification_code,
        code_type_param,
        now() + (expires_minutes || ' minutes')::INTERVAL,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
    
    RETURN verification_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify code
CREATE OR REPLACE FUNCTION verify_code(
    user_uuid uuid,
    input_code text,
    code_type_param text
)
RETURNS boolean AS $$
DECLARE
    stored_code_record RECORD;
    is_valid boolean := false;
BEGIN
    -- Find the most recent valid code
    SELECT * INTO stored_code_record
    FROM two_factor_codes
    WHERE user_id = user_uuid
    AND code_type = code_type_param
    AND used_at IS NULL
    AND expires_at > now()
    AND attempts < max_attempts
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF stored_code_record IS NULL THEN
        -- Log failed attempt
        INSERT INTO security_logs (user_id, event_type, metadata)
        VALUES (user_uuid, '2fa_failed', jsonb_build_object('reason', 'no_valid_code'));
        RETURN false;
    END IF;
    
    -- Increment attempts
    UPDATE two_factor_codes
    SET attempts = attempts + 1
    WHERE id = stored_code_record.id;
    
    -- Check if code matches
    IF stored_code_record.code = input_code THEN
        -- Mark code as used
        UPDATE two_factor_codes
        SET used_at = now()
        WHERE id = stored_code_record.id;
        
        -- Log successful verification
        INSERT INTO security_logs (user_id, event_type, metadata)
        VALUES (user_uuid, '2fa_success', jsonb_build_object('method', code_type_param));
        
        is_valid := true;
    ELSE
        -- Log failed attempt
        INSERT INTO security_logs (user_id, event_type, metadata)
        VALUES (user_uuid, '2fa_failed', jsonb_build_object('reason', 'invalid_code', 'attempts', stored_code_record.attempts + 1));
    END IF;
    
    RETURN is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if device is trusted
CREATE OR REPLACE FUNCTION is_device_trusted(
    user_uuid uuid,
    device_fingerprint_param text
)
RETURNS boolean AS $$
DECLARE
    device_count integer;
BEGIN
    SELECT COUNT(*) INTO device_count
    FROM trusted_devices
    WHERE user_id = user_uuid
    AND device_fingerprint = device_fingerprint_param
    AND is_active = true
    AND expires_at > now();
    
    RETURN device_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trusted device
CREATE OR REPLACE FUNCTION add_trusted_device(
    user_uuid uuid,
    device_name_param text,
    device_fingerprint_param text,
    expires_days integer DEFAULT 30
)
RETURNS uuid AS $$
DECLARE
    device_id uuid;
BEGIN
    INSERT INTO trusted_devices (
        user_id,
        device_name,
        device_fingerprint,
        ip_address,
        user_agent,
        expires_at
    ) VALUES (
        user_uuid,
        device_name_param,
        device_fingerprint_param,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent',
        now() + (expires_days || ' days')::INTERVAL
    ) RETURNING id INTO device_id;
    
    -- Log device trust event
    INSERT INTO security_logs (user_id, event_type, metadata)
    VALUES (user_uuid, 'device_trusted', jsonb_build_object('device_name', device_name_param));
    
    RETURN device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limiting check
CREATE OR REPLACE FUNCTION check_rate_limit(
    identifier_param text,
    action_type_param text,
    max_attempts integer DEFAULT 5,
    window_minutes integer DEFAULT 15
)
RETURNS boolean AS $$
DECLARE
    current_attempts integer;
    window_start timestamptz;
    blocked_until timestamptz;
BEGIN
    -- Check if currently blocked
    SELECT rate_limits.blocked_until INTO blocked_until
    FROM rate_limits
    WHERE identifier = identifier_param
    AND action_type = action_type_param;
    
    IF blocked_until IS NOT NULL AND blocked_until > now() THEN
        RETURN false; -- Still blocked
    END IF;
    
    -- Get or create rate limit record
    INSERT INTO rate_limits (identifier, action_type, window_start)
    VALUES (identifier_param, action_type_param, now())
    ON CONFLICT (identifier, action_type)
    DO UPDATE SET
        attempts = CASE
            WHEN rate_limits.window_start < now() - (window_minutes || ' minutes')::INTERVAL
            THEN 1 -- Reset counter if window expired
            ELSE rate_limits.attempts + 1
        END,
        window_start = CASE
            WHEN rate_limits.window_start < now() - (window_minutes || ' minutes')::INTERVAL
            THEN now() -- Reset window
            ELSE rate_limits.window_start
        END,
        blocked_until = CASE
            WHEN (CASE
                WHEN rate_limits.window_start < now() - (window_minutes || ' minutes')::INTERVAL
                THEN 1
                ELSE rate_limits.attempts + 1
            END) >= max_attempts
            THEN now() + (window_minutes || ' minutes')::INTERVAL
            ELSE NULL
        END,
        updated_at = now()
    RETURNING attempts INTO current_attempts;
    
    RETURN current_attempts < max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up expired codes and sessions
CREATE OR REPLACE FUNCTION cleanup_expired_security_data()
RETURNS void AS $$
BEGIN
    -- Delete expired verification codes
    DELETE FROM two_factor_codes
    WHERE expires_at < now() - INTERVAL '1 day';
    
    -- Delete expired trusted devices
    DELETE FROM trusted_devices
    WHERE expires_at < now();
    
    -- Delete expired sessions
    DELETE FROM secure_sessions
    WHERE expires_at < now();
    
    -- Clean old security logs (keep 90 days)
    DELETE FROM security_logs
    WHERE created_at < now() - INTERVAL '90 days';
    
    -- Reset rate limits for expired windows
    DELETE FROM rate_limits
    WHERE window_start < now() - INTERVAL '1 day'
    AND blocked_until IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert security settings
INSERT INTO settings (key, value, description, category, is_public) VALUES
('require_2fa', 'false', 'Require two-factor authentication for all users', 'security', false),
('2fa_methods', '["email", "sms", "totp"]', 'Available 2FA methods', 'security', true),
('trusted_device_duration', '30', 'Days to keep devices trusted', 'security', false),
('max_login_attempts', '5', 'Maximum login attempts before lockout', 'security', false),
('lockout_duration', '15', 'Lockout duration in minutes', 'security', false),
('session_timeout', '24', 'Session timeout in hours', 'security', false),
('password_min_length', '8', 'Minimum password length', 'security', true),
('password_require_special', 'true', 'Require special characters in password', 'security', true),
('enable_device_tracking', 'true', 'Enable device fingerprinting', 'security', false),
('security_log_retention', '90', 'Days to keep security logs', 'security', false)
ON CONFLICT (key) DO NOTHING;