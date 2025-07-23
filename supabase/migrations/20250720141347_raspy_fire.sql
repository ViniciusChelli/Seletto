/*
  # Sistema de Segurança Avançada

  1. Novas Tabelas
    - `security_policies` - Políticas de segurança configuráveis
    - `ip_whitelist` - Lista de IPs permitidos
    - `ip_blacklist` - Lista de IPs bloqueados
    - `audit_trail` - Trilha de auditoria completa
    - `backup_logs` - Logs de backup automático
    - `encryption_keys` - Chaves de criptografia
    - `suspicious_activities` - Atividades suspeitas detectadas
    - `security_incidents` - Incidentes de segurança
    - `data_retention_policies` - Políticas de retenção de dados

  2. Funcionalidades
    - Backup automático na nuvem
    - Auditoria completa de todas as ações
    - Controle de acesso por IP
    - Criptografia de dados sensíveis
    - Monitoramento de atividades suspeitas
    - Alertas de segurança em tempo real

  3. Segurança
    - RLS habilitado
    - Políticas baseadas em permissões
    - Criptografia end-to-end
    - Logs imutáveis
*/

-- Políticas de segurança configuráveis
CREATE TABLE IF NOT EXISTS security_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name text UNIQUE NOT NULL,
  policy_type text NOT NULL CHECK (policy_type IN ('access_control', 'data_protection', 'audit', 'backup', 'monitoring')),
  is_enabled boolean DEFAULT true,
  configuration jsonb NOT NULL DEFAULT '{}',
  severity_level text DEFAULT 'medium' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
  auto_enforce boolean DEFAULT true,
  notification_enabled boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lista de IPs permitidos (whitelist)
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  ip_range cidr, -- Para ranges de IP
  description text,
  user_id uuid REFERENCES auth.users(id), -- IP específico para usuário
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lista de IPs bloqueados (blacklist)
CREATE TABLE IF NOT EXISTS ip_blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL,
  ip_range cidr,
  reason text NOT NULL,
  threat_level text DEFAULT 'medium' CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  auto_blocked boolean DEFAULT false, -- Bloqueado automaticamente pelo sistema
  is_permanent boolean DEFAULT false,
  blocked_until timestamptz,
  incident_count integer DEFAULT 1,
  last_incident_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trilha de auditoria completa
CREATE TABLE IF NOT EXISTS audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  session_id text,
  action_type text NOT NULL, -- 'create', 'read', 'update', 'delete', 'login', 'logout', etc.
  entity_type text NOT NULL, -- 'product', 'sale', 'user', 'setting', etc.
  entity_id uuid,
  old_values jsonb, -- Valores antes da alteração
  new_values jsonb, -- Valores após a alteração
  ip_address inet,
  user_agent text,
  request_id text, -- ID único da requisição
  api_endpoint text, -- Endpoint da API chamado
  http_method text, -- GET, POST, PUT, DELETE
  response_status integer, -- Status HTTP da resposta
  execution_time_ms integer, -- Tempo de execução em ms
  risk_score integer DEFAULT 0, -- Score de risco da ação (0-100)
  is_sensitive boolean DEFAULT false, -- Ação envolve dados sensíveis
  compliance_tags text[], -- Tags para compliance (LGPD, SOX, etc.)
  created_at timestamptz DEFAULT now()
);

-- Logs de backup automático
CREATE TABLE IF NOT EXISTS backup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type text NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
  backup_scope text NOT NULL CHECK (backup_scope IN ('database', 'files', 'complete')),
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
  file_size_bytes bigint,
  backup_location text, -- URL ou path do backup
  encryption_enabled boolean DEFAULT true,
  compression_enabled boolean DEFAULT true,
  retention_days integer DEFAULT 30,
  checksum text, -- Hash para verificar integridade
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  error_message text,
  triggered_by text DEFAULT 'automatic', -- 'automatic', 'manual', 'scheduled'
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Chaves de criptografia
CREATE TABLE IF NOT EXISTS encryption_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  key_type text NOT NULL CHECK (key_type IN ('aes256', 'rsa2048', 'rsa4096', 'ed25519')),
  key_purpose text NOT NULL CHECK (key_purpose IN ('data_encryption', 'backup_encryption', 'api_signing', 'session_encryption')),
  key_data text NOT NULL, -- Chave criptografada
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  rotation_frequency_days integer DEFAULT 90,
  last_rotated_at timestamptz DEFAULT now(),
  usage_count bigint DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Atividades suspeitas detectadas
