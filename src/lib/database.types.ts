export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          sku: string
          barcode: string | null
          category: string
          price: number
          cost_price: number | null
          stock_quantity: number
          min_stock_level: number | null
          description: string | null
          image_url: string | null
          supplier: string | null
          location: string | null
          tags: string[] | null
          is_active: boolean
          sales_count: number | null
          last_sold: string | null
          created_at: string
          updated_at: string
          currency_id: string | null
          category_id: string | null
        }
        Insert: {
          id?: string
          name: string
          sku: string
          barcode?: string | null
          category: string
          price: number
          cost_price?: number | null
          stock_quantity?: number
          min_stock_level?: number | null
          description?: string | null
          image_url?: string | null
          supplier?: string | null
          location?: string | null
          tags?: string[] | null
          is_active?: boolean
          sales_count?: number | null
          last_sold?: string | null
          created_at?: string
          updated_at?: string
          currency_id?: string | null
          category_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          sku?: string
          barcode?: string | null
          category?: string
          price?: number
          cost_price?: number | null
          stock_quantity?: number
          min_stock_level?: number | null
          description?: string | null
          image_url?: string | null
          supplier?: string | null
          location?: string | null
          tags?: string[] | null
          is_active?: boolean
          sales_count?: number | null
          last_sold?: string | null
          created_at?: string
          updated_at?: string
          currency_id?: string | null
          category_id?: string | null
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          tax_id: string | null
          payment_terms: string | null
          notes: string | null
          status: string
          performance_rating: number
          created_at: string
          updated_at: string
          website: string | null
          preferred_currency_id: string | null
          credit_limit: number | null
          current_balance: number | null
        }
        Insert: {
          id?: string
          name: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          tax_id?: string | null
          payment_terms?: string | null
          notes?: string | null
          status?: string
          performance_rating?: number
          created_at?: string
          updated_at?: string
          website?: string | null
          preferred_currency_id?: string | null
          credit_limit?: number | null
          current_balance?: number | null
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          tax_id?: string | null
          payment_terms?: string | null
          notes?: string | null
          status?: string
          performance_rating?: number
          created_at?: string
          updated_at?: string
          website?: string | null
          preferred_currency_id?: string | null
          credit_limit?: number | null
          current_balance?: number | null
        }
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          role: string | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name?: string | null
          role?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          role?: string | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          loyalty_points: number
          total_purchases: number
          last_purchase: string | null
          notes: string | null
          created_at: string
          updated_at: string
          date_of_birth: string | null
          gender: string | null
          preferred_contact: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          loyalty_points?: number
          total_purchases?: number
          last_purchase?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          date_of_birth?: string | null
          gender?: string | null
          preferred_contact?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          loyalty_points?: number
          total_purchases?: number
          last_purchase?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          date_of_birth?: string | null
          gender?: string | null
          preferred_contact?: string | null
          is_active?: boolean
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string | null
          total_amount: number
          status: string
          payment_method: string | null
          payment_status: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          currency_id: string | null
          tax_amount: number
          discount_amount: number
          shipping_amount: number
          order_number: string | null
        }
        Insert: {
          id?: string
          customer_id?: string | null
          total_amount: number
          status?: string
          payment_method?: string | null
          payment_status?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          currency_id?: string | null
          tax_amount?: number
          discount_amount?: number
          shipping_amount?: number
          order_number?: string | null
        }
        Update: {
          id?: string
          customer_id?: string | null
          total_amount?: number
          status?: string
          payment_method?: string | null
          payment_status?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          currency_id?: string | null
          tax_amount?: number
          discount_amount?: number
          shipping_amount?: number
          order_number?: string | null
        }
      }
      invoices: {
        Row: {
          id: string
          order_id: string
          invoice_number: string
          total_amount: number
          tax_amount: number
          discount_amount: number
          due_date: string
          payment_status: string
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          invoice_number: string
          total_amount: number
          tax_amount: number
          discount_amount: number
          due_date: string
          payment_status?: string
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          invoice_number?: string
          total_amount?: number
          tax_amount?: number
          discount_amount?: number
          due_date?: string
          payment_status?: string
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          amount: number
          payment_method: string
          payment_date: string
          transaction_id: string | null
          status: string
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          amount: number
          payment_method: string
          payment_date: string
          transaction_id?: string | null
          status?: string
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          amount?: number
          payment_method?: string
          payment_date?: string
          transaction_id?: string | null
          status?: string
          notes?: string | null
          created_by?: string
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          category: string
          description: string
          amount: number
          payment_method: string
          payment_date: string
          supplier_id: string | null
          receipt_url: string | null
          status: string
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: string
          description: string
          amount: number
          payment_method: string
          payment_date: string
          supplier_id?: string | null
          receipt_url?: string | null
          status?: string
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: string
          description?: string
          amount?: number
          payment_method?: string
          payment_date?: string
          supplier_id?: string | null
          receipt_url?: string | null
          status?: string
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      currencies: {
        Row: {
          id: string
          code: string
          name: string
          symbol: string
          exchange_rate: number
          is_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          symbol: string
          exchange_rate?: number
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          symbol?: string
          exchange_rate?: number
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          parent_id: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parent_id?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          category: string
          is_public: boolean
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          category?: string
          is_public?: boolean
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          category?: string
          is_public?: boolean
          updated_by?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_stock: {
        Args: {
          product_uuid: string
        }
        Returns: number
      }
      update_product_stock: {
        Args: {
          product_uuid: string
          quantity_change: number
          movement_type: string
          reference_type?: string
          reference_uuid?: string
          notes_text?: string
        }
        Returns: boolean
      }
      calculate_loyalty_points: {
        Args: {
          purchase_amount: number
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}