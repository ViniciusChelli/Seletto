import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Promotion, PromotionUsage, BarcodeScan } from '../types/Promotions';
import toast from 'react-hot-toast';

interface PromotionsContextType {
  promotions: Promotion[];
  activePromotions: Promotion[];
  isLoading: boolean;
  error: string | null;
  
  // Promotion management
  createPromotion: (promotion: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePromotion: (id: string, promotion: Partial<Promotion>) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
  togglePromotion: (id: string, isActive: boolean) => Promise<void>;
  
  // Promotion application
  calculatePromotions: (productId: string, quantity: number, customerId?: string, saleTotal?: number) => Promise<any[]>;
  validateCoupon: (couponCode: string, customerId?: string) => Promise<any>;
  applyPromotionToSale: (promotionId: string, saleId: string, customerId?: string, discountAmount?: number) => Promise<boolean>;
  
  // Barcode scanning
  findProductByBarcode: (barcode: string) => Promise<any>;
  getScanHistory: () => Promise<BarcodeScan[]>;
}

const PromotionsContext = createContext<PromotionsContextType | undefined>(undefined);

export const usePromotions = () => {
  const context = useContext(PromotionsContext);
  if (!context) {
    throw new Error('usePromotions must be used within a PromotionsProvider');
  }
  return context;
};

export const PromotionsProvider = ({ children }: { children: ReactNode }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      
      let data, error;
      try {
        // First try with priority column
        const result = await supabase
          .from('promotions')
          .select('*')
          .order('priority', { ascending: false });
        data = result.data;
        error = result.error;
      } catch (priorityError) {
        console.warn('Priority column not found, trying fallback:', priorityError);
        try {
          // Fallback: fetch without priority ordering if column doesn't exist
          const result = await supabase
            .from('promotions')
            .select('*')
            .order('created_at', { ascending: false });
          data = result.data;
          error = result.error;
        } catch (tableError) {
          console.warn('Promotions table query failed:', tableError);
          data = null;
          error = { code: '42P01', message: 'Table does not exist' };
        }
      }

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          console.warn('Promotions table does not exist yet');
          setPromotions([]);
          setError(null);
          return;
        }
        if (error.code === '42703') {
          // Column doesn't exist - try again without priority
          console.warn('Priority column does not exist, trying without it');
          try {
            const result = await supabase
              .from('promotions')
              .select('*')
              .order('created_at', { ascending: false });
            data = result.data;
            error = result.error;
            if (error) throw error;
          } catch (fallbackError) {
            console.warn('Fallback query also failed:', fallbackError);
            setPromotions([]);
            setError(null);
            return;
          }
        } else {
          throw error;
        }
      }

      if (error) {
        throw error;
      }

      const transformedPromotions = data?.map(promo => ({
        id: promo.id,
        name: promo.name,
        description: promo.description,
        type: promo.type,
        discountValue: promo.discount_value,
        minQuantity: promo.min_quantity,
        maxQuantity: promo.max_quantity,
        minPurchaseAmount: promo.min_purchase_amount,
        maxDiscountAmount: promo.max_discount_amount,
        buyQuantity: promo.buy_quantity,
        getQuantity: promo.get_quantity,
        startDate: promo.start_date,
        endDate: promo.end_date,
        isActive: promo.is_active,
        usageLimit: promo.usage_limit,
        usagePerCustomer: promo.usage_per_customer,
        currentUsage: promo.current_usage,
        priority: promo.priority || 0, // Default to 0 if column doesn't exist
        stackable: promo.stackable,
        couponCode: promo.coupon_code,
        applicableDays: promo.applicable_days,
        applicableHours: promo.applicable_hours,
        createdBy: promo.created_by,
        createdAt: promo.created_at,
        updatedAt: promo.updated_at,
      })) || [];

      setPromotions(transformedPromotions);
      setError(null);
    } catch (err) {
      console.error('Error fetching promotions:', err);
      setPromotions([]);
      setError(null); // Don't show error to user for missing tables
      console.warn('Promotions feature not available - database not fully migrated');
    } finally {
      setIsLoading(false);
    }
  };

  const createPromotion = async (promotion: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      
      const dbPromotion = {
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        discount_value: promotion.discountValue,
        min_quantity: promotion.minQuantity,
        max_quantity: promotion.maxQuantity,
        min_purchase_amount: promotion.minPurchaseAmount,
        max_discount_amount: promotion.maxDiscountAmount,
        buy_quantity: promotion.buyQuantity,
        get_quantity: promotion.getQuantity,
        start_date: promotion.startDate,
        end_date: promotion.endDate,
        is_active: promotion.isActive,
        usage_limit: promotion.usageLimit,
        usage_per_customer: promotion.usagePerCustomer,
        priority: promotion.priority,
        stackable: promotion.stackable,
        coupon_code: promotion.couponCode,
        applicable_days: promotion.applicableDays,
        applicable_hours: promotion.applicableHours,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      const { data, error } = await supabase
        .from('promotions')
        .insert([dbPromotion])
        .select()
        .single();

      if (error) throw error;

      toast.success('Promoção criada com sucesso!');
      await fetchPromotions();
    } catch (err) {
      console.error('Error creating promotion:', err);
      toast.error('Erro ao criar promoção');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePromotion = async (id: string, updatedFields: Partial<Promotion>) => {
    try {
      setIsLoading(true);
      
      const dbFields: any = {};
      if (updatedFields.name !== undefined) dbFields.name = updatedFields.name;
      if (updatedFields.description !== undefined) dbFields.description = updatedFields.description;
      if (updatedFields.discountValue !== undefined) dbFields.discount_value = updatedFields.discountValue;
      if (updatedFields.isActive !== undefined) dbFields.is_active = updatedFields.isActive;
      // Add other fields as needed
      
      const { error } = await supabase
        .from('promotions')
        .update(dbFields)
        .eq('id', id);

      if (error) throw error;

      toast.success('Promoção atualizada com sucesso!');
      await fetchPromotions();
    } catch (err) {
      console.error('Error updating promotion:', err);
      toast.error('Erro ao atualizar promoção');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Promoção excluída com sucesso!');
      await fetchPromotions();
    } catch (err) {
      console.error('Error deleting promotion:', err);
      toast.error('Erro ao excluir promoção');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const togglePromotion = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Promoção ${isActive ? 'ativada' : 'desativada'} com sucesso!`);
      await fetchPromotions();
    } catch (err) {
      console.error('Error toggling promotion:', err);
      toast.error('Erro ao alterar status da promoção');
      throw err;
    }
  };

  const calculatePromotions = async (productId: string, quantity: number, customerId?: string, saleTotal?: number) => {
    try {
      try {
        const { data, error } = await supabase.rpc('calculate_applicable_promotions', {
          product_uuid: productId,
          quantity: quantity,
          customer_uuid: customerId,
          sale_total: saleTotal || 0
        });

        if (error) throw error;
        return data || [];
      } catch (rpcError) {
        console.error('RPC function not available:', rpcError);
        // Return empty array if function doesn't exist
        return [];
      }
    } catch (err) {
      console.error('Error calculating promotions:', err);
      return [];
    }
  };

  const validateCoupon = async (couponCode: string, customerId?: string) => {
    try {
      try {
        const { data, error } = await supabase.rpc('validate_coupon', {
          coupon_code_input: couponCode,
          customer_uuid: customerId
        });

        if (error) throw error;
        return data?.[0] || null;
      } catch (rpcError) {
        console.error('RPC function not available:', rpcError);
        return null;
      }
    } catch (err) {
      console.error('Error validating coupon:', err);
      return null;
    }
  };

  const applyPromotionToSale = async (promotionId: string, saleId: string, customerId?: string, discountAmount?: number) => {
    try {
      const { data, error } = await supabase.rpc('apply_promotion_to_sale', {
        promotion_uuid: promotionId,
        sale_uuid: saleId,
        customer_uuid: customerId,
        discount_applied: discountAmount || 0
      });

      if (error) throw error;
      return data || false;
    } catch (err) {
      console.error('Error applying promotion:', err);
      return false;
    }
  };

  const findProductByBarcode = async (barcode: string) => {
    try {
      const { data, error } = await supabase.rpc('find_product_by_barcode', {
        barcode_input: barcode
      });

      if (error) throw error;
      return data?.[0] || null;
    } catch (err) {
      console.error('Error finding product by barcode:', err);
      return null;
    }
  };

  const getScanHistory = async (): Promise<BarcodeScan[]> => {
    try {
      const { data, error } = await supabase
        .from('barcode_scans')
        .select('*')
        .order('scan_time', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data?.map(scan => ({
        id: scan.id,
        barcode: scan.barcode,
        productId: scan.product_id,
        scanType: scan.scan_type,
        userId: scan.user_id,
        sessionId: scan.session_id,
        found: scan.found,
        scanTime: scan.scan_time,
        deviceInfo: scan.device_info,
        createdAt: scan.created_at,
      })) || [];
    } catch (err) {
      console.error('Error fetching scan history:', err);
      return [];
    }
  };

  const activePromotions = promotions.filter(p => 
    p.isActive && 
    new Date(p.startDate) <= new Date() && 
    new Date(p.endDate) >= new Date()
  );

  return (
    <PromotionsContext.Provider
      value={{
        promotions,
        activePromotions,
        isLoading,
        error,
        createPromotion,
        updatePromotion,
        deletePromotion,
        togglePromotion,
        calculatePromotions,
        validateCoupon,
        applyPromotionToSale,
        findProductByBarcode,
        getScanHistory,
      }}
    >
      {children}
    </PromotionsContext.Provider>
  );
};