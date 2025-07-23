import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { TrustedDevice, SecurityLog } from '../types/Security';
import toast from 'react-hot-toast';

interface SecurityContextType {
  trustedDevices: TrustedDevice[];
  securityLogs: SecurityLog[];
  isLoading: boolean;
  
  // Device Management
  trustDevice: (deviceName: string) => Promise<boolean>;
  removeTrustedDevice: (deviceId: string) => Promise<boolean>;
  isDeviceTrusted: () => Promise<boolean>;
  
  // Security
  checkRateLimit: (action: string) => Promise<boolean>;
  logSecurityEvent: (eventType: string, metadata?: any) => Promise<void>;
  
  // Session Management
  getActiveSessions: () => Promise<any[]>;
  terminateSession: (sessionId: string) => Promise<boolean>;
  terminateAllSessions: () => Promise<boolean>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

export const SecurityProvider = ({ children }: { children: ReactNode }) => {
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Fetch trusted devices
      const { data: devicesData } = await supabase
        .from('trusted_devices')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_used_at', { ascending: false });

      if (devicesData) {
        setTrustedDevices(devicesData.map(device => ({
          id: device.id,
          userId: device.user_id,
          deviceName: device.device_name,
          deviceFingerprint: device.device_fingerprint,
          ipAddress: device.ip_address,
          userAgent: device.user_agent,
          lastUsedAt: device.last_used_at,
          expiresAt: device.expires_at,
          isActive: device.is_active,
          createdAt: device.created_at,
        })));
      }

      // Fetch recent security logs
      const { data: logsData } = await supabase
        .from('security_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsData) {
        setSecurityLogs(logsData.map(log => ({
          id: log.id,
          userId: log.user_id,
          eventType: log.event_type,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          location: log.location,
          metadata: log.metadata,
          riskScore: log.risk_score,
          createdAt: log.created_at,
        })));
      }

    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const trustDevice = async (deviceName: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Generate device fingerprint
      const deviceFingerprint = await generateDeviceFingerprint();

      const { data, error } = await supabase.rpc('add_trusted_device', {
        user_uuid: user.id,
        device_name_param: deviceName,
        device_fingerprint_param: deviceFingerprint
      });

      if (error) throw error;

      toast.success('Dispositivo adicionado como confiável');
      await fetchSecurityData();
      return true;
    } catch (error) {
      console.error('Error trusting device:', error);
      toast.error('Erro ao adicionar dispositivo confiável');
      return false;
    }
  };

  const removeTrustedDevice = async (deviceId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('trusted_devices')
        .update({ is_active: false })
        .eq('id', deviceId);

      if (error) throw error;

      await logSecurityEvent('device_removed', { device_id: deviceId });
      toast.success('Dispositivo removido da lista de confiáveis');
      await fetchSecurityData();
      return true;
    } catch (error) {
      console.error('Error removing trusted device:', error);
      toast.error('Erro ao remover dispositivo');
      return false;
    }
  };

  const isDeviceTrusted = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const deviceFingerprint = await generateDeviceFingerprint();

      const { data, error } = await supabase.rpc('is_device_trusted', {
        user_uuid: user.id,
        device_fingerprint_param: deviceFingerprint
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking device trust:', error);
      return false;
    }
  };

  const checkRateLimit = async (action: string): Promise<boolean> => {
    try {
      const identifier = await getClientIdentifier();

      const { data, error } = await supabase.rpc('check_rate_limit', {
        identifier_param: identifier,
        action_type_param: action
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return false;
    }
  };

  const logSecurityEvent = async (eventType: string, metadata?: any): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('security_logs')
        .insert({
          user_id: user?.id,
          event_type: eventType,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          metadata: metadata || {},
          risk_score: calculateRiskScore(eventType, metadata)
        });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  };

  const getActiveSessions = async (): Promise<any[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('secure_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('last_activity', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      return [];
    }
  };

  const terminateSession = async (sessionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('secure_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      await logSecurityEvent('session_terminated', { session_id: sessionId });
      toast.success('Sessão terminada com sucesso');
      return true;
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Erro ao terminar sessão');
      return false;
    }
  };

  const terminateAllSessions = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('secure_sessions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      await logSecurityEvent('all_sessions_terminated');
      toast.success('Todas as sessões foram terminadas');
      return true;
    } catch (error) {
      console.error('Error terminating all sessions:', error);
      toast.error('Erro ao terminar todas as sessões');
      return false;
    }
  };

  // Helper functions
  const generateDeviceFingerprint = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  };

  const getClientIdentifier = async (): Promise<string> => {
    const fingerprint = await generateDeviceFingerprint();
    return fingerprint;
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return '0.0.0.0';
    }
  };

  const calculateRiskScore = (eventType: string, metadata?: any): number => {
    let score = 0;
    
    switch (eventType) {
      case 'login_failed':
        score = 30;
        break;
      case '2fa_failed':
        score = 40;
        break;
      case 'suspicious_activity':
        score = 80;
        break;
      case 'account_locked':
        score = 90;
        break;
      default:
        score = 10;
    }
    
    // Increase score based on metadata
    if (metadata?.attempts > 3) score += 20;
    if (metadata?.new_location) score += 15;
    if (metadata?.unusual_time) score += 10;
    
    return Math.min(score, 100);
  };

  return (
    <SecurityContext.Provider
      value={{
        trustedDevices,
        securityLogs,
        isLoading,
        trustDevice,
        removeTrustedDevice,
        isDeviceTrusted,
        checkRateLimit,
        logSecurityEvent,
        getActiveSessions,
        terminateSession,
        terminateAllSessions,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};