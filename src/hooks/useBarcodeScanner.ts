import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types/Product';
import toast from 'react-hot-toast';

interface BarcodeScanResult {
  product: Product | null;
  found: boolean;
  barcode: string;
  promotions?: any[];
}

interface UseBarcodeScanner {
  isScanning: boolean;
  lastScan: BarcodeScanResult | null;
  scanHistory: BarcodeScanResult[];
  startScanning: () => void;
  stopScanning: () => void;
  manualScan: (barcode: string) => Promise<BarcodeScanResult>;
  clearHistory: () => void;
}

export const useBarcodeScanner = (): UseBarcodeScanner => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<BarcodeScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<BarcodeScanResult[]>([]);
  const [scanBuffer, setScanBuffer] = useState('');
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);

  // Configurações do scanner
  const SCAN_TIMEOUT = 5000; // 5 segundos
  const MIN_BARCODE_LENGTH = 8;
  const MAX_BARCODE_LENGTH = 18;

  const processBarcode = useCallback(async (barcode: string): Promise<BarcodeScanResult> => {
    try {
      // Try to find product by barcode using RPC function
      try {
        const { data, error } = await supabase.rpc('find_product_by_barcode', {
          barcode_input: barcode
        });

        if (error) {
          console.error('RPC error:', error);
          // Fallback to direct product search
          return await searchProductDirectly(barcode);
        }

        if (data && data.length > 0) {
          const productData = data[0];
          
          const product: Product = {
            id: productData.product_id,
            name: productData.product_name,
            sku: barcode,
            barcode: barcode,
            category: productData.category,
            price: productData.price,
            stockQuantity: productData.stock_quantity,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          playSuccessSound();
          toast.success('Produto encontrado!');

          return {
            product,
            found: true,
            barcode,
            promotions: []
          };
        } else {
          return await searchProductDirectly(barcode);
        }
      } catch (rpcError) {
        console.error('RPC function not available:', rpcError);
        return await searchProductDirectly(barcode);
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      playErrorSound();
      toast.error('Erro ao processar código de barras');
      
      return { product: null, found: false, barcode };
    }
  }, []);

  // Fallback function to search products directly
  const searchProductDirectly = async (barcode: string): Promise<BarcodeScanResult> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        playErrorSound();
        toast.error('Produto não encontrado');
        return { product: null, found: false, barcode };
      }

      const product: Product = {
        id: data.id,
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        category: data.category,
        price: data.price,
        costPrice: data.cost_price,
        stockQuantity: data.stock_quantity,
        minStockLevel: data.min_stock_level,
        description: data.description,
        imageUrl: data.image_url,
        supplier: data.supplier,
        location: data.location,
        tags: data.tags,
        isActive: data.is_active,
        salesCount: data.sales_count,
        lastSold: data.last_sold,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      playSuccessSound();
      toast.success('Produto encontrado!');

      return {
        product,
        found: true,
        barcode,
        promotions: []
      };
    } catch (error) {
      console.error('Error in direct search:', error);
      playErrorSound();
      toast.error('Produto não encontrado');
      return { product: null, found: false, barcode };
    }
  };

  const playSuccessSound = () => {
    // Som de sucesso - beep curto
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const playErrorSound = () => {
    // Som de erro - beep longo e grave
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 300;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const handleKeyPress = useCallback(async (event: KeyboardEvent) => {
    if (!isScanning) return;

    const char = event.key;
    
    // Enter indica fim da leitura
    if (char === 'Enter') {
      if (scanBuffer.length >= MIN_BARCODE_LENGTH && scanBuffer.length <= MAX_BARCODE_LENGTH) {
        const result = await processBarcode(scanBuffer);
        setLastScan(result);
        setScanHistory(prev => [result, ...prev.slice(0, 9)]); // Manter últimas 10 leituras
      }
      setScanBuffer('');
      
      if (scanTimeout) {
        clearTimeout(scanTimeout);
        setScanTimeout(null);
      }
      return;
    }

    // Ignorar teclas especiais
    if (char.length > 1) return;

    // Adicionar caractere ao buffer
    setScanBuffer(prev => prev + char);

    // Reset timeout
    if (scanTimeout) {
      clearTimeout(scanTimeout);
    }

    // Novo timeout
    const newTimeout = setTimeout(() => {
      setScanBuffer('');
    }, SCAN_TIMEOUT);
    
    setScanTimeout(newTimeout);
  }, [isScanning, scanBuffer, scanTimeout, processBarcode]);

  useEffect(() => {
    if (isScanning) {
      document.addEventListener('keypress', handleKeyPress);
      return () => {
        document.removeEventListener('keypress', handleKeyPress);
        if (scanTimeout) {
          clearTimeout(scanTimeout);
        }
      };
    }
  }, [isScanning, handleKeyPress, scanTimeout]);

  const startScanning = useCallback(() => {
    setIsScanning(true);
    setScanBuffer('');
    toast.success('Scanner ativado! Aponte o leitor para o código de barras.');
  }, []);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    setScanBuffer('');
    if (scanTimeout) {
      clearTimeout(scanTimeout);
      setScanTimeout(null);
    }
    toast.info('Scanner desativado.');
  }, [scanTimeout]);

  const manualScan = useCallback(async (barcode: string): Promise<BarcodeScanResult> => {
    const result = await processBarcode(barcode);
    setLastScan(result);
    setScanHistory(prev => [result, ...prev.slice(0, 9)]);
    return result;
  }, [processBarcode]);

  const clearHistory = useCallback(() => {
    setScanHistory([]);
    setLastScan(null);
  }, []);

  return {
    isScanning,
    lastScan,
    scanHistory,
    startScanning,
    stopScanning,
    manualScan,
    clearHistory
  };
};