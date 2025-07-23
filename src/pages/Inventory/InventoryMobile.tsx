import React, { useState, useEffect } from 'react';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { supabase } from '../../lib/supabase';
import { Scan, Package, CheckCircle, AlertTriangle, Smartphone, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface InventorySession {
  id: string;
  sessionName: string;
  status: string;
  totalItemsExpected: number;
  totalItemsCounted: number;
}

const InventoryMobile: React.FC = () => {
  const { isScanning, lastScan, startScanning, stopScanning, manualScan } = useBarcodeScanner();
  const [currentSession, setCurrentSession] = useState<InventorySession | null>(null);
  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingScans, setPendingScans] = useState<any[]>([]);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [manualQuantity, setManualQuantity] = useState(1);
  const [currentLocation, setCurrentLocation] = useState('');

  useEffect(() => {
    fetchSessions();
    
    // Monitor connection status
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingScans();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (lastScan && lastScan.found && currentSession) {
      handleProductScan(lastScan.barcode, 1);
    }
  }, [lastScan, currentSession]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_counts')
        .select('*')
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const createSession = async () => {
    if (!newSessionName.trim()) {
      toast.error('Nome da sessão é obrigatório');
      return;
    }

    try {
      try {
        const { data, error } = await supabase.rpc('start_inventory_count', {
          store_uuid: 'loja-principal-id',
          session_name_param: newSessionName.trim(),
          count_type_param: 'full'
        });

        if (error) throw error;

        toast.success('Sessão de inventário criada!');
        setShowNewSession(false);
        setNewSessionName('');
        fetchSessions();
      } catch (rpcError) {
        console.error('RPC function not available:', rpcError);
        // Create session manually if RPC doesn't exist
        const { data, error } = await supabase
          .from('inventory_counts')
          .insert([{
            session_name: newSessionName.trim(),
            count_type: 'full',
            status: 'in_progress',
            started_by: (await supabase.auth.getUser()).data.user?.id
          }])
          .select()
          .single();

        if (error) throw error;

        toast.success('Sessão de inventário criada!');
        setShowNewSession(false);
        setNewSessionName('');
        fetchSessions();
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Erro ao criar sessão');
    }
  };

  const selectSession = (session: InventorySession) => {
    setCurrentSession(session);
    toast.success(`Sessão "${session.sessionName}" selecionada`);
  };

  const handleProductScan = async (barcode: string, quantity: number) => {
    if (!currentSession) {
      toast.error('Selecione uma sessão de inventário');
      return;
    }

    const scanData = {
      sessionId: currentSession.id,
      barcode,
      quantity,
      location: currentLocation,
      timestamp: new Date().toISOString(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        online: isOnline
      }
    };

    if (isOnline) {
      try {
        const success = await supabase.rpc('scan_product_inventory', {
          count_uuid: currentSession.id,
          barcode_param: barcode,
          quantity_param: quantity,
          location_param: currentLocation,
          device_info_param: scanData.deviceInfo
        });

        if (success) {
          toast.success(`Produto escaneado: ${quantity} unidade(s)`);
          updateSessionCounts();
        } else {
          toast.error('Produto não encontrado');
        }
      } catch (error) {
        console.error('Error scanning product:', error);
        // Salvar para sincronizar depois
        setPendingScans(prev => [...prev, scanData]);
        toast.warning('Scan salvo offline - será sincronizado quando conectar');
      }
    } else {
      // Modo offline - salvar localmente
      setPendingScans(prev => [...prev, scanData]);
      toast.warning('Scan salvo offline - será sincronizado quando conectar');
    }
  };

  const syncPendingScans = async () => {
    if (pendingScans.length === 0) return;

    try {
      for (const scan of pendingScans) {
        await supabase.rpc('scan_product_inventory', {
          count_uuid: scan.sessionId,
          barcode_param: scan.barcode,
          quantity_param: scan.quantity,
          location_param: scan.location,
          device_info_param: scan.deviceInfo
        });
      }

      setPendingScans([]);
      toast.success(`${pendingScans.length} scans sincronizados!`);
      updateSessionCounts();
    } catch (error) {
      console.error('Error syncing scans:', error);
      toast.error('Erro ao sincronizar scans');
    }
  };

  const updateSessionCounts = async () => {
    if (!currentSession) return;

    try {
      const { data, error } = await supabase
        .from('inventory_counts')
        .select('*')
        .eq('id', currentSession.id)
        .single();

      if (error) throw error;

      setCurrentSession(data);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const handleManualScan = async () => {
    if (!manualBarcode.trim()) {
      toast.error('Digite um código de barras');
      return;
    }

    await handleProductScan(manualBarcode.trim(), manualQuantity);
    setManualBarcode('');
    setManualQuantity(1);
  };

  const completeSession = async () => {
    if (!currentSession) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja finalizar a sessão "${currentSession.sessionName}"? ` +
      'Isso irá gerar os ajustes de estoque automaticamente.'
    );

    if (!confirmed) return;

    try {
      const { data, error } = await supabase.rpc('complete_inventory_count', {
        count_uuid: currentSession.id
      });

      if (error) throw error;

      toast.success('Inventário finalizado! Ajustes aplicados ao estoque.');
      setCurrentSession(null);
      fetchSessions();
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Erro ao finalizar inventário');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header Mobile */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Smartphone size={24} className="text-primary-500 mr-2" />
            <h1 className="text-lg font-bold">Inventário Mobile</h1>
          </div>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi size={20} className="text-green-500" />
            ) : (
              <WifiOff size={20} className="text-red-500" />
            )}
            {pendingScans.length > 0 && (
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                {pendingScans.length} offline
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Session Selection */}
      {!currentSession ? (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Selecionar Sessão</h2>
            
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">Nenhuma sessão de inventário ativa</p>
                <button
                  onClick={() => setShowNewSession(true)}
                  className="btn btn-primary"
                >
                  Criar Nova Sessão
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => selectSession(session)}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{session.sessionName}</h3>
                        <p className="text-sm text-gray-500">
                          {session.totalItemsCounted} / {session.totalItemsExpected} itens
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {session.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => setShowNewSession(true)}
                  className="w-full btn btn-ghost border border-gray-300"
                >
                  Criar Nova Sessão
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Scanning Interface */
        <div className="space-y-4">
          {/* Current Session Info */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">{currentSession.sessionName}</h2>
              <button
                onClick={() => setCurrentSession(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Trocar Sessão
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {currentSession.totalItemsCounted}
                </div>
                <div className="text-sm text-gray-500">Contados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {currentSession.totalItemsExpected}
                </div>
                <div className="text-sm text-gray-500">Esperados</div>
              </div>
            </div>
          </div>

          {/* Location Input */}
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localização Atual
            </label>
            <input
              type="text"
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ex: Corredor 1, Prateleira A"
            />
          </div>

          {/* Scanner Controls */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Scanner de Código de Barras</h3>
              <button
                onClick={isScanning ? stopScanning : startScanning}
                className={`btn ${isScanning ? 'btn-danger' : 'btn-primary'} flex items-center`}
              >
                <Scan size={18} className="mr-2" />
                {isScanning ? 'Parar' : 'Iniciar'} Scanner
              </button>
            </div>

            {isScanning && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-green-700 font-medium">Scanner Ativo</span>
                </div>
                <p className="text-green-600 text-sm mt-1">
                  Aponte o leitor para o código de barras do produto
                </p>
              </div>
            )}

            {/* Manual Input */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código Manual
                </label>
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Digite o código de barras"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  value={manualQuantity}
                  onChange={(e) => setManualQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="1"
                />
              </div>
              
              <button
                onClick={handleManualScan}
                className="w-full btn btn-secondary"
                disabled={!manualBarcode.trim()}
              >
                Adicionar Produto
              </button>
            </div>
          </div>

          {/* Pending Scans (Offline) */}
          {pendingScans.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertTriangle size={20} className="text-orange-500 mr-2" />
                <h3 className="font-medium text-orange-800">Scans Pendentes (Offline)</h3>
              </div>
              <p className="text-orange-700 text-sm mb-3">
                {pendingScans.length} scan(s) serão sincronizados quando a conexão for restabelecida
              </p>
              {isOnline && (
                <button
                  onClick={syncPendingScans}
                  className="btn btn-primary text-sm"
                >
                  Sincronizar Agora
                </button>
              )}
            </div>
          )}

          {/* Complete Session */}
          <div className="bg-white rounded-lg shadow p-4">
            <button
              onClick={completeSession}
              className="w-full btn btn-primary flex items-center justify-center"
              disabled={!isOnline}
            >
              <CheckCircle size={18} className="mr-2" />
              Finalizar Inventário
            </button>
            {!isOnline && (
              <p className="text-red-500 text-sm mt-2 text-center">
                Conecte-se à internet para finalizar
              </p>
            )}
          </div>
        </div>
      )}

      {/* New Session Modal */}
      {showNewSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nova Sessão de Inventário</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Sessão
              </label>
              <input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Ex: Inventário Janeiro 2025"
                autoFocus
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowNewSession(false)}
                className="flex-1 btn btn-ghost border border-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={createSession}
                className="flex-1 btn btn-primary"
                disabled={!newSessionName.trim()}
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryMobile;