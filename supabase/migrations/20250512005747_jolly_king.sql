/*
  # Create products table

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `sku` (text, unique)
      - `barcode` (text)
      - `category` (text)
      - `price` (numeric)
      - `cost_price` (numeric)
      - `stock_quantity` (integer)
      - `min_stock_level` (integer)
      - `description` (text)
      - `image_url` (text)
      - `supplier` (text)
      - `location` (text)
      - `tags` (text[])
      - `is_active` (boolean)
      - `sales_count` (integer)
      - `last_sold` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on products table
    - Add policies for authenticated users to perform CRUD operations
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  barcode text,
  category text NOT NULL,
  price numeric NOT NULL,
  cost_price numeric,
  stock_quantity integer NOT NULL DEFAULT 0,
  min_stock_level integer,
  description text,
  image_url text,
  supplier text,
  location text,
  tags text[],
  is_active boolean DEFAULT true,
  sales_count integer DEFAULT 0,
  last_sold timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete their products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);