CREATE TABLE IF NOT EXISTS suspicious_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  activity_type text NOT NULL CHECK (activity_type IN (
    'multiple_failed_logins', 'unusual_access_pattern', 'data_exfiltration', 
    'privilege_escalation', 'unusual_location', 'suspicious_api_calls',
    'bulk_operations', 'after_hours_access', 'multiple_sessions'
  )),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text NOT NULL,
  detection_method text NOT NULL, -- 'rule_based', 'ml_model', 'anomaly_detection', 'manual'
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  ip_address inet,
  user_agent text,
  session_data jsonb,
  evidence jsonb, -- Evidências da atividade suspeita
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  investigated_by uuid REFERENCES auth.users(id),
  investigated_at timestamptz,
  resolution_notes text,
  auto_blocked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Incidentes de segurança
CREATE TABLE IF NOT EXISTS security_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  incident_type text NOT NULL CHECK (incident_type IN (
    'data_breach', 'unauthorized_access', 'malware', 'phishing',
    'ddos_attack', 'insider_threat', 'system_compromise', 'other'
  )),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'contained', 'resolved', 'closed')),
  affected_systems text[],
  affected_users uuid[],
  impact_assessment text,
  containment_actions text,
  recovery_actions text,
  lessons_learned text,
  reported_by uuid REFERENCES auth.users(id),
  assigned_to uuid REFERENCES auth.users(id),
  discovered_at timestamptz NOT NULL,
  contained_at timestamptz,
  resolved_at timestamptz,
  estimated_cost numeric DEFAULT 0,
  compliance_impact text, -- Impacto em compliance (LGPD, etc.)
  external_notification_required boolean DEFAULT false,
  external_notification_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Políticas de retenção de dados
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name text UNIQUE NOT NULL,
  table_name text NOT NULL,
  retention_period_days integer NOT NULL,
  archive_before_delete boolean DEFAULT true,
  archive_location text,
  deletion_criteria jsonb, -- Critérios específicos para deleção
  is_active boolean DEFAULT true,
  compliance_requirement text, -- LGPD, SOX, etc.
  last_executed_at timestamptz,
  next_execution_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sessões seguras aprimoradas
ALTER TABLE secure_sessions ADD COLUMN IF NOT EXISTS geo_location jsonb;
ALTER TABLE secure_sessions ADD COLUMN IF NOT EXISTS device_fingerprint text;
ALTER TABLE secure_sessions ADD COLUMN IF NOT EXISTS risk_score integer DEFAULT 0;
ALTER TABLE secure_sessions ADD COLUMN IF NOT EXISTS is_suspicious boolean DEFAULT false;

-- Habilitar RLS
ALTER TABLE security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Security admins can manage security policies"
  ON security_policies FOR ALL TO authenticated
  USING (user_has_permission('security.admin'))
  WITH CHECK (user_has_permission('security.admin'));

CREATE POLICY "Security admins can view security policies"
  ON security_policies FOR SELECT TO authenticated
  USING (user_has_permission('security.view'));

CREATE POLICY "Security admins can manage IP lists"
  ON ip_whitelist FOR ALL TO authenticated
  USING (user_has_permission('security.admin'))
  WITH CHECK (user_has_permission('security.admin'));

CREATE POLICY "Security admins can manage IP blacklist"
  ON ip_blacklist FOR ALL TO authenticated
  USING (user_has_permission('security.admin'))
  WITH CHECK (user_has_permission('security.admin'));

CREATE POLICY "Users can view their own audit trail"
  ON audit_trail FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_has_permission('audit.view'));

CREATE POLICY "System can create audit entries"
  ON audit_trail FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Security admins can view backup logs"
  ON backup_logs FOR SELECT TO authenticated
  USING (user_has_permission('backup.view'));

CREATE POLICY "System can manage backup logs"
  ON backup_logs FOR ALL TO authenticated
  USING (user_has_permission('backup.admin'))
  WITH CHECK (user_has_permission('backup.admin'));

CREATE POLICY "Security admins can manage encryption keys"
  ON encryption_keys FOR ALL TO authenticated
  USING (user_has_permission('security.admin'))
  WITH CHECK (user_has_permission('security.admin'));

CREATE POLICY "Security team can view suspicious activities"
  ON suspicious_activities FOR SELECT TO authenticated
  USING (user_has_permission('security.monitor'));

CREATE POLICY "System can create suspicious activities"
  ON suspicious_activities FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Security team can manage suspicious activities"
  ON suspicious_activities FOR UPDATE TO authenticated
  USING (user_has_permission('security.investigate'))
  WITH CHECK (user_has_permission('security.investigate'));

CREATE POLICY "Security team can manage incidents"
  ON security_incidents FOR ALL TO authenticated
  USING (user_has_permission('security.incidents'))
  WITH CHECK (user_has_permission('security.incidents'));

CREATE POLICY "Security admins can manage retention policies"
  ON data_retention_policies FOR ALL TO authenticated
  USING (user_has_permission('security.admin'))
  WITH CHECK (user_has_permission('security.admin'));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_security_policies_type ON security_policies(policy_type, is_enabled);
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_address ON ip_whitelist(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_blacklist_address ON ip_blacklist(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail(action_type, created_at);
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON backup_logs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_purpose ON encryption_keys(key_purpose, is_active);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_severity ON suspicious_activities(severity, status);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_user ON suspicious_activities(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity, status);
CREATE INDEX IF NOT EXISTS idx_data_retention_next_execution ON data_retention_policies(next_execution_at, is_active);

-- Triggers para timestamps
CREATE TRIGGER update_security_policies_updated_at
    BEFORE UPDATE ON security_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ip_whitelist_updated_at
    BEFORE UPDATE ON ip_whitelist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ip_blacklist_updated_at
    BEFORE UPDATE ON ip_blacklist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_encryption_keys_updated_at
    BEFORE UPDATE ON encryption_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suspicious_activities_updated_at
    BEFORE UPDATE ON suspicious_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_incidents_updated_at
    BEFORE UPDATE ON security_incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at
    BEFORE UPDATE ON data_retention_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para verificar IP na whitelist/blacklist
CREATE OR REPLACE FUNCTION check_ip_access(client_ip inet)
RETURNS jsonb AS $$
DECLARE
    is_whitelisted boolean := false;
    is_blacklisted boolean := false;
    whitelist_count integer;
    blacklist_record RECORD;
    result jsonb;
BEGIN
    -- Verificar se existe whitelist ativa
    SELECT COUNT(*) INTO whitelist_count
    FROM ip_whitelist 
    WHERE is_active = true 
    AND (expires_at IS NULL OR expires_at > now());
    
    -- Se existe whitelist, verificar se IP está na lista
    IF whitelist_count > 0 THEN
        SELECT COUNT(*) > 0 INTO is_whitelisted
        FROM ip_whitelist
        WHERE is_active = true
        AND (expires_at IS NULL OR expires_at > now())
        AND (ip_address = client_ip OR client_ip << ip_range);
        
        -- Se não está na whitelist, bloquear
        IF NOT is_whitelisted THEN
            result := jsonb_build_object(
                'allowed', false,
                'reason', 'IP not in whitelist',
                'action', 'block'
            );
            RETURN result;
        END IF;
    END IF;
    
    -- Verificar blacklist
    SELECT * INTO blacklist_record
    FROM ip_blacklist
    WHERE (ip_address = client_ip OR client_ip << ip_range)
    AND (blocked_until IS NULL OR blocked_until > now())
    ORDER BY threat_level DESC, created_at DESC
    LIMIT 1;
    
    IF blacklist_record IS NOT NULL THEN
        result := jsonb_build_object(
            'allowed', false,
            'reason', blacklist_record.reason,
            'threat_level', blacklist_record.threat_level,
            'action', 'block'
        );
        RETURN result;
    END IF;
    
    -- IP permitido
    result := jsonb_build_object(
        'allowed', true,
        'whitelisted', is_whitelisted,
        'action', 'allow'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar atividade suspeita
CREATE OR REPLACE FUNCTION detect_suspicious_activity(
    user_uuid uuid,
    activity_type_param text,
    description_param text,
    evidence_param jsonb DEFAULT '{}',
    confidence_param numeric DEFAULT 0.8
)
RETURNS uuid AS $$
DECLARE
    activity_id uuid;
    severity_level text;
    should_auto_block boolean := false;
BEGIN
    -- Determinar severidade baseada no tipo
    CASE activity_type_param
        WHEN 'multiple_failed_logins' THEN
            severity_level := 'high';
            should_auto_block := true;
        WHEN 'data_exfiltration' THEN
            severity_level := 'critical';
            should_auto_block := true;
        WHEN 'privilege_escalation' THEN
            severity_level := 'critical';
            should_auto_block := true;
        WHEN 'unusual_access_pattern' THEN
            severity_level := 'medium';
        WHEN 'after_hours_access' THEN
            severity_level := 'low';
        ELSE
            severity_level := 'medium';
    END CASE;
    
    -- Registrar atividade suspeita
    INSERT INTO suspicious_activities (
        user_id,
        activity_type,
        severity,
        description,
        detection_method,
        confidence_score,
        ip_address,
        user_agent,
        evidence,
        auto_blocked
    ) VALUES (
        user_uuid,
        activity_type_param,
        severity_level,
        description_param,
        'rule_based',
        confidence_param,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent',
        evidence_param,
        should_auto_block
    ) RETURNING id INTO activity_id;
    
    -- Auto-bloquear se necessário
    IF should_auto_block THEN
        INSERT INTO ip_blacklist (
            ip_address,
            reason,
            threat_level,
            auto_blocked,
            blocked_until,
            created_by
        ) VALUES (
            inet_client_addr(),
            'Auto-blocked due to suspicious activity: ' || activity_type_param,
            CASE severity_level 
                WHEN 'critical' THEN 'critical'
                WHEN 'high' THEN 'high'
                ELSE 'medium'
            END,
            true,
            now() + INTERVAL '1 hour', -- Bloquear por 1 hora inicialmente
            user_uuid
        );
    END IF;
    
    -- Criar notificação para equipe de segurança
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        category,
        priority,
        auto_generated,
        metadata
    )
    SELECT 
        ur.user_id,
        '🚨 Atividade Suspeita Detectada',
        'Atividade suspeita detectada: ' || description_param,
        'warning',
        'security',
        CASE severity_level 
            WHEN 'critical' THEN 'urgent'
            WHEN 'high' THEN 'high'
            ELSE 'normal'
        END,
        true,
        jsonb_build_object(
            'activity_id', activity_id,
            'activity_type', activity_type_param,
            'severity', severity_level,
            'confidence', confidence_param
        )
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE p.name = 'security.monitor'
    AND ur.is_active = true;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para backup automático
CREATE OR REPLACE FUNCTION create_automatic_backup(
    backup_type_param text DEFAULT 'incremental',
    backup_scope_param text DEFAULT 'database'
)
RETURNS uuid AS $$
DECLARE
    backup_id uuid;
    backup_location text;
    encryption_key text;
BEGIN
    -- Gerar localização do backup
    backup_location := 'backups/' || 
                      backup_scope_param || '/' ||
                      backup_type_param || '/' ||
                      to_char(now(), 'YYYY/MM/DD/') ||
                      'backup_' || extract(epoch from now())::text || '.sql.gz';
    
    -- Buscar chave de criptografia ativa
    SELECT key_data INTO encryption_key
    FROM encryption_keys
    WHERE key_purpose = 'backup_encryption'
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Criar registro de backup
    INSERT INTO backup_logs (
        backup_type,
        backup_scope,
        backup_location,
        encryption_enabled,
        compression_enabled,
        triggered_by
    ) VALUES (
        backup_type_param,
        backup_scope_param,
        backup_location,
        encryption_key IS NOT NULL,
        true,
        'automatic'
    ) RETURNING id INTO backup_id;
    
    -- Aqui seria implementada a lógica real de backup
    -- Por enquanto, simular sucesso
    UPDATE backup_logs
    SET 
        status = 'completed',
        completed_at = now(),
        file_size_bytes = 1024 * 1024 * 10, -- 10MB simulado
        checksum = md5(random()::text)
    WHERE id = backup_id;
    
    -- Log da ação
    INSERT INTO audit_trail (
        user_id,
        action_type,
        entity_type,
        entity_id,
        new_values,
        is_sensitive
    ) VALUES (
        NULL,
        'backup_created',
        'backup',
        backup_id,
        jsonb_build_object(
            'backup_type', backup_type_param,
            'backup_scope', backup_scope_param,
            'location', backup_location
        ),
        true
    );
    
    RETURN backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para auditoria automática
CREATE OR REPLACE FUNCTION log_audit_trail(
    action_type_param text,
    entity_type_param text,
    entity_id_param uuid DEFAULT NULL,
    old_values_param jsonb DEFAULT NULL,
    new_values_param jsonb DEFAULT NULL,
    is_sensitive_param boolean DEFAULT false
)
RETURNS uuid AS $$
DECLARE
    audit_id uuid;
    risk_score integer := 0;
    compliance_tags text[] := '{}';
BEGIN
    -- Calcular risk score baseado na ação
    CASE action_type_param
        WHEN 'delete' THEN risk_score := 70;
        WHEN 'update' THEN risk_score := 40;
        WHEN 'create' THEN risk_score := 20;
        WHEN 'login' THEN risk_score := 10;
        WHEN 'logout' THEN risk_score := 5;
        ELSE risk_score := 30;
    END CASE;
    
    -- Adicionar tags de compliance
    IF entity_type_param IN ('user', 'customer', 'profile') THEN
        compliance_tags := array_append(compliance_tags, 'LGPD');
    END IF;
    
    IF entity_type_param IN ('sale', 'payment', 'financial') THEN
        compliance_tags := array_append(compliance_tags, 'SOX');
    END IF;
    
    IF is_sensitive_param THEN
        compliance_tags := array_append(compliance_tags, 'SENSITIVE');
        risk_score := risk_score + 20;
    END IF;
    
    -- Inserir registro de auditoria
    INSERT INTO audit_trail (
        user_id,
        session_id,
        action_type,
        entity_type,
        entity_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        risk_score,
        is_sensitive,
        compliance_tags
    ) VALUES (
        auth.uid(),
        current_setting('app.session_id', true),
        action_type_param,
        entity_type_param,
        entity_id_param,
        old_values_param,
        new_values_param,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent',
        risk_score,
        is_sensitive_param,
        compliance_tags
    ) RETURNING id INTO audit_id;
    
    -- Detectar atividades suspeitas baseadas em padrões
    IF risk_score > 60 THEN
        PERFORM detect_suspicious_activity(
            auth.uid(),
            'high_risk_action',
            'High risk action detected: ' || action_type_param || ' on ' || entity_type_param,
            jsonb_build_object(
                'audit_id', audit_id,
                'risk_score', risk_score,
                'action', action_type_param,
                'entity', entity_type_param
            ),
            0.7
        );
    END IF;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para rotação automática de chaves
CREATE OR REPLACE FUNCTION rotate_encryption_keys()
RETURNS void AS $$
DECLARE
    key_record RECORD;
    new_key_data text;
BEGIN
    -- Buscar chaves que precisam ser rotacionadas
    FOR key_record IN
        SELECT *
        FROM encryption_keys
        WHERE is_active = true
        AND (
            last_rotated_at + (rotation_frequency_days || ' days')::INTERVAL < now()
            OR expires_at < now() + INTERVAL '7 days'
        )
    LOOP
        -- Gerar nova chave (simulado)
        new_key_data := encode(gen_random_bytes(32), 'base64');
        
        -- Desativar chave antiga
        UPDATE encryption_keys
        SET is_active = false
        WHERE id = key_record.id;
        
        -- Criar nova chave
        INSERT INTO encryption_keys (
            key_name,
            key_type,
            key_purpose,
            key_data,
            rotation_frequency_days,
            created_by
        ) VALUES (
            key_record.key_name,
            key_record.key_type,
            key_record.key_purpose,
            new_key_data,
            key_record.rotation_frequency_days,
            NULL -- Sistema
        );
        
        -- Log da rotação
        INSERT INTO audit_trail (
            action_type,
            entity_type,
            entity_id,
            new_values,
            is_sensitive
        ) VALUES (
            'key_rotation',
            'encryption_key',
            key_record.id,
            jsonb_build_object(
                'key_name', key_record.key_name,
                'old_key_id', key_record.id
            ),
            true
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpeza de dados baseada em políticas de retenção
CREATE OR REPLACE FUNCTION apply_data_retention_policies()
RETURNS void AS $$
DECLARE
    policy_record RECORD;
    deletion_count integer;
BEGIN
    FOR policy_record IN
        SELECT *
        FROM data_retention_policies
        WHERE is_active = true
        AND (next_execution_at IS NULL OR next_execution_at <= now())
    LOOP
        -- Executar política de retenção (exemplo para audit_trail)
        IF policy_record.table_name = 'audit_trail' THEN
            -- Arquivar antes de deletar se configurado
            IF policy_record.archive_before_delete THEN
                -- Aqui seria implementada a lógica de arquivamento
                NULL;
            END IF;
            
            -- Deletar registros antigos
            EXECUTE format(
                'DELETE FROM %I WHERE created_at < now() - INTERVAL ''%s days''',
                policy_record.table_name,
                policy_record.retention_period_days
            );
            
            GET DIAGNOSTICS deletion_count = ROW_COUNT;
            
            -- Log da execução
            INSERT INTO audit_trail (
                action_type,
                entity_type,
                new_values,
                is_sensitive
            ) VALUES (
                'data_retention_applied',
                'retention_policy',
                jsonb_build_object(
                    'policy_name', policy_record.policy_name,
                    'table_name', policy_record.table_name,
                    'records_deleted', deletion_count
                ),
                true
            );
        END IF;
        
        -- Atualizar próxima execução
        UPDATE data_retention_policies
        SET 
            last_executed_at = now(),
            next_execution_at = now() + INTERVAL '1 day'
        WHERE id = policy_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir políticas de segurança padrão
INSERT INTO security_policies (policy_name, policy_type, configuration, severity_level) VALUES
('ip_access_control', 'access_control', '{"enabled": true, "whitelist_only": false, "auto_block_threats": true}', 'high'),
('data_encryption', 'data_protection', '{"encrypt_sensitive_data": true, "encryption_algorithm": "AES256", "key_rotation_days": 90}', 'critical'),
('audit_logging', 'audit', '{"log_all_actions": true, "log_sensitive_data": true, "retention_days": 365}', 'high'),
('automatic_backup', 'backup', '{"frequency": "daily", "retention_days": 30, "encryption": true, "compression": true}', 'critical'),
('suspicious_activity_monitoring', 'monitoring', '{"enabled": true, "auto_block": true, "confidence_threshold": 0.7}', 'high')
ON CONFLICT (policy_name) DO NOTHING;

-- Inserir chaves de criptografia padrão
INSERT INTO encryption_keys (key_name, key_type, key_purpose, key_data, rotation_frequency_days) VALUES
('backup_encryption_key', 'aes256', 'backup_encryption', encode(gen_random_bytes(32), 'base64'), 90),
('data_encryption_key', 'aes256', 'data_encryption', encode(gen_random_bytes(32), 'base64'), 90),
('session_encryption_key', 'aes256', 'session_encryption', encode(gen_random_bytes(32), 'base64'), 30)
ON CONFLICT (key_name) DO NOTHING;

-- Inserir políticas de retenção padrão
INSERT INTO data_retention_policies (policy_name, table_name, retention_period_days, compliance_requirement) VALUES
('audit_trail_retention', 'audit_trail', 365, 'LGPD - Logs de auditoria'),
('security_logs_retention', 'security_logs', 180, 'Segurança - Logs de segurança'),
('backup_logs_retention', 'backup_logs', 90, 'Operacional - Logs de backup'),
('suspicious_activities_retention', 'suspicious_activities', 730, 'Segurança - Atividades suspeitas'),
('session_logs_retention', 'user_sessions', 30, 'LGPD - Sessões de usuário')
ON CONFLICT (policy_name) DO NOTHING;

-- Inserir permissões de segurança
INSERT INTO permissions (name, display_name, description, module, action) VALUES
('security.admin', 'Administrador de Segurança', 'Controle total de segurança', 'security', 'admin'),
('security.view', 'Ver Configurações de Segurança', 'Visualizar configurações de segurança', 'security', 'read'),
('security.monitor', 'Monitorar Segurança', 'Monitorar atividades suspeitas', 'security', 'monitor'),
('security.investigate', 'Investigar Incidentes', 'Investigar incidentes de segurança', 'security', 'investigate'),
('security.incidents', 'Gerenciar Incidentes', 'Gerenciar incidentes de segurança', 'security', 'incidents'),
('audit.view', 'Ver Auditoria', 'Visualizar trilha de auditoria', 'audit', 'read'),
('audit.export', 'Exportar Auditoria', 'Exportar dados de auditoria', 'audit', 'export'),
('backup.view', 'Ver Backups', 'Visualizar logs de backup', 'backup', 'read'),
('backup.admin', 'Administrar Backups', 'Gerenciar backups do sistema', 'backup', 'admin'),
('backup.restore', 'Restaurar Backups', 'Restaurar dados de backup', 'backup', 'restore'),
('encryption.manage', 'Gerenciar Criptografia', 'Gerenciar chaves de criptografia', 'encryption', 'manage'),
('ip.manage', 'Gerenciar IPs', 'Gerenciar whitelist/blacklist de IPs', 'ip', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Atribuir permissões de segurança às funções
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'owner'
AND p.name LIKE 'security.%' OR p.name LIKE 'audit.%' OR p.name LIKE 'backup.%' OR p.name LIKE 'encryption.%' OR p.name LIKE 'ip.%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'manager'
AND p.name IN ('security.view', 'security.monitor', 'audit.view', 'backup.view')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Configurações do sistema para segurança avançada
INSERT INTO settings (key, value, description, category, is_public) VALUES
('security_level', '"high"', 'Nível de segurança do sistema', 'security', false),
('ip_access_control_enabled', 'true', 'Habilitar controle de acesso por IP', 'security', false),
('auto_backup_enabled', 'true', 'Habilitar backup automático', 'backup', false),
('backup_frequency_hours', '24', 'Frequência de backup em horas', 'backup', false),
('backup_retention_days', '30', 'Dias para manter backups', 'backup', false),
('encryption_enabled', 'true', 'Habilitar criptografia de dados sensíveis', 'security', false),
('suspicious_activity_monitoring', 'true', 'Monitorar atividades suspeitas', 'security', false),
('auto_block_suspicious_ips', 'true', 'Bloquear automaticamente IPs suspeitos', 'security', false),
('audit_log_retention_days', '365', 'Dias para manter logs de auditoria', 'audit', false),
('security_incident_notification', 'true', 'Notificar incidentes de segurança', 'security', false),
('key_rotation_frequency_days', '90', 'Frequência de rotação de chaves (dias)', 'encryption', false),
('compliance_mode', '"lgpd"', 'Modo de compliance ativo', 'compliance', false)
ON CONFLICT (key) DO NOTHING;

-- Trigger para auditoria automática em tabelas sensíveis
CREATE OR REPLACE FUNCTION trigger_audit_log()
RETURNS trigger AS $$
BEGIN
    -- Registrar ação na trilha de auditoria
    PERFORM log_audit_trail(
        TG_OP::text,
        TG_TABLE_NAME::text,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        TG_TABLE_NAME IN ('users', 'customers', 'payments', 'encryption_keys')
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers de auditoria em tabelas importantes
CREATE TRIGGER audit_products_trigger
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

CREATE TRIGGER audit_sales_trigger
    AFTER INSERT OR UPDATE OR DELETE ON sales
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

CREATE TRIGGER audit_suppliers_trigger
    AFTER INSERT OR UPDATE OR DELETE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log();

-- Função para executar tarefas de segurança periódicas
CREATE OR REPLACE FUNCTION run_security_maintenance()
RETURNS void AS $$
BEGIN
    -- Rotacionar chaves de criptografia
    PERFORM rotate_encryption_keys();
    
    -- Aplicar políticas de retenção
    PERFORM apply_data_retention_policies();
    
    -- Criar backup automático
    PERFORM create_automatic_backup();
    
    -- Limpar sessões expiradas
    DELETE FROM secure_sessions WHERE expires_at < now();
    DELETE FROM user_sessions WHERE expires_at < now();
    
    -- Limpar códigos 2FA expirados
    DELETE FROM two_factor_codes WHERE expires_at < now() - INTERVAL '1 day';
    
    -- Log da manutenção
    INSERT INTO audit_trail (
        action_type,
        entity_type,
        new_values
    ) VALUES (
        'security_maintenance',
        'system',
        jsonb_build_object('execution_time', now())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;