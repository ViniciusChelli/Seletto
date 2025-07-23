import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types/Product';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => Product | undefined;
  importProducts: (products: Omit<Product, 'id'>[]) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database data to match Product interface
      const transformedProducts = data.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        category: product.category,
        price: product.price,
        costPrice: product.cost_price,
        stockQuantity: product.stock_quantity,
        minStockLevel: product.min_stock_level,
        description: product.description,
        imageUrl: product.image_url,
        supplier: product.supplier,
        location: product.location,
        tags: product.tags,
        isActive: product.is_active,
        salesCount: product.sales_count,
        lastSold: product.last_sold,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      }));
      
      setProducts(transformedProducts);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products');
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      setIsLoading(true);
      
      // Transform Product interface to database format
      const dbProduct = {
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        category: product.category,
        price: product.price,
        cost_price: product.costPrice,
        stock_quantity: product.stockQuantity,
        min_stock_level: product.minStockLevel,
        description: product.description,
        image_url: product.imageUrl,
        supplier: product.supplier,
        location: product.location,
        tags: product.tags,
        is_active: product.isActive,
        sales_count: product.salesCount,
        last_sold: product.lastSold,
      };
      
      const { data, error } = await supabase
        .from('products')
        .insert([dbProduct])
        .select()
        .single();

      if (error) throw error;

      // Transform back to Product interface
      const transformedProduct = {
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
      
      setProducts(prev => [transformedProduct, ...prev]);
      toast.success('Product added successfully');
    } catch (err) {
      console.error('Error adding product:', err);
      setError('Failed to add product');
      toast.error('Failed to add product');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (id: string, updatedFields: Partial<Product>) => {
    try {
      setIsLoading(true);
      
      // Transform Product interface fields to database format
      const dbFields: any = {};
      if (updatedFields.name !== undefined) dbFields.name = updatedFields.name;
      if (updatedFields.sku !== undefined) dbFields.sku = updatedFields.sku;
      if (updatedFields.barcode !== undefined) dbFields.barcode = updatedFields.barcode;
      if (updatedFields.category !== undefined) dbFields.category = updatedFields.category;
      if (updatedFields.price !== undefined) dbFields.price = updatedFields.price;
      if (updatedFields.costPrice !== undefined) dbFields.cost_price = updatedFields.costPrice;
      if (updatedFields.stockQuantity !== undefined) dbFields.stock_quantity = updatedFields.stockQuantity;
      if (updatedFields.minStockLevel !== undefined) dbFields.min_stock_level = updatedFields.minStockLevel;
      if (updatedFields.description !== undefined) dbFields.description = updatedFields.description;
      if (updatedFields.imageUrl !== undefined) dbFields.image_url = updatedFields.imageUrl;
      if (updatedFields.supplier !== undefined) dbFields.supplier = updatedFields.supplier;
      if (updatedFields.location !== undefined) dbFields.location = updatedFields.location;
      if (updatedFields.tags !== undefined) dbFields.tags = updatedFields.tags;
      if (updatedFields.isActive !== undefined) dbFields.is_active = updatedFields.isActive;
      if (updatedFields.salesCount !== undefined) dbFields.sales_count = updatedFields.salesCount;
      if (updatedFields.lastSold !== undefined) dbFields.last_sold = updatedFields.lastSold;
      
      dbFields.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('products')
        .update(dbFields)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Transform back to Product interface
      const transformedProduct = {
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
      
      setProducts(prev =>
        prev.map(product => (product.id === id ? transformedProduct : product))
      );
      toast.success('Product updated successfully');
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product');
      toast.error('Failed to update product');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.filter(product => product.id !== id));
      toast.success('Product deleted successfully');
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
      toast.error('Failed to delete product');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getProduct = (id: string) => {
    return products.find(product => product.id === id);
  };

  const importProducts = async (newProducts: Omit<Product, 'id'>[]) => {
    try {
      setIsLoading(true);
      
      // Transform all products to database format
      const dbProducts = newProducts.map(product => ({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        category: product.category,
        price: product.price,
        cost_price: product.costPrice,
        stock_quantity: product.stockQuantity,
        min_stock_level: product.minStockLevel,
        description: product.description,
        image_url: product.imageUrl,
        supplier: product.supplier,
        location: product.location,
        tags: product.tags,
        is_active: product.isActive,
        sales_count: product.salesCount,
        last_sold: product.lastSold,
      }));
      
      const { data, error } = await supabase
        .from('products')
        .insert(dbProducts)
        .select();

      if (error) throw error;

      // Transform back to Product interface
      const transformedProducts = data.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        category: product.category,
        price: product.price,
        costPrice: product.cost_price,
        stockQuantity: product.stock_quantity,
        minStockLevel: product.min_stock_level,
        description: product.description,
        imageUrl: product.image_url,
        supplier: product.supplier,
        location: product.location,
        tags: product.tags,
        isActive: product.is_active,
        salesCount: product.sales_count,
        lastSold: product.last_sold,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      }));
      
      setProducts(prev => [...transformedProducts, ...prev]);
      toast.success(`${data.length} products imported successfully`);
    } catch (err) {
      console.error('Error importing products:', err);
      setError('Failed to import products');
      toast.error('Failed to import products');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        isLoading,
        error,
        addProduct,
        updateProduct,
        deleteProduct,
        getProduct,
        importProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};