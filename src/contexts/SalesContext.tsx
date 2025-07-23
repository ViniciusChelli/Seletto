import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Sale, SaleItem, PaymentTransaction, CashRegister } from '../types/Sales';
import toast from 'react-hot-toast';

interface SalesContextType {
  sales: Sale[];
  currentCashRegister: CashRegister | null;
  isLoading: boolean;
  error: string | null;
  createSale: (saleData: any, items: any[], payments: any[]) => Promise<string | null>;
  openCashRegister: (openingAmount: number) => Promise<boolean>;
  closeCashRegister: (closingAmount: number, notes?: string) => Promise<boolean>;
  getCurrentCashRegister: () => Promise<CashRegister | null>;
  getSalesByDateRange: (startDate: string, endDate: string) => Promise<Sale[]>;
  refundSale: (saleId: string, reason: string) => Promise<boolean>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};

export const SalesProvider = ({ children }: { children: ReactNode }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentCashRegister, setCurrentCashRegister] = useState<CashRegister | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentSales();
    getCurrentCashRegister();
  }, []);

  const fetchRecentSales = async () => {
    try {
      setIsLoading(true);
      
      let data, error;
      try {
        const result = await supabase
          .from('sales')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        data = result.data;
        error = result.error;
      } catch (queryError) {
        console.warn('Sales table query failed:', queryError);
        data = null;
        error = { code: '42P01', message: 'Table does not exist' };
      }

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          console.warn('Sales table does not exist yet');
          setSales([]);
          setError(null);
          return;
        }
        throw error;
      }

      const transformedSales = data?.map(sale => ({
        id: sale.id,
        saleNumber: sale.sale_number,
        customerId: sale.customer_id,
        cashierId: sale.cashier_id,
        totalAmount: sale.total_amount,
        discountAmount: sale.discount_amount,
        taxAmount: sale.tax_amount,
        finalAmount: sale.final_amount,
        status: sale.status,
        saleType: sale.sale_type,
        notes: sale.notes,
        createdAt: sale.created_at,
        updatedAt: sale.updated_at,
      })) || [];

      setSales(transformedSales);
      setError(null);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setSales([]);
      setError(null); // Don't show error to user for missing tables
      console.warn('Sales feature not available - database not fully migrated');
    } finally {
      setIsLoading(false);
    }
  };

  const createSale = async (saleData: any, items: any[], payments: any[]): Promise<string | null> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.rpc('process_sale', {
        sale_data: saleData,
        items_data: items,
        payments_data: payments
      });

      if (error) throw error;

      toast.success('Venda realizada com sucesso!');
      await fetchRecentSales();
      await getCurrentCashRegister();
      
      return data;
    } catch (err) {
      console.error('Error creating sale:', err);
      toast.error('Erro ao processar venda');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const openCashRegister = async (openingAmount: number): Promise<boolean> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('cash_register')
        .insert([{
          cashier_id: (await supabase.auth.getUser()).data.user?.id,
          opening_amount: openingAmount,
          status: 'open'
        }])
        .select()
        .single();

      if (error) throw error;

      const transformedRegister = {
        id: data.id,
        cashierId: data.cashier_id,
        openingAmount: data.opening_amount,
        closingAmount: data.closing_amount,
        totalSales: data.total_sales,
        totalCash: data.total_cash,
        totalPix: data.total_pix,
        totalCards: data.total_cards,
        totalCredit: data.total_credit,
        openedAt: data.opened_at,
        closedAt: data.closed_at,
        status: data.status,
        notes: data.notes,
      };

      setCurrentCashRegister(transformedRegister);
      toast.success('Caixa aberto com sucesso!');
      return true;
    } catch (err) {
      console.error('Error opening cash register:', err);
      toast.error('Erro ao abrir caixa');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const closeCashRegister = async (closingAmount: number, notes?: string): Promise<boolean> => {
    try {
      if (!currentCashRegister) return false;

      setIsLoading(true);

      const { error } = await supabase
        .from('cash_register')
        .update({
          closing_amount: closingAmount,
          closed_at: new Date().toISOString(),
          status: 'closed',
          notes: notes
        })
        .eq('id', currentCashRegister.id);

      if (error) throw error;

      setCurrentCashRegister(null);
      toast.success('Caixa fechado com sucesso!');
      return true;
    } catch (err) {
      console.error('Error closing cash register:', err);
      toast.error('Erro ao fechar caixa');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentCashRegister = async (): Promise<CashRegister | null> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      let data, error;
      try {
        const result = await supabase
          .from('cash_register')
          .select('*')
          .eq('cashier_id', user.user.id)
          .eq('status', 'open')
          .order('opened_at', { ascending: false })
          .limit(1)
          .single();
        data = result.data;
        error = result.error;
      } catch (queryError) {
        console.warn('Cash register table query failed:', queryError);
        setCurrentCashRegister(null);
        return null;
      }

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          setCurrentCashRegister(null);
          return null;
        }
        if (error.code === '42P01') {
          // Table doesn't exist
          console.warn('Cash register table does not exist yet');
          setCurrentCashRegister(null);
          return null;
        }
        throw error;
      }

      if (data) {
        const transformedRegister = {
          id: data.id,
          cashierId: data.cashier_id,
          openingAmount: data.opening_amount,
          closingAmount: data.closing_amount,
          totalSales: data.total_sales,
          totalCash: data.total_cash,
          totalPix: data.total_pix,
          totalCards: data.total_cards,
          totalCredit: data.total_credit,
          openedAt: data.opened_at,
          closedAt: data.closed_at,
          status: data.status,
          notes: data.notes,
        };

        setCurrentCashRegister(transformedRegister);
        return transformedRegister;
      }

      setCurrentCashRegister(null);
      return null;
    } catch (err) {
      console.error('Error getting current cash register:', err);
      setCurrentCashRegister(null);
      return null;
    }
  };

  const getSalesByDateRange = async (startDate: string, endDate: string): Promise<Sale[]> => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(sale => ({
        id: sale.id,
        saleNumber: sale.sale_number,
        customerId: sale.customer_id,
        cashierId: sale.cashier_id,
        totalAmount: sale.total_amount,
        discountAmount: sale.discount_amount,
        taxAmount: sale.tax_amount,
        finalAmount: sale.final_amount,
        status: sale.status,
        saleType: sale.sale_type,
        notes: sale.notes,
        createdAt: sale.created_at,
        updatedAt: sale.updated_at,
      }));
    } catch (err) {
      console.error('Error fetching sales by date range:', err);
      return [];
    }
  };

  const refundSale = async (saleId: string, reason: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('sales')
        .update({
          status: 'refunded',
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', saleId);

      if (error) throw error;

      toast.success('Venda estornada com sucesso!');
      await fetchRecentSales();
      return true;
    } catch (err) {
      console.error('Error refunding sale:', err);
      toast.error('Erro ao estornar venda');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SalesContext.Provider
      value={{
        sales,
        currentCashRegister,
        isLoading,
        error,
        createSale,
        openCashRegister,
        closeCashRegister,
        getCurrentCashRegister,
        getSalesByDateRange,
        refundSale,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};