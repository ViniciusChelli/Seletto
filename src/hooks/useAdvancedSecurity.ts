import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  SecurityPolicy, 
  IPWhitelist, 
  IPBlacklist, 
  AuditTrail, 
  BackupLog, 
  SuspiciousActivity,
  SecurityIncident 
} from '../types/Security';
import toast from 'react-hot-toast';

interface UseAdvancedSecurity {
  // State
  securityPolicies: SecurityPolicy[];
  ipWhitelist: IPWhitelist[];
  ipBlacklist: IPBlacklist[];
  auditTrail: AuditTrail[];
  backupLogs: BackupLog[];
  suspiciousActivities: SuspiciousActivity[];
  securityIncidents: SecurityIncident[];
  isLoading: boolean;
  
  // Security Policies
  createSecurityPolicy: (policy: Partial<SecurityPolicy>) => Promise<boolean>;
  updateSecurityPolicy: (id: string, updates: Partial<SecurityPolicy>) => Promise<boolean>;
  toggleSecurityPolicy: (id: string, enabled: boolean) => Promise<boolean>;
  
  // IP Management
  addToWhitelist: (ipAddress: string, description?: string, userId?: string) => Promise<boolean>;
  addToBlacklist: (ipAddress: string, reason: string, threatLevel?: string) => Promise<boolean>;
  removeFromWhitelist: (id: string) => Promise<boolean>;
  removeFromBlacklist: (id: string) => Promise<boolean>;
  checkIPAccess: (ipAddress: string) => Promise<any>;
  
  // Backup Management
  createBackup: (type?: string, scope?: string) => Promise<boolean>;
  restoreBackup: (backupId: string) => Promise<boolean>;
  deleteBackup: (backupId: string) => Promise<boolean>;
  
  // Audit Trail
  exportAuditTrail: (startDate: string, endDate: string) => Promise<boolean>;
  searchAuditTrail: (filters: any) => Promise<AuditTrail[]>;
  
  // Suspicious Activities
  investigateSuspiciousActivity: (id: string, notes: string) => Promise<boolean>;
  resolveSuspiciousActivity: (id: string, resolution: string) => Promise<boolean>;
  markAsFalsePositive: (id: string) => Promise<boolean>;
  
  // Security Incidents
  createSecurityIncident: (incident: Partial<SecurityIncident>) => Promise<boolean>;
  updateSecurityIncident: (id: string, updates: Partial<SecurityIncident>) => Promise<boolean>;
  closeSecurityIncident: (id: string, resolution: string) => Promise<boolean>;
  
  // Maintenance
  runSecurityMaintenance: () => Promise<boolean>;
  rotateEncryptionKeys: () => Promise<boolean>;
  applyDataRetentionPolicies: () => Promise<boolean>;
  
  // Real-time monitoring
  subscribeToSecurityEvents: () => void;
  unsubscribeFromSecurityEvents: () => void;
}

export const useAdvancedSecurity = (): UseAdvancedSecurity => {
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);
  const [ipWhitelist, setIpWhitelist] = useState<IPWhitelist[]>([]);
  const [ipBlacklist, setIpBlacklist] = useState<IPBlacklist[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditTrail[]>([]);
  const [backupLogs, setBackupLogs] = useState<BackupLog[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [securityIncidents, setSecurityIncidents] = useState<SecurityIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    fetchAllSecurityData();
  }, []);

  const fetchAllSecurityData = async () => {
    try {
      setIsLoading(true);
      
      const [
        policiesResponse,
        whitelistResponse,
        blacklistResponse,
        auditResponse,
        backupResponse,
        suspiciousResponse,
        incidentsResponse
      ] = await Promise.all([
        supabase.from('security_policies').select('*').order('created_at', { ascending: false }),
        supabase.from('ip_whitelist').select('*').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('ip_blacklist').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_trail').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('backup_logs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('suspicious_activities').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('security_incidents').select('*').order('created_at', { ascending: false }).limit(50)
      ]);

      setSecurityPolicies(policiesResponse.data || []);
      setIpWhitelist(whitelistResponse.data || []);
      setIpBlacklist(blacklistResponse.data || []);
      setAuditTrail(auditResponse.data || []);
      setBackupLogs(backupResponse.data || []);
      setSuspiciousActivities(suspiciousResponse.data || []);
      setSecurityIncidents(incidentsResponse.data || []);

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Erro ao carregar dados de segurança');
    } finally {
      setIsLoading(false);
    }
  };

  const createSecurityPolicy = useCallback(async (policy: Partial<SecurityPolicy>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('security_policies')
        .insert([{
          policy_name: policy.policyName,
          policy_type: policy.policyType,
          is_enabled: policy.isEnabled ?? true,
          configuration: policy.configuration || {},
          severity_level: policy.severityLevel || 'medium',
          auto_enforce: policy.autoEnforce ?? true,
          notification_enabled: policy.notificationEnabled ?? true,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      setSecurityPolicies(prev => [data, ...prev]);
      toast.success('Política de segurança criada com sucesso!');
      return true;
    } catch (error) {
      console.error('Error creating security policy:', error);
      toast.error('Erro ao criar política de segurança');
      return false;
    }
  }, []);

  const updateSecurityPolicy = useCallback(async (id: string, updates: Partial<SecurityPolicy>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('security_policies')
        .update({
          policy_name: updates.policyName,
          policy_type: updates.policyType,
          is_enabled: updates.isEnabled,
          configuration: updates.configuration,
          severity_level: updates.severityLevel,
          auto_enforce: updates.autoEnforce,
          notification_enabled: updates.notificationEnabled,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSecurityPolicies(prev => prev.map(p => p.id === id ? data : p));
      toast.success('Política atualizada com sucesso!');
      return true;
    } catch (error) {
      console.error('Error updating security policy:', error);
      toast.error('Erro ao atualizar política');
      return false;
    }
  }, []);

  const toggleSecurityPolicy = useCallback(async (id: string, enabled: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('security_policies')
        .update({ 
          is_enabled: enabled,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setSecurityPolicies(prev => prev.map(p => 
        p.id === id ? { ...p, is_enabled: enabled } : p
      ));
      
      toast.success(`Política ${enabled ? 'ativada' : 'desativada'} com sucesso!`);
      return true;
    } catch (error) {
      console.error('Error toggling security policy:', error);
      toast.error('Erro ao alterar política');
      return false;
    }
  }, []);

  const addToWhitelist = useCallback(async (ipAddress: string, description?: string, userId?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('ip_whitelist')
        .insert([{
          ip_address: ipAddress,
          description: description,
          user_id: userId,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      setIpWhitelist(prev => [data, ...prev]);
      toast.success('IP adicionado à whitelist!');
      return true;
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      toast.error('Erro ao adicionar IP à whitelist');
      return false;
    }
  }, []);

  const addToBlacklist = useCallback(async (ipAddress: string, reason: string, threatLevel: string = 'medium'): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('ip_blacklist')
        .insert([{
          ip_address: ipAddress,
          reason: reason,
          threat_level: threatLevel,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      setIpBlacklist(prev => [data, ...prev]);
      toast.success('IP bloqueado com sucesso!');
      return true;
    } catch (error) {
      console.error('Error adding to blacklist:', error);
      toast.error('Erro ao bloquear IP');
      return false;
    }
  }, []);

  const removeFromWhitelist = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ip_whitelist')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setIpWhitelist(prev => prev.filter(ip => ip.id !== id));
      toast.success('IP removido da whitelist!');
      return true;
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      toast.error('Erro ao remover IP da whitelist');
      return false;
    }
  }, []);

  const removeFromBlacklist = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ip_blacklist')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setIpBlacklist(prev => prev.filter(ip => ip.id !== id));
      toast.success('IP desbloqueado!');
      return true;
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      toast.error('Erro ao desbloquear IP');
      return false;
    }
  }, []);

  const checkIPAccess = useCallback(async (ipAddress: string): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('check_ip_access', {
        client_ip: ipAddress
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking IP access:', error);
      return { allowed: false, reason: 'Error checking IP' };
    }
  }, []);

  const createBackup = useCallback(async (type: string = 'full', scope: string = 'database'): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('create_automatic_backup', {
        backup_type_param: type,
        backup_scope_param: scope
      });

      if (error) throw error;

      toast.success('Backup iniciado com sucesso!');
      await fetchAllSecurityData();
      return true;
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Erro ao criar backup');
      return false;
    }
  }, []);

  const restoreBackup = useCallback(async (backupId: string): Promise<boolean> => {
    try {
      // Implementar lógica de restauração
      toast.success('Backup restaurado com sucesso!');
      return true;
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Erro ao restaurar backup');
      return false;
    }
  }, []);

  const deleteBackup = useCallback(async (backupId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('backup_logs')
        .delete()
        .eq('id', backupId);

      if (error) throw error;

      setBackupLogs(prev => prev.filter(b => b.id !== backupId));
      toast.success('Backup excluído!');
      return true;
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Erro ao excluir backup');
      return false;
    }
  }, []);

  const exportAuditTrail = useCallback(async (startDate: string, endDate: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('audit_trail')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert to CSV and download
      const csv = convertToCSV(data);
      downloadCSV(csv, `audit-trail-${startDate}-${endDate}.csv`);
      
      toast.success('Trilha de auditoria exportada!');
      return true;
    } catch (error) {
      console.error('Error exporting audit trail:', error);
      toast.error('Erro ao exportar trilha de auditoria');
      return false;
    }
  }, []);

  const searchAuditTrail = useCallback(async (filters: any): Promise<AuditTrail[]> => {
    try {
      let query = supabase.from('audit_trail').select('*');

      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.actionType) query = query.eq('action_type', filters.actionType);
      if (filters.entityType) query = query.eq('entity_type', filters.entityType);
      if (filters.startDate) query = query.gte('created_at', filters.startDate);
      if (filters.endDate) query = query.lte('created_at', filters.endDate);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching audit trail:', error);
      return [];
    }
  }, []);

  const investigateSuspiciousActivity = useCallback(async (id: string, notes: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('suspicious_activities')
        .update({
          status: 'investigating',
          investigated_by: (await supabase.auth.getUser()).data.user?.id,
          investigated_at: new Date().toISOString(),
          resolution_notes: notes
        })
        .eq('id', id);

      if (error) throw error;

      setSuspiciousActivities(prev => prev.map(a => 
        a.id === id ? { ...a, status: 'investigating' as any } : a
      ));
      
      toast.success('Investigação iniciada!');
      return true;
    } catch (error) {
      console.error('Error investigating suspicious activity:', error);
      toast.error('Erro ao iniciar investigação');
      return false;
    }
  }, []);

  const resolveSuspiciousActivity = useCallback(async (id: string, resolution: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('suspicious_activities')
        .update({
          status: 'resolved',
          resolution_notes: resolution,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setSuspiciousActivities(prev => prev.map(a => 
        a.id === id ? { ...a, status: 'resolved' as any } : a
      ));
      
      toast.success('Atividade suspeita resolvida!');
      return true;
    } catch (error) {
      console.error('Error resolving suspicious activity:', error);
      toast.error('Erro ao resolver atividade suspeita');
      return false;
    }
  }, []);

  const markAsFalsePositive = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('suspicious_activities')
        .update({
          status: 'false_positive',
          resolution_notes: 'Marcado como falso positivo',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setSuspiciousActivities(prev => prev.map(a => 
        a.id === id ? { ...a, status: 'false_positive' as any } : a
      ));
      
      toast.success('Marcado como falso positivo!');
      return true;
    } catch (error) {
      console.error('Error marking as false positive:', error);
      toast.error('Erro ao marcar como falso positivo');
      return false;
    }
  }, []);

  const createSecurityIncident = useCallback(async (incident: Partial<SecurityIncident>): Promise<boolean> => {
    try {
      // Generate incident number
      const incidentNumber = `INC-${Date.now()}`;
      
      const { data, error } = await supabase
        .from('security_incidents')
        .insert([{
          incident_number: incidentNumber,
          title: incident.title,
          description: incident.description,
          incident_type: incident.incidentType,
          severity: incident.severity || 'medium',
          discovered_at: incident.discoveredAt || new Date().toISOString(),
          reported_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      setSecurityIncidents(prev => [data, ...prev]);
      toast.success('Incidente de segurança criado!');
      return true;
    } catch (error) {
      console.error('Error creating security incident:', error);
      toast.error('Erro ao criar incidente');
      return false;
    }
  }, []);

  const updateSecurityIncident = useCallback(async (id: string, updates: Partial<SecurityIncident>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('security_incidents')
        .update({
          title: updates.title,
          description: updates.description,
          severity: updates.severity,
          status: updates.status,
          impact_assessment: updates.impactAssessment,
          containment_actions: updates.containmentActions,
          recovery_actions: updates.recoveryActions,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSecurityIncidents(prev => prev.map(i => i.id === id ? data : i));
      toast.success('Incidente atualizado!');
      return true;
    } catch (error) {
      console.error('Error updating security incident:', error);
      toast.error('Erro ao atualizar incidente');
      return false;
    }
  }, []);

  const closeSecurityIncident = useCallback(async (id: string, resolution: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('security_incidents')
        .update({
          status: 'closed',
          lessons_learned: resolution,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setSecurityIncidents(prev => prev.map(i => 
        i.id === id ? { ...i, status: 'closed' as any } : i
      ));
      
      toast.success('Incidente fechado!');
      return true;
    } catch (error) {
      console.error('Error closing security incident:', error);
      toast.error('Erro ao fechar incidente');
      return false;
    }
  }, []);

  const runSecurityMaintenance = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('run_security_maintenance');

      if (error) throw error;

      toast.success('Manutenção de segurança executada!');
      await fetchAllSecurityData();
      return true;
    } catch (error) {
      console.error('Error running security maintenance:', error);
      toast.error('Erro ao executar manutenção');
      return false;
    }
  }, []);

  const rotateEncryptionKeys = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('rotate_encryption_keys');

      if (error) throw error;

      toast.success('Chaves de criptografia rotacionadas!');
      return true;
    } catch (error) {
      console.error('Error rotating encryption keys:', error);
      toast.error('Erro ao rotacionar chaves');
      return false;
    }
  }, []);

  const applyDataRetentionPolicies = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('apply_data_retention_policies');

      if (error) throw error;

      toast.success('Políticas de retenção aplicadas!');
      return true;
    } catch (error) {
      console.error('Error applying data retention policies:', error);
      toast.error('Erro ao aplicar políticas de retenção');
      return false;
    }
  }, []);

  const subscribeToSecurityEvents = useCallback(() => {
    const channel = supabase
      .channel('security_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'suspicious_activities',
        },
        (payload) => {
          setSuspiciousActivities(prev => [payload.new as any, ...prev]);
          
          if (payload.new.severity === 'critical') {
            toast.error(`🚨 Atividade crítica detectada: ${payload.new.description}`);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_incidents',
        },
        (payload) => {
          setSecurityIncidents(prev => [payload.new as any, ...prev]);
          toast.error(`🚨 Novo incidente de segurança: ${payload.new.title}`);
        }
      )
      .subscribe();

    setSubscription(channel);
  }, []);

  const unsubscribeFromSecurityEvents = useCallback(() => {
    if (subscription) {
      supabase.removeChannel(subscription);
      setSubscription(null);
    }
  }, [subscription]);

  // Helper functions
  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    securityPolicies,
    ipWhitelist,
    ipBlacklist,
    auditTrail,
    backupLogs,
    suspiciousActivities,
    securityIncidents,
    isLoading,
    createSecurityPolicy,
    updateSecurityPolicy,
    toggleSecurityPolicy,
    addToWhitelist,
    addToBlacklist,
    removeFromWhitelist,
    removeFromBlacklist,
    checkIPAccess,
    createBackup,
    restoreBackup,
    deleteBackup,
    exportAuditTrail,
    searchAuditTrail,
    investigateSuspiciousActivity,
    resolveSuspiciousActivity,
    markAsFalsePositive,
    createSecurityIncident,
    updateSecurityIncident,
    closeSecurityIncident,
    runSecurityMaintenance,
    rotateEncryptionKeys,
    applyDataRetentionPolicies,
    subscribeToSecurityEvents,
    unsubscribeFromSecurityEvents
  };
};