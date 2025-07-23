import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Supplier } from '../types/Supplier';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface SupplierContextType {
  suppliers: Supplier[];
  isLoading: boolean;
  error: string | null;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  getSupplier: (id: string) => Supplier | undefined;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export const useSuppliers = () => {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error('useSuppliers must be used within a SupplierProvider');
  }
  return context;
};

export const SupplierProvider = ({ children }: { children: ReactNode }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database data to match Supplier interface
      const transformedSuppliers = data.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        contactPerson: supplier.contact_person,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        taxId: supplier.tax_id,
        paymentTerms: supplier.payment_terms,
        notes: supplier.notes,
        status: supplier.status as 'active' | 'inactive',
        performanceRating: supplier.performance_rating,
        createdAt: supplier.created_at,
        updatedAt: supplier.updated_at,
      }));
      
      setSuppliers(transformedSuppliers);
      setError(null);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to fetch suppliers');
      toast.error('Failed to load suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      
      // Transform Supplier interface to database format
      const dbSupplier = {
        name: supplier.name,
        contact_person: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        tax_id: supplier.taxId,
        payment_terms: supplier.paymentTerms,
        notes: supplier.notes,
        status: supplier.status,
        performance_rating: supplier.performanceRating,
      };
      
      const { data, error } = await supabase
        .from('suppliers')
        .insert([dbSupplier])
        .select()
        .single();

      if (error) throw error;

      // Transform back to Supplier interface
      const transformedSupplier = {
        id: data.id,
        name: data.name,
        contactPerson: data.contact_person,
        email: data.email,
        phone: data.phone,
        address: data.address,
        taxId: data.tax_id,
        paymentTerms: data.payment_terms,
        notes: data.notes,
        status: data.status as 'active' | 'inactive',
        performanceRating: data.performance_rating,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      
      setSuppliers(prev => [transformedSupplier, ...prev]);
      toast.success('Supplier added successfully');
    } catch (err) {
      console.error('Error adding supplier:', err);
      setError('Failed to add supplier');
      toast.error('Failed to add supplier');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSupplier = async (id: string, updatedFields: Partial<Supplier>) => {
    try {
      setIsLoading(true);
      
      // Transform Supplier interface fields to database format
      const dbFields: any = {};
      if (updatedFields.name !== undefined) dbFields.name = updatedFields.name;
      if (updatedFields.contactPerson !== undefined) dbFields.contact_person = updatedFields.contactPerson;
      if (updatedFields.email !== undefined) dbFields.email = updatedFields.email;
      if (updatedFields.phone !== undefined) dbFields.phone = updatedFields.phone;
      if (updatedFields.address !== undefined) dbFields.address = updatedFields.address;
      if (updatedFields.taxId !== undefined) dbFields.tax_id = updatedFields.taxId;
      if (updatedFields.paymentTerms !== undefined) dbFields.payment_terms = updatedFields.paymentTerms;
      if (updatedFields.notes !== undefined) dbFields.notes = updatedFields.notes;
      if (updatedFields.status !== undefined) dbFields.status = updatedFields.status;
      if (updatedFields.performanceRating !== undefined) dbFields.performance_rating = updatedFields.performanceRating;
      
      const { data, error } = await supabase
        .from('suppliers')
        .update(dbFields)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Transform back to Supplier interface
      const transformedSupplier = {
        id: data.id,
        name: data.name,
        contactPerson: data.contact_person,
        email: data.email,
        phone: data.phone,
        address: data.address,
        taxId: data.tax_id,
        paymentTerms: data.payment_terms,
        notes: data.notes,
        status: data.status as 'active' | 'inactive',
        performanceRating: data.performance_rating,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      
      setSuppliers(prev =>
        prev.map(supplier => (supplier.id === id ? transformedSupplier : supplier))
      );
      toast.success('Supplier updated successfully');
    } catch (err) {
      console.error('Error updating supplier:', err);
      setError('Failed to update supplier');
      toast.error('Failed to update supplier');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
      toast.success('Supplier deleted successfully');
    } catch (err) {
      console.error('Error deleting supplier:', err);
      setError('Failed to delete supplier');
      toast.error('Failed to delete supplier');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getSupplier = (id: string) => {
    return suppliers.find(supplier => supplier.id === id);
  };

  return (
    <SupplierContext.Provider
      value={{
        suppliers,
        isLoading,
        error,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        getSupplier,
      }}
    >
      {children}
    </SupplierContext.Provider>
  );
};