import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Shield, 
  Server, 
  Key, 
  Eye, 
  AlertTriangle, 
  Download, 
  Upload,
  Lock,
  Unlock,
  Globe,
  Database,
  FileText,
  Activity,
  Settings as SettingsIcon
} from 'lucide-react';
import { 
  SecurityPolicy, 
  IPWhitelist, 
  IPBlacklist, 
  AuditTrail, 
  BackupLog, 
  SuspiciousActivity,
  SecurityIncident,
  ACTIVITY_TYPES,
  INCIDENT_TYPES,
  THREAT_LEVELS
} from '../../types/Security';
import PermissionGuard from '../../components/Auth/PermissionGuard';
import toast from 'react-hot-toast';

const AdvancedSecurity: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);
  const [ipWhitelist, setIpWhitelist] = useState<IPWhitelist[]>([]);
  const [ipBlacklist, setIpBlacklist] = useState<IPBlacklist[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditTrail[]>([]);
  const [backupLogs, setBackupLogs] = useState<BackupLog[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [securityIncidents, setSecurityIncidents] = useState<SecurityIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPolicies: 0,
    activePolicies: 0,
    whitelistedIPs: 0,
    blacklistedIPs: 0,
    auditEntries: 0,
    suspiciousActivities: 0,
    openIncidents: 0,
    lastBackup: null as string | null
  });

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch security policies
      const { data: policiesData } = await supabase
        .from('security_policies')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch IP whitelist
      const { data: whitelistData } = await supabase
        .from('ip_whitelist')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Fetch IP blacklist
      const { data: blacklistData } = await supabase
        .from('ip_blacklist')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch recent audit trail
      const { data: auditData } = await supabase
        .from('audit_trail')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch backup logs
      const { data: backupData } = await supabase
        .from('backup_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch suspicious activities
      const { data: suspiciousData } = await supabase
        .from('suspicious_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch security incidents
      const { data: incidentsData } = await supabase
        .from('security_incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setSecurityPolicies(policiesData || []);
      setIpWhitelist(whitelistData || []);
      setIpBlacklist(blacklistData || []);
      setAuditTrail(auditData || []);
      setBackupLogs(backupData || []);
      setSuspiciousActivities(suspiciousData || []);
      setSecurityIncidents(incidentsData || []);

      // Calculate stats
      setStats({
        totalPolicies: policiesData?.length || 0,
        activePolicies: policiesData?.filter(p => p.is_enabled).length || 0,
        whitelistedIPs: whitelistData?.length || 0,
        blacklistedIPs: blacklistData?.length || 0,
        auditEntries: auditData?.length || 0,
        suspiciousActivities: suspiciousData?.filter(a => a.status === 'open').length || 0,
        openIncidents: incidentsData?.filter(i => ['open', 'investigating'].includes(i.status)).length || 0,
        lastBackup: backupData?.[0]?.completed_at || null
      });

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Erro ao carregar dados de segurança');
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      const { data, error } = await supabase.rpc('create_automatic_backup', {
        backup_type_param: 'full',
        backup_scope_param: 'complete'
      });

      if (error) throw error;

      toast.success('Backup iniciado com sucesso!');
      fetchSecurityData();
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Erro ao criar backup');
    }
  };

  const runSecurityMaintenance = async () => {
    try {
      const { error } = await supabase.rpc('run_security_maintenance');

      if (error) throw error;

      toast.success('Manutenção de segurança executada!');
      fetchSecurityData();
    } catch (error) {
      console.error('Error running security maintenance:', error);
      toast.error('Erro ao executar manutenção');
    }
  };

  const blockIP = async (ipAddress: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('ip_blacklist')
        .insert([{
          ip_address: ipAddress,
          reason: reason,
          threat_level: 'high',
          auto_blocked: false,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;

      toast.success('IP bloqueado com sucesso!');
      fetchSecurityData();
    } catch (error) {
      console.error('Error blocking IP:', error);
      toast.error('Erro ao bloquear IP');
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'open': return 'text-orange-600 bg-orange-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="security.view">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Segurança Avançada</h1>
            <p className="text-gray-600">Controle total de segurança, auditoria e backup</p>
          </div>
          <div className="flex space-x-3">
            <PermissionGuard permission="backup.admin" showError={false}>
              <button
                onClick={createBackup}
                className="btn btn-primary flex items-center"
              >
                <Database size={20} className="mr-2" />
                Backup Manual
              </button>
            </PermissionGuard>
            <PermissionGuard permission="security.admin" showError={false}>
              <button
                onClick={runSecurityMaintenance}
                className="btn btn-secondary flex items-center"
              >
                <SettingsIcon size={20} className="mr-2" />
                Manutenção
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Políticas Ativas</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.activePolicies}/{stats.totalPolicies}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">IPs Permitidos</h3>
                <p className="text-2xl font-bold text-green-600">{stats.whitelistedIPs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Atividades Suspeitas</h3>
                <p className="text-2xl font-bold text-red-600">{stats.suspiciousActivities}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-purple-800">Último Backup</h3>
                <p className="text-sm font-medium text-purple-600">
                  {stats.lastBackup ? formatDate(stats.lastBackup) : 'Nunca'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Visão Geral', icon: Shield },
                { id: 'policies', label: 'Políticas', icon: SettingsIcon },
                { id: 'ip-control', label: 'Controle de IP', icon: Globe },
                { id: 'audit', label: 'Auditoria', icon: FileText },
                { id: 'backup', label: 'Backup', icon: Database },
                { id: 'monitoring', label: 'Monitoramento', icon: Activity },
                { id: 'incidents', label: 'Incidentes', icon: AlertTriangle }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon size={16} className="mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold">Status de Segurança</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Políticas de Segurança</h3>
                    {securityPolicies.slice(0, 5).map((policy) => (
                      <div key={policy.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <div className="font-medium">{policy.policy_name}</div>
                          <div className="text-sm text-gray-500">{policy.policy_type}</div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(policy.severity_level)}`}>
                            {policy.severity_level}
                          </span>
                          <div className="ml-2">
                            {policy.is_enabled ? (
                              <Lock size={16} className="text-green-500" />
                            ) : (
                              <Unlock size={16} className="text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Atividades Recentes</h3>
                    {auditTrail.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                        <div>
                          <div className="font-medium">{entry.action_type}</div>
                          <div className="text-sm text-gray-500">{entry.entity_type}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(entry.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Policies Tab */}
            {activeTab === 'policies' && (
              <PermissionGuard permission="security.admin">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Políticas de Segurança</h2>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Política
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Severidade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {securityPolicies.map((policy) => (
                          <tr key={policy.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{policy.policy_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {policy.policy_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(policy.severity_level)}`}>
                                {policy.severity_level}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {policy.is_enabled ? (
                                <span className="text-green-600 flex items-center">
                                  <Lock size={16} className="mr-1" />
                                  Ativa
                                </span>
                              ) : (
                                <span className="text-red-600 flex items-center">
                                  <Unlock size={16} className="mr-1" />
                                  Inativa
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900">
                                Editar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </PermissionGuard>
            )}

            {/* IP Control Tab */}
            {activeTab === 'ip-control' && (
              <PermissionGuard permission="ip.manage">
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Controle de Acesso por IP</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Whitelist */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">IPs Permitidos (Whitelist)</h3>
                      <div className="space-y-2">
                        {ipWhitelist.map((ip) => (
                          <div key={ip.id} className="flex items-center justify-between p-3 border border-green-200 rounded bg-green-50">
                            <div>
                              <div className="font-medium">{ip.ip_address}</div>
                              <div className="text-sm text-gray-500">{ip.description}</div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {ip.expires_at ? `Expira: ${formatDate(ip.expires_at)}` : 'Permanente'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Blacklist */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">IPs Bloqueados (Blacklist)</h3>
                      <div className="space-y-2">
                        {ipBlacklist.map((ip) => (
                          <div key={ip.id} className="flex items-center justify-between p-3 border border-red-200 rounded bg-red-50">
                            <div>
                              <div className="font-medium">{ip.ip_address}</div>
                              <div className="text-sm text-gray-500">{ip.reason}</div>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(ip.threat_level)}`}>
                                {THREAT_LEVELS[ip.threat_level]}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                {ip.incident_count} incidente(s)
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </PermissionGuard>
            )}

            {/* Audit Tab */}
            {activeTab === 'audit' && (
              <PermissionGuard permission="audit.view">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Trilha de Auditoria</h2>
                    <PermissionGuard permission="audit.export" showError={false}>
                      <button className="btn btn-secondary flex items-center">
                        <Download size={16} className="mr-2" />
                        Exportar
                      </button>
                    </PermissionGuard>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Ação
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Entidade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Usuário
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            IP
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Risco
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Data
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {auditTrail.map((entry) => (
                          <tr key={entry.id} className={entry.is_sensitive ? 'bg-yellow-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{entry.action_type}</div>
                              {entry.is_sensitive && (
                                <span className="text-xs text-orange-600">Sensível</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.entity_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.user_id || 'Sistema'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {entry.ip_address || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                entry.risk_score > 70 ? 'bg-red-100 text-red-800' :
                                entry.risk_score > 40 ? 'bg-orange-100 text-orange-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {entry.risk_score}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(entry.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </PermissionGuard>
            )}

            {/* Backup Tab */}
            {activeTab === 'backup' && (
              <PermissionGuard permission="backup.view">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Logs de Backup</h2>
                    <PermissionGuard permission="backup.admin" showError={false}>
                      <div className="flex space-x-2">
                        <button
                          onClick={createBackup}
                          className="btn btn-primary flex items-center"
                        >
                          <Upload size={16} className="mr-2" />
                          Backup Manual
                        </button>
                        <button className="btn btn-secondary flex items-center">
                          <Download size={16} className="mr-2" />
                          Restaurar
                        </button>
                      </div>
                    </PermissionGuard>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Escopo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Tamanho
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Data
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {backupLogs.map((backup) => (
                          <tr key={backup.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{backup.backup_type}</div>
                              <div className="text-sm text-gray-500">
                                {backup.encryption_enabled && '🔒'} 
                                {backup.compression_enabled && '📦'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {backup.backup_scope}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {backup.file_size_bytes ? formatFileSize(backup.file_size_bytes) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(backup.status)}`}>
                                {backup.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(backup.started_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {backup.status === 'completed' && (
                                <button className="text-blue-600 hover:text-blue-900">
                                  Download
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </PermissionGuard>
            )}

            {/* Monitoring Tab */}
            {activeTab === 'monitoring' && (
              <PermissionGuard permission="security.monitor">
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold">Monitoramento de Atividades Suspeitas</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                        <div>
                          <h3 className="text-lg font-semibold text-red-800">Críticas</h3>
                          <p className="text-2xl font-bold text-red-600">
                            {suspiciousActivities.filter(a => a.severity === 'critical').length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Eye className="h-8 w-8 text-orange-600 mr-3" />
                        <div>
                          <h3 className="text-lg font-semibold text-orange-800">Em Investigação</h3>
                          <p className="text-2xl font-bold text-orange-600">
                            {suspiciousActivities.filter(a => a.status === 'investigating').length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Shield className="h-8 w-8 text-green-600 mr-3" />
                        <div>
                          <h3 className="text-lg font-semibold text-green-800">Resolvidas</h3>
                          <p className="text-2xl font-bold text-green-600">
                            {suspiciousActivities.filter(a => a.status === 'resolved').length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Atividade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Severidade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Confiança
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Data
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {suspiciousActivities.map((activity) => (
                          <tr key={activity.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {ACTIVITY_TYPES[activity.activity_type]}
                              </div>
                              <div className="text-sm text-gray-500">{activity.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(activity.severity)}`}>
                                {activity.severity}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {(activity.confidence_score * 100).toFixed(0)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.status)}`}>
                                {activity.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(activity.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <PermissionGuard permission="security.investigate" showError={false}>
                                <button className="text-blue-600 hover:text-blue-900 mr-3">
                                  Investigar
                                </button>
                              </PermissionGuard>
                              {activity.ip_address && (
                                <button
                                  onClick={() => blockIP(activity.ip_address!, 'Atividade suspeita detectada')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Bloquear IP
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </PermissionGuard>
            )}

            {/* Incidents Tab */}
            {activeTab === 'incidents' && (
              <PermissionGuard permission="security.incidents">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Incidentes de Segurança</h2>
                    <button className="btn btn-primary">
                      Novo Incidente
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Incidente
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Severidade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Descoberto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {securityIncidents.map((incident) => (
                          <tr key={incident.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{incident.incident_number}</div>
                              <div className="text-sm text-gray-500">{incident.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {INCIDENT_TYPES[incident.incident_type]}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(incident.severity)}`}>
                                {incident.severity}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                                {incident.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(incident.discovered_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900">
                                Ver Detalhes
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </PermissionGuard>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default AdvancedSecurity;