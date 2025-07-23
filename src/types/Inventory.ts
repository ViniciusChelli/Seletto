export interface Store {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  isMainStore: boolean;
  isActive: boolean;
  timezone: string;
  businessHours?: any;
  settings?: any;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCount {
  id: string;
  storeId: string;
  countSessionId: string;
  sessionName: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  countType: 'full' | 'partial' | 'cycle';
  startedBy?: string;
  completedBy?: string;
  startedAt: string;
  completedAt?: string;
  totalItemsExpected: number;
  totalItemsCounted: number;
  discrepanciesFound: number;
  notes?: string;
  createdAt: string;
}

export interface InventoryCountItem {
  id: string;
  countId: string;
  productId: string;
  batchNumber?: string;
  expectedQuantity: number;
  countedQuantity: number;
  difference: number;
  unitCost?: number;
  scannedAt: string;
  scannedBy?: string;
  deviceInfo?: any;
  locationScanned?: string;
  notes?: string;
  createdAt: string;
}

export interface InventoryAdjustment {
  id: string;
  storeId?: string;
  countId?: string;
  productId: string;
  batchNumber?: string;
  adjustmentType: 'increase' | 'decrease' | 'correction';
  quantityBefore: number;
  quantityAfter: number;
  quantityAdjusted: number;
  unitCost?: number;
  totalCostImpact: number;
  reason: string;
  approvedBy?: string;
  createdBy?: string;
  createdAt: string;
}

export interface ProductTransfer {
  id: string;
  transferNumber: string;
  fromStoreId?: string;
  toStoreId?: string;
  status: 'pending' | 'in_transit' | 'received' | 'cancelled';
  transferType: 'manual' | 'automatic' | 'emergency';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requestedBy?: string;
  approvedBy?: string;
  shippedBy?: string;
  receivedBy?: string;
  requestedAt: string;
  approvedAt?: string;
  shippedAt?: string;
  receivedAt?: string;
  expectedDelivery?: string;
  trackingCode?: string;
  shippingCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferItem {
  id: string;
  transferId: string;
  productId: string;
  batchNumber?: string;
  quantityRequested: number;
  quantityShipped: number;
  quantityReceived: number;
  unitCost?: number;
  expiryDate?: string;
  conditionNotes?: string;
  createdAt: string;
}

export interface ProductLoss {
  id: string;
  storeId?: string;
  productId: string;
  batchNumber?: string;
  lossType: 'expiry' | 'damage' | 'theft' | 'spoilage' | 'breakage' | 'other';
  quantityLost: number;
  unitCost?: number;
  totalLossValue: number;
  lossReason: string;
  discoveredBy?: string;
  approvedBy?: string;
  insuranceClaim: boolean;
  insuranceAmount: number;
  preventionNotes?: string;
  photos?: string[];
  discoveredAt: string;
  approvedAt?: string;
  createdAt: string;
}

export interface BatchTracking {
  id: string;
  batchNumber: string;
  productId: string;
  supplierId?: string;
  productionDate?: string;
  expiryDate?: string;
  receivedDate: string;
  initialQuantity: number;
  currentQuantity: number;
  unitCost?: number;
  supplierBatchNumber?: string;
  qualityGrade: 'A' | 'B' | 'C';
  storageLocation?: string;
  temperatureLog?: any;
  qualityChecks?: any;
  certifications?: any;
  status: 'active' | 'quarantine' | 'expired' | 'sold_out' | 'recalled';
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchMovement {
  id: string;
  batchId: string;
  movementType: 'in' | 'out' | 'transfer' | 'adjustment' | 'loss';
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  fromLocation?: string;
  toLocation?: string;
  performedBy?: string;
  createdAt: string;
}

export interface Return {
  id: string;
  returnNumber: string;
  storeId?: string;
  originalSaleId?: string;
  customerId?: string;
  returnType: 'defective' | 'wrong_item' | 'customer_regret' | 'expired' | 'damaged' | 'other';
  returnReason: string;
  totalAmount: number;
  refundAmount: number;
  storeCreditAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'completed';
  refundMethod?: 'cash' | 'card' | 'pix' | 'store_credit' | 'exchange';
  processedBy?: string;
  approvedBy?: string;
  requestedAt: string;
  processedAt?: string;
  approvedAt?: string;
  notes?: string;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReturnItem {
  id: string;
  returnId: string;
  productId: string;
  batchNumber?: string;
  quantityReturned: number;
  unitPrice: number;
  totalPrice: number;
  conditionReceived: 'perfect' | 'good' | 'damaged' | 'defective' | 'expired';
  actionTaken: 'restock' | 'discard' | 'return_supplier' | 'repair' | 'donate';
  canResell: boolean;
  restockedAt?: string;
  restockedBy?: string;
  notes?: string;
  createdAt: string;
}

export const LOSS_TYPES = {
  expiry: 'Vencimento',
  damage: 'Avaria',
  theft: 'Furto',
  spoilage: 'Deterioração',
  breakage: 'Quebra',
  other: 'Outros'
} as const;

export const RETURN_TYPES = {
  defective: 'Produto Defeituoso',
  wrong_item: 'Item Errado',
  customer_regret: 'Desistência do Cliente',
  expired: 'Produto Vencido',
  damaged: 'Produto Danificado',
  other: 'Outros'
} as const;

export const TRANSFER_PRIORITIES = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente'
} as const;

export const QUALITY_GRADES = {
  A: 'Excelente',
  B: 'Bom',
  C: 'Regular'
}