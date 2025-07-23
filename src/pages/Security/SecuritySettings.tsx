import React, { useState } from 'react';
import { Shield, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { useSecurity } from '../../contexts/SecurityContext';
import toast from 'react-hot-toast';

const SecuritySettings: React.FC = () => {
  const {
    trustedDevices,
    securityLogs,
    removeTrustedDevice,
    getActiveSessions,
    terminateSession,
    terminateAllSessions
  } = useSecurity();

  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [showSessions, setShowSessions] = useState(false);

  const handleRemoveDevice = async (deviceId: string, deviceName: string) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover o dispositivo "${deviceName}" da lista de confiáveis?`
    );
    
    if (confirmed) {
      await removeTrustedDevice(deviceId);
    }
  };

  const loadActiveSessions = async () => {
    const sessions = await getActiveSessions();
    setActiveSessions(sessions);
    setShowSessions(true);
  };

  const handleTerminateSession = async (sessionId: string) => {
    await terminateSession(sessionId);
    loadActiveSessions(); // Refresh the list
  };

  const handleTerminateAllSessions = async () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja terminar todas as sessões ativas? Você precisará fazer login novamente em todos os dispositivos.'
    );
    
    if (confirmed) {
      await terminateAllSessions();
      setActiveSessions([]);
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

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'login_success': 'Login realizado',
      'login_failed': 'Falha no login',
      'logout': 'Logout',
      'password_changed': 'Senha alterada',
      'device_trusted': 'Dispositivo confiável adicionado',
      'device_removed': 'Dispositivo removido'
    };
    
    return labels[eventType] || eventType;
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações de Segurança</h1>
        <p className="text-gray-600">Gerencie a segurança da sua conta e dispositivos</p>
      </div>

      {/* Trusted Devices */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Dispositivos Confiáveis</h2>
            <p className="text-sm text-gray-600">
              Dispositivos que você usa regularmente
            </p>
          </div>
          <span className="text-sm text-gray-500">
            {trustedDevices.length} dispositivos
          </span>
        </div>

        {trustedDevices.length === 0 ? (
          <div className="text-center py-8">
            <Shield size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-sm font-medium text-gray-900">Nenhum dispositivo confiável</h3>
            <p className="text-sm text-gray-500">
              Dispositivos confiáveis aparecerão aqui conforme você usa o sistema.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trustedDevices.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Shield size={20} className="text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium">{device.deviceName}</div>
                    <div className="text-sm text-gray-600">
                      Último acesso: {formatDate(device.lastUsedAt)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Expira em: {formatDate(device.expiresAt)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveDevice(device.id, device.deviceName)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Sessões Ativas</h2>
            <p className="text-sm text-gray-600">
              Gerencie onde você está logado
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={loadActiveSessions}
              className="btn btn-ghost border border-gray-300"
            >
              {showSessions ? 'Ocultar' : 'Ver sessões'}
            </button>
            {activeSessions.length > 0 && (
              <button
                onClick={handleTerminateAllSessions}
                className="btn btn-danger"
              >
                Terminar todas
              </button>
            )}
          </div>
        </div>

        {showSessions && (
          <div className="space-y-3">
            {activeSessions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Nenhuma sessão ativa encontrada
              </p>
            ) : (
              activeSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium">
                      {session.user_agent?.includes('Chrome') ? 'Chrome' : 
                       session.user_agent?.includes('Firefox') ? 'Firefox' : 
                       session.user_agent?.includes('Safari') ? 'Safari' : 'Navegador'}
                    </div>
                    <div className="text-sm text-gray-600">
                      IP: {session.ip_address}
                    </div>
                    <div className="text-xs text-gray-500">
                      Última atividade: {formatDate(session.last_activity)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleTerminateSession(session.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Terminar
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Security Logs */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Log de Segurança</h2>
          <p className="text-sm text-gray-600">
            Histórico de atividades de segurança e acesso da sua conta
          </p>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {securityLogs.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              Nenhum evento de segurança registrado
            </p>
          ) : (
            securityLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${getRiskScoreColor(log.riskScore).split(' ')[1]}`} />
                  <div>
                    <div className="font-medium text-sm">
                      {getEventTypeLabel(log.eventType)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatDate(log.createdAt)}
                      {log.ipAddress && ` • ${log.ipAddress}`}
                    </div>
                  </div>
                </div>
                <div className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskScoreColor(log.riskScore)}`}>
                  Risco: {log.riskScore}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;