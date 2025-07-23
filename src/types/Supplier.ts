export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  status: 'active' | 'inactive';
  performanceRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFilter {
  status?: 'active' | 'inactive';
  search?: string;
  minRating?: number;
}