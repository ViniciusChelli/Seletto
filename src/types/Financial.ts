export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  dueDate: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'pix';
  paymentDate: string;
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  supplierId?: string;
  receiptUrl?: string;
  status: 'pending' | 'paid' | 'cancelled';
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const EXPENSE_CATEGORIES = [
  'Inventory',
  'Utilities',
  'Rent',
  'Salaries',
  'Marketing',
  'Equipment',
  'Maintenance',
  'Insurance',
  'Office Supplies',
  'Other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];