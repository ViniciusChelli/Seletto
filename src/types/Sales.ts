export interface Sale {
  id: string;
  saleNumber: string;
  customerId?: string;
  cashierId: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  saleType: 'retail' | 'wholesale' | 'return';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
  expiryDate?: string;
  batchNumber?: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  saleId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  installments: number;
  cardBrand?: string;
  cardLastDigits?: string;
  pixKey?: string;
  pixTransactionId?: string;
  authorizationCode?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  processedAt: string;
  createdAt: string;
}

export type PaymentMethod = 
  | 'cash' 
  | 'pix' 
  | 'debit_card' 
  | 'credit_card' 
  | 'credit_account' 
  | 'bank_transfer' 
  | 'check';

export interface ProductExpiry {
  id: string;
  productId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  costPrice?: number;
  supplierId?: string;
  receivedDate: string;
  status: 'active' | 'expired' | 'sold' | 'discarded';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashRegister {
  id: string;
  cashierId: string;
  openingAmount: number;
  closingAmount?: number;
  totalSales: number;
  totalCash: number;
  totalPix: number;
  totalCards: number;
  totalCredit: number;
  openedAt: string;
  closedAt?: string;
  status: 'open' | 'closed';
  notes?: string;
}

export interface InstallmentPayment {
  id: string;
  paymentTransactionId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  createdAt: string;
}

export interface CustomerCredit {
  id: string;
  customerId: string;
  saleId?: string;
  amount: number;
  type: 'credit' | 'payment';
  dueDate?: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export const PAYMENT_METHODS = {
  cash: 'Dinheiro',
  pix: 'PIX',
  debit_card: 'Cartão de Débito',
  credit_card: 'Cartão de Crédito',
  credit_account: 'Fiado',
  bank_transfer: 'Transferência Bancária',
  check: 'Cheque'
} as const;

export const CARD_BRANDS = [
  'Visa',
  'Mastercard',
  'Elo',
  'American Express',
  'Hipercard',
  'Diners',
  'Discover'
] as const;