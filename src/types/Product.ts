export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  minStockLevel?: number;
  description?: string;
  imageUrl?: string;
  supplier?: string;
  location?: string; // Shelf location
  tags?: string[];
  isActive: boolean;
  salesCount?: number; // Number of times sold, for AI shelf arrangement
  lastSold?: string; // Date string
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}

export interface Category {
  id: string;
  name: string;
}

export const PRODUCT_CATEGORIES = [
  'Bebidas',
  'Laticínios',
  'Padaria',
  'Hortifruti',
  'Carnes',
  'Mercearia',
  'Limpeza',
  'Higiene',
  'Congelados',
  'Outros'
];