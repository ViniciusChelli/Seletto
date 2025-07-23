import React, { useState, useEffect } from 'react';
import { useAdvancedSecurity } from '../../hooks/useAdvancedSecurity';
import { 
  Shield, 
  AlertTriangle, 
  Database, 
  Activity, 
  Lock, 
  Globe,
  TrendingUp,
  TrendingDown,
  Eye,
  CheckCircle
} from 'lucide-react';

const SecurityDashboard: React.FC = () => {
  const {
    securityPolicies,
    ipWhitelist,
    ipBlacklist,
    suspiciousActivities,
    securityIncidents,
    backupLogs,
    isLoading
  } = useAdvancedSecurity();

  const [securityScore, setSecurityScore] = useState(0);
  const [threatLevel, setThreatLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('low');

  useEffect(() => {
    calculateSecurityScore();
  }, [securityPolicies, ipBlacklist, suspiciousActivities, securityIncidents, backupLogs]);

  const calculateSecurityScore = () => {
    let score = 100;
    
    // Deduct points for security issues
    const openIncidents = securityIncidents.filter(i => ['open', 'investigating'].includes(i.status));
    const criticalActivities = suspiciousActivities.filter(a => a.severity === 'critical' && a.status === 'open');
    const recentBackup = backupLogs.find(b => b.status === 'completed' && 
      new Date(b.completed_at!).getTime() > Date.now() - 24 * 60 * 60 * 1000);
    
    score -= openIncidents.length * 15;
    score -= criticalActivities.length * 20;
    score -= suspiciousActivities.filter(a => a.status === 'open').length * 5;
    score -= ipBlacklist.length * 2;
    
    if (!recentBackup) score -= 10;
    
    // Add points for security measures
    const activePolicies = securityPolicies.filter(p => p.is_enabled);
    score += Math.min(activePolicies.length * 2, 20);
    score += Math.min(ipWhitelist.length, 10);
    
    score = Math.max(0, Math.min(100, score));
    setSecurityScore(score);
    
    // Determine threat level
    if (score >= 90) setThreatLevel('low');
    else if (score >= 70) setThreatLevel('medium');
    else if (score >= 50) setThreatLevel('high');
    else setThreatLevel('critical');
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Score de Segurança',
      value: `${securityScore}%`,
      icon: Shield,
      color: getScoreColor(securityScore),
      bgColor: securityScore >= 70 ? 'bg-green-50' : 'bg-red-50',
    },
    {
      title: 'Nível de Ameaça',
      value: threatLevel.toUpperCase(),
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Políticas Ativas',
      value: `${securityPolicies.filter(p => p.is_enabled).length}/${securityPolicies.length}`,
      icon: Lock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'IPs Bloqueados',
      value: ipBlacklist.length,
      icon: Globe,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Atividades Suspeitas',
      value: suspiciousActivities.filter(a => a.status === 'open').length,
      icon: Eye,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Incidentes Abertos',
      value: securityIncidents.filter(i => ['open', 'investigating'].includes(i.status)).length,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const recentActivities = [
    ...suspiciousActivities.slice(0, 3).map(a => ({
      type: 'suspicious',
      title: 'Atividade Suspeita',
      description: a.description,
      severity: a.severity,
      time: a.created_at
    })),
    ...securityIncidents.slice(0, 2).map(i => ({
      type: 'incident',
      title: 'Incidente de Segurança',
      description: i.title,
      severity: i.severity,
      time: i.created_at
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Security Score Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard de Segurança</h2>
            <p className="text-gray-600">Monitoramento em tempo real da segurança do sistema</p>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(securityScore)}`}>
              {securityScore}%
            </div>
            <div className="text-sm text-gray-500">Score de Segurança</div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getThreatLevelColor(threatLevel)}`}>
              Nível: {threatLevel.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.title}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Security Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Security Events */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Eventos Recentes</h3>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-2" />
                <p className="text-gray-500">Nenhum evento de segurança recente</p>
              </div>
            ) : (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center p-3 border border-gray-200 rounded">
                  <div className={`p-2 rounded-full mr-3 ${
                    activity.severity === 'critical' ? 'bg-red-100' :
                    activity.severity === 'high' ? 'bg-orange-100' :
                    activity.severity === 'medium' ? 'bg-yellow-100' :
                    'bg-green-100'
                  }`}>
                    {activity.type === 'suspicious' ? (
                      <Eye size={16} className={
                        activity.severity === 'critical' ? 'text-red-600' :
                        activity.severity === 'high' ? 'text-orange-600' :
                        activity.severity === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      } />
                    ) : (
                      <AlertTriangle size={16} className={
                        activity.severity === 'critical' ? 'text-red-600' :
                        activity.severity === 'high' ? 'text-orange-600' :
                        activity.severity === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      } />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{activity.title}</div>
                    <div className="text-xs text-gray-500">{activity.description}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(activity.time).toLocaleTimeString('pt-BR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Health */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Saúde da Segurança</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Políticas Ativas</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(securityPolicies.filter(p => p.is_enabled).length / securityPolicies.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">
                  {Math.round((securityPolicies.filter(p => p.is_enabled).length / securityPolicies.length) * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Backup Recente</span>
              <div className="flex items-center">
                {backupLogs.find(b => b.status === 'completed' && 
                  new Date(b.completed_at!).getTime() > Date.now() - 24 * 60 * 60 * 1000) ? (
                  <CheckCircle size={16} className="text-green-500 mr-1" />
                ) : (
                  <AlertTriangle size={16} className="text-red-500 mr-1" />
                )}
                <span className="text-sm font-medium">
                  {backupLogs.find(b => b.status === 'completed' && 
                    new Date(b.completed_at!).getTime() > Date.now() - 24 * 60 * 60 * 1000) ? 'OK' : 'Atrasado'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Ameaças Bloqueadas</span>
              <div className="flex items-center">
                <span className="text-sm font-medium text-green-600">
                  {ipBlacklist.length} IPs bloqueados
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monitoramento</span>
              <div className="flex items-center">
                <Activity size={16} className="text-green-500 mr-1" />
                <span className="text-sm font-medium text-green-600">Ativo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Database size={20} className="mr-2 text-blue-600" />
            <span className="text-sm font-medium">Backup Manual</span>
          </button>
          
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Shield size={20} className="mr-2 text-green-600" />
            <span className="text-sm font-medium">Scan de Segurança</span>
          </button>
          
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Eye size={20} className="mr-2 text-purple-600" />
            <span className="text-sm font-medium">Auditoria</span>
          </button>
          
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Lock size={20} className="mr-2 text-orange-600" />
            <span className="text-sm font-medium">Rotacionar Chaves</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;