import React, { useState, useEffect } from 'react';
import { useProducts } from '../../contexts/ProductContext';
import { useSales } from '../../contexts/SalesContext';
import { usePromotions } from '../../contexts/PromotionsContext';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { Product } from '../../types/Product';
import { PaymentMethod, PAYMENT_METHODS, CARD_BRANDS } from '../../types/Sales';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, Calculator, User, Receipt, Scan, Tag, Percent, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  batchNumber?: string;
  expiryDate?: string;
  appliedPromotions?: any[];
  originalPrice?: number;
}

interface PaymentItem {
  method: PaymentMethod;
  amount: number;
  installments?: number;
  cardBrand?: string;
  cardLastDigits?: string;
  pixKey?: string;
  authorizationCode?: string;
}

const SalesTerminal: React.FC = () => {
  const { products } = useProducts();
  const { createSale, currentCashRegister } = useSales();
  const { calculatePromotions, validateCoupon } = usePromotions();
  const { isScanning, lastScan, startScanning, stopScanning, manualScan } = useBarcodeScanner();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [currentPayment, setCurrentPayment] = useState<Partial<PaymentItem>>({
    method: 'cash',
    amount: 0
  });
  const [couponCode, setCouponCode] = useState('');
  const [showPromotions, setShowPromotions] = useState(false);
  
  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0
  });

  // Processar última leitura do scanner
  useEffect(() => {
    if (lastScan && lastScan.found && lastScan.product) {
      addToCart(lastScan.product);
      
      // Mostrar promoções se houver
      if (lastScan.promotions && lastScan.promotions.length > 0) {
        toast.success(`${lastScan.promotions.length} promoção(ões) aplicável(is)!`);
      }
    } else if (lastScan && !lastScan.found) {
      toast.error(`Produto não encontrado: ${lastScan.barcode}`);
    }
  }, [lastScan]);

  // Verificar se o caixa está aberto
  useEffect(() => {
    if (!currentCashRegister) {
      toast.error('Caixa não está aberto. Abra o caixa para realizar vendas.');
    }
  }, [currentCashRegister]);

  // Calcular totais
  useEffect(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * (item.originalPrice || item.unitPrice)), 0);
    const discount = cart.reduce((sum, item) => sum + item.discount, 0);
    const tax = subtotal * 0.18; // ICMS 18%
    const total = subtotal - discount + tax;

    setTotals({ subtotal, discount, tax, total });
  }, [cart]);

  // Filtrar produtos
  const filteredProducts = products.filter(product =>
    product.isActive &&
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (product.barcode && product.barcode.includes(searchTerm)))
  );

  const addToCart = async (product: Product, quantity: number = 1) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      await updateQuantity(product.id, existingItem.quantity + quantity);
    } else {
      let finalPrice = product.price;
      let totalDiscount = 0;
      let appliedPromotions: any[] = [];
      
      // Try to calculate promotions if function exists
      try {
        const promotions = await calculatePromotions(product.id, quantity, selectedCustomer?.id);
        
        if (promotions && promotions.length > 0) {
          const bestPromotion = promotions.reduce((best, current) => 
            current.discount_amount > best.discount_amount ? current : best
          );
          
          totalDiscount = bestPromotion.discount_amount;
          finalPrice = product.price - (totalDiscount / quantity);
          appliedPromotions = [bestPromotion];
          
          toast.success(`Promoção aplicada: ${bestPromotion.promotion_name}`);
        }
      } catch (error) {
        console.error('Error calculating promotions:', error);
        // Continue without promotions
      }
      
      const newItem: CartItem = {
        product,
        quantity: quantity,
        unitPrice: finalPrice,
        originalPrice: product.price,
        discount: totalDiscount,
        total: finalPrice * quantity,
        appliedPromotions
      };
      
      setCart([...cart, newItem]);
    }
    setSearchTerm('');
  };

  const addToCartSimple = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      updateQuantitySimple(product.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        total: product.price
      };
      setCart([...cart, newItem]);
    }
    setSearchTerm('');
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find(item => item.product.id === productId);
    if (!item) return;

    // Recalcular promoções com nova quantidade
    const promotions = await calculatePromotions(productId, newQuantity, selectedCustomer?.id);
    
    let finalPrice = item.originalPrice || item.product.price;
    let totalDiscount = 0;
    
    if (promotions && promotions.length > 0) {
      const bestPromotion = promotions.reduce((best, current) => 
        current.discount_amount > best.discount_amount ? current : best
      );
      totalDiscount = bestPromotion.discount_amount;
      finalPrice = (item.originalPrice || item.product.price) - (totalDiscount / newQuantity);
    }

    setCart(cart.map(cartItem => {
      if (cartItem.product.id === productId) {
        return {
          ...cartItem,
          quantity: newQuantity,
          unitPrice: finalPrice,
          discount: totalDiscount,
          total: finalPrice * newQuantity
        };
      }
      return cartItem;
    }));
  };

  const updateQuantitySimple = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const total = (newQuantity * item.unitPrice) - item.discount;
        return { ...item, quantity: newQuantity, total };
      }
      return item;
    }));
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const total = (item.quantity * item.unitPrice) - discount;
        return { ...item, discount, total };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setPayments([]);
    setSelectedCustomer(null);
  };

  const handleManualBarcodeScan = async () => {
    if (!manualBarcode.trim()) {
      toast.error('Digite um código de barras');
      return;
    }
    
    await manualScan(manualBarcode.trim());
    setManualBarcode('');
  };

  const handleCouponValidation = async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um código de cupom');
      return;
    }

    const couponResult = await validateCoupon(couponCode.trim(), selectedCustomer?.id);
    
    if (couponResult && couponResult.is_valid) {
      // Aplicar desconto do cupom
      const discountAmount = couponResult.discount_value;
      // Implementar lógica de aplicação do cupom
      toast.success(`Cupom aplicado! Desconto: R$ ${discountAmount.toFixed(2)}`);
      setCouponCode('');
    } else {
      toast.error(couponResult?.error_message || 'Cupom inválido');
    }
  };

  const addPayment = () => {
    if (!currentPayment.method || !currentPayment.amount || currentPayment.amount <= 0) {
      toast.error('Preencha os dados do pagamento');
      return;
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = totals.total - totalPaid;

    if (currentPayment.amount > remaining) {
      toast.error('Valor do pagamento maior que o restante');
      return;
    }

    setPayments([...payments, currentPayment as PaymentItem]);
    setCurrentPayment({ method: 'cash', amount: 0 });
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    if (!currentCashRegister) {
      toast.error('Caixa não está aberto');
      return;
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = totals.total - totalPaid;

    // Se há valor restante, deve ser fiado (crédito)
    if (remaining > 0 && !selectedCustomer) {
      toast.error('Selecione um cliente para venda fiado');
      return;
    }

    try {
      const saleData = {
        customer_id: selectedCustomer?.id,
        total_amount: totals.subtotal,
        discount_amount: totals.discount,
        tax_amount: totals.tax,
        final_amount: totals.total,
        status: 'completed',
        sale_type: 'retail'
      };

      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount_amount: item.discount,
        total_price: item.total,
        expiry_date: item.expiryDate,
        batch_number: item.batchNumber
      }));

      const saleId = await createSale(saleData, items, payments);

      if (saleId) {
        toast.success('Venda realizada com sucesso!');
        clearCart();
        setShowPaymentModal(false);
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Erro ao processar venda');
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totals.total - totalPaid;

  if (!currentCashRegister) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Calculator size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Caixa Fechado</h3>
          <p className="text-gray-500 mb-4">Abra o caixa para começar a realizar vendas</p>
          <button className="btn btn-primary">Abrir Caixa</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Área de Produtos */}
      <div className="flex-1 p-4">
        <div className="bg-white rounded-lg shadow h-full flex flex-col">
          <div className="p-4 border-b">
            {/* Scanner Controls */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={isScanning ? stopScanning : startScanning}
                className={`btn ${isScanning ? 'btn-danger' : 'btn-primary'} flex items-center`}
              >
                <Scan size={18} className="mr-2" />
                {isScanning ? 'Parar Scanner' : 'Ativar Scanner'}
              </button>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Código manual"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleManualBarcodeScan()}
                />
                <button
                  onClick={handleManualBarcodeScan}
                  className="btn btn-secondary"
                >
                  Buscar
                </button>
              </div>
              
              {isScanning && (
                <div className="flex items-center text-green-600 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  Scanner Ativo
                </div>
              )}
            </div>
            
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produto por nome, código ou código de barras..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="border rounded-lg p-3 hover:shadow-md cursor-pointer transition-shadow"
                  onClick={() => addToCartSimple(product)}
                >
                  <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <div className="text-gray-400 text-xs">Sem imagem</div>
                    )}
                  </div>
                  <h3 className="font-medium text-sm truncate">{product.name}</h3>
                  <p className="text-xs text-gray-500">{product.category}</p>
                  <p className="text-lg font-bold text-primary-600">R$ {product.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Estoque: {product.stockQuantity}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Carrinho e Pagamento */}
      <div className="w-96 p-4">
        <div className="bg-white rounded-lg shadow h-full flex flex-col">
          {/* Header do Carrinho */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Carrinho</h2>
              <button
                onClick={clearCart}
                className="text-red-500 hover:text-red-700"
                disabled={cart.length === 0}
              >
                <Trash2 size={20} />
              </button>
            </div>
            
            {/* Cliente */}
            <div className="mt-2">
              <button className="flex items-center text-sm text-gray-600 hover:text-gray-800">
                <User size={16} className="mr-1" />
                {selectedCustomer ? selectedCustomer.name : 'Selecionar cliente'}
              </button>
            </div>
          </div>

          {/* Cupons e Promoções */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={16} className="text-orange-500" />
              <span className="text-sm font-medium">Cupons e Promoções</span>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Código do cupom"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 border rounded-md text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleCouponValidation()}
              />
              <button
                onClick={handleCouponValidation}
                className="btn btn-secondary text-sm"
              >
                Aplicar
              </button>
            </div>
          </div>

          {/* Itens do Carrinho */}
          <div className="flex-1 overflow-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <Receipt size={48} className="mx-auto mb-2 opacity-50" />
                <p>Carrinho vazio</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.product.id} className="border rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{item.product.name}</h4>
                      {item.appliedPromotions && item.appliedPromotions.length > 0 && (
                        <div className="flex items-center text-green-600 text-xs">
                          <Percent size={12} className="mr-1" />
                          Promoção
                        </div>
                      )}
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantitySimple(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantitySimple(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="font-medium">R$ {item.total.toFixed(2)}</span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      R$ {item.unitPrice.toFixed(2)} cada
                      {item.originalPrice && item.originalPrice !== item.unitPrice && (
                        <span className="ml-2">
                          <span className="line-through text-gray-400">R$ {item.originalPrice.toFixed(2)}</span>
                          <span className="text-green-600 ml-1">
                            (-R$ {((item.originalPrice - item.unitPrice) * item.quantity).toFixed(2)})
                          </span>
                        </span>
                      )}
                    </div>
                    
                    {item.appliedPromotions && item.appliedPromotions.map((promo, index) => (
                      <div key={index} className="text-xs text-green-600 mt-1">
                        🎁 {promo.promotion_name}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totais */}
          {cart.length > 0 && (
            <div className="p-4 border-t">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Desconto:</span>
                  <span>R$ {totals.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impostos:</span>
                  <span>R$ {totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>R$ {totals.total.toFixed(2)}</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full mt-4 btn btn-primary"
                disabled={cart.length === 0}
              >
                Finalizar Venda
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pagamento */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-auto">
            <h3 className="text-lg font-semibold mb-4">Formas de Pagamento</h3>
            
            {/* Total */}
            <div className="bg-gray-50 p-3 rounded mb-4">
              <div className="flex justify-between font-bold">
                <span>Total a pagar:</span>
                <span>R$ {totals.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Pago:</span>
                <span>R$ {totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Restante:</span>
                <span className={remaining > 0 ? 'text-red-600' : 'text-green-600'}>
                  R$ {remaining.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Adicionar Pagamento */}
            <div className="space-y-3 mb-4">
              <select
                value={currentPayment.method}
                onChange={(e) => setCurrentPayment({...currentPayment, method: e.target.value as PaymentMethod})}
                className="w-full p-2 border rounded"
              >
                {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              
              <input
                type="number"
                step="0.01"
                placeholder="Valor"
                value={currentPayment.amount || ''}
                onChange={(e) => setCurrentPayment({...currentPayment, amount: parseFloat(e.target.value) || 0})}
                className="w-full p-2 border rounded"
              />
              
              {currentPayment.method?.includes('card') && (
                <>
                  <select
                    value={currentPayment.cardBrand || ''}
                    onChange={(e) => setCurrentPayment({...currentPayment, cardBrand: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Selecione a bandeira</option>
                    {CARD_BRANDS.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                  
                  <input
                    type="text"
                    placeholder="Últimos 4 dígitos"
                    maxLength={4}
                    value={currentPayment.cardLastDigits || ''}
                    onChange={(e) => setCurrentPayment({...currentPayment, cardLastDigits: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </>
              )}
              
              {currentPayment.method === 'pix' && (
                <input
                  type="text"
                  placeholder="Chave PIX"
                  value={currentPayment.pixKey || ''}
                  onChange={(e) => setCurrentPayment({...currentPayment, pixKey: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              )}
              
              <button
                onClick={addPayment}
                className="w-full btn btn-secondary"
              >
                Adicionar Pagamento
              </button>
            </div>

            {/* Pagamentos Adicionados */}
            {payments.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Pagamentos:</h4>
                {payments.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded mb-2">
                    <div>
                      <span className="font-medium">{PAYMENT_METHODS[payment.method]}</span>
                      <span className="text-sm text-gray-600 ml-2">R$ {payment.amount.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => removePayment(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Botões */}
            <div className="flex space-x-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 btn btn-ghost border border-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={processSale}
                className="flex-1 btn btn-primary"
                disabled={remaining < 0}
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesTerminal;