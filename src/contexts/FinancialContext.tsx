import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Invoice, Payment, Expense } from '../types/Financial';
import toast from 'react-hot-toast';

interface FinancialContextType {
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  createPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  createExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

export const FinancialProvider = ({ children }: { children: ReactNode }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;

      // Transform database data to match interface
      const transformedInvoices = invoicesData.map(invoice => ({
        id: invoice.id,
        orderId: invoice.order_id,
        invoiceNumber: invoice.invoice_number,
        totalAmount: invoice.total_amount,
        taxAmount: invoice.tax_amount,
        discountAmount: invoice.discount_amount,
        dueDate: invoice.due_date,
        paymentStatus: invoice.payment_status as 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled',
        notes: invoice.notes,
        createdBy: invoice.created_by,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
      }));
      
      const transformedPayments = paymentsData.map(payment => ({
        id: payment.id,
        invoiceId: payment.invoice_id,
        amount: payment.amount,
        paymentMethod: payment.payment_method as 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'pix',
        paymentDate: payment.payment_date,
        transactionId: payment.transaction_id,
        status: payment.status as 'pending' | 'completed' | 'failed' | 'refunded',
        notes: payment.notes,
        createdBy: payment.created_by,
        createdAt: payment.created_at,
      }));
      
      const transformedExpenses = expensesData.map(expense => ({
        id: expense.id,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        paymentMethod: expense.payment_method,
        paymentDate: expense.payment_date,
        supplierId: expense.supplier_id,
        receiptUrl: expense.receipt_url,
        status: expense.status as 'pending' | 'paid' | 'cancelled',
        notes: expense.notes,
        createdBy: expense.created_by,
        createdAt: expense.created_at,
        updatedAt: expense.updated_at,
      }));
      
      setInvoices(transformedInvoices);
      setPayments(transformedPayments);
      setExpenses(transformedExpenses);
      setError(null);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError('Failed to fetch financial data');
      toast.error('Failed to load financial data');
    } finally {
      setIsLoading(false);
    }
  };

  const createInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      
      // Transform Invoice interface to database format
      const dbInvoice = {
        order_id: invoice.orderId,
        invoice_number: invoice.invoiceNumber,
        total_amount: invoice.totalAmount,
        tax_amount: invoice.taxAmount,
        discount_amount: invoice.discountAmount,
        due_date: invoice.dueDate,
        payment_status: invoice.paymentStatus,
        notes: invoice.notes,
        created_by: invoice.createdBy,
      };
      
      const { data, error } = await supabase
        .from('invoices')
        .insert([dbInvoice])
        .select()
        .single();

      if (error) throw error;

      // Transform back to Invoice interface
      const transformedInvoice = {
        id: data.id,
        orderId: data.order_id,
        invoiceNumber: data.invoice_number,
        totalAmount: data.total_amount,
        taxAmount: data.tax_amount,
        discountAmount: data.discount_amount,
        dueDate: data.due_date,
        paymentStatus: data.payment_status as 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled',
        notes: data.notes,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      
      setInvoices(prev => [transformedInvoice, ...prev]);
      toast.success('Invoice created successfully');
    } catch (err) {
      console.error('Error creating invoice:', err);
      toast.error('Failed to create invoice');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateInvoice = async (id: string, invoice: Partial<Invoice>) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .update(invoice)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setInvoices(prev =>
        prev.map(inv => (inv.id === id ? { ...inv, ...data } : inv))
      );
      toast.success('Invoice updated successfully');
    } catch (err) {
      console.error('Error updating invoice:', err);
      toast.error('Failed to update invoice');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
      toast.success('Invoice deleted successfully');
    } catch (err) {
      console.error('Error deleting invoice:', err);
      toast.error('Failed to delete invoice');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createPayment = async (payment: Omit<Payment, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .insert([payment])
        .select()
        .single();

      if (error) throw error;

      setPayments(prev => [data, ...prev]);
      toast.success('Payment recorded successfully');
    } catch (err) {
      console.error('Error creating payment:', err);
      toast.error('Failed to record payment');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single();

      if (error) throw error;

      setExpenses(prev => [data, ...prev]);
      toast.success('Expense recorded successfully');
    } catch (err) {
      console.error('Error creating expense:', err);
      toast.error('Failed to record expense');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .update(expense)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setExpenses(prev =>
        prev.map(exp => (exp.id === id ? { ...exp, ...data } : exp))
      );
      toast.success('Expense updated successfully');
    } catch (err) {
      console.error('Error updating expense:', err);
      toast.error('Failed to update expense');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExpenses(prev => prev.filter(expense => expense.id !== id));
      toast.success('Expense deleted successfully');
    } catch (err) {
      console.error('Error deleting expense:', err);
      toast.error('Failed to delete expense');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FinancialContext.Provider
      value={{
        invoices,
        payments,
        expenses,
        isLoading,
        error,
        createInvoice,
        updateInvoice,
        deleteInvoice,
        createPayment,
        createExpense,
        updateExpense,
        deleteExpense,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};