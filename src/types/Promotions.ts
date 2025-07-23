export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: PromotionType;
  discountValue: number;
  minQuantity: number;
  maxQuantity?: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  buyQuantity?: number;
  getQuantity?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usagePerCustomer: number;
  currentUsage: number;
  priority: number;
  stackable: boolean;
  couponCode?: string;
  applicableDays: number[];
  applicableHours?: any;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type PromotionType = 
  | 'percentage'      // Desconto percentual
  | 'fixed_amount'    // Valor fixo de desconto
  | 'buy_x_get_y'     // Leve X pague Y
  | 'quantity_discount' // Desconto por quantidade
  | 'category_discount' // Desconto por categoria
  | 'combo'           // Combo de produtos
  | 'coupon'          // Cupom de desconto
  | 'cashback';       // Cashback

export interface PromotionProduct {
  id: string;
  promotionId: string;
  productId?: string;
  category?: string;
  createdAt: string;
}

export interface PromotionUsage {
  id: string;
  promotionId: string;
  saleId: string;
  customerId?: string;
  discountAmount: number;
  quantityUsed: number;
  couponCode?: string;
  createdAt: string;
}

export interface BarcodeScan {
  id: string;
  barcode: string;
  productId?: string;
  scanType: 'sale' | 'inventory' | 'price_check';
  userId?: string;
  sessionId?: string;
  found: boolean;
  scanTime: string;
  deviceInfo?: any;
  createdAt: string;
}

export interface PriceRule {
  id: string;
  productId: string;
  ruleType: 'quantity' | 'time' | 'customer_type' | 'payment_method';
  conditionValue: any;
  priceAdjustment: number;
  adjustmentType: 'percentage' | 'fixed';
  isActive: boolean;
  priority: number;
  startDate?: string;
  endDate?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const PROMOTION_TYPES = {
  percentage: 'Desconto Percentual',
  fixed_amount: 'Valor Fixo',
  buy_x_get_y: 'Leve X Pague Y',
  quantity_discount: 'Desconto por Quantidade',
  category_discount: 'Desconto por Categoria',
  combo: 'Combo de Produtos',
  coupon: 'Cupom de Desconto',
  cashback: 'Cashback'
} as const;

export const PROMOTION_EXAMPLES = [
  {
    type: 'percentage',
    name: 'Desconto 15% Bebidas',
    description: 'Desconto de 15% em todas as bebidas',
    example: 'Refrigerante R$ 5,00 → R$ 4,25'
  },
  {
    type: 'fixed_amount',
    name: 'R$ 10 OFF acima de R$ 100',
    description: 'Desconto fixo de R$ 10,00 em compras acima de R$ 100,00',
    example: 'Compra R$ 120,00 → R$ 110,00'
  },
  {
    type: 'buy_x_get_y',
    name: 'Leve 3 Pague 2',
    description: 'Na compra de 3 produtos, pague apenas 2',
    example: '3 Iogurtes R$ 3,00 cada → R$ 6,00 total'
  },
  {
    type: 'quantity_discount',
    name: 'Desconto Progressivo',
    description: 'Maior desconto conforme quantidade',
    example: '5+ unidades = 10% OFF, 10+ unidades = 20% OFF'
  },
  {
    type: 'coupon',
    name: 'Cupom SAVE20',
    description: 'Cupom de desconto com código',
    example: 'Digite SAVE20 e ganhe 20% de desconto'
  }
];

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
];