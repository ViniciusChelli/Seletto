# 📊 Database Migration Guide

This guide explains how to run the database migrations for Minimercado Selleto.

## 🗂️ Migration Files Overview

The system uses 6 migration files that must be run in order:

### 1. `20250512005747_jolly_king.sql`
**Purpose**: Creates the core products table
- Products table with all fields
- Row Level Security (RLS)
- Basic policies for CRUD operations

### 2. `20250512010422_green_hall.sql`
**Purpose**: User profiles and authentication
- Profiles table linked to auth.users
- User registration trigger
- Profile management policies

### 3. `20250518232946_silent_wood.sql`
**Purpose**: Enhanced business features
- Suppliers table
- Customers table
- Orders and order items
- Purchase orders
- Activity logs

### 4. `20250604100922_sparkling_ember.sql`
**Purpose**: Financial management
- Invoices table
- Payments table
- Expenses table
- Financial tracking policies

### 5. `20250610191807_long_lagoon.sql`
**Purpose**: Advanced features
- Currencies table
- Categories table
- Inventory movements
- Price history
- Customer loyalty
- Promotions
- System settings
- Notifications

### 6. `20250115120000_comprehensive_schema.sql`
**Purpose**: Final enhancements and functions
- Database functions for stock management
- Additional indexes for performance
- Default data insertion
- System configuration

## 🔄 How to Run Migrations

### Method 1: Supabase Dashboard (Recommended)

1. **Open SQL Editor**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the sidebar

2. **Run Each Migration**
   - Copy the content of each migration file
   - Paste into the SQL Editor
   - Click "Run" button
   - Wait for success confirmation
   - Proceed to next migration

3. **Verify Success**
   - Check "Database" → "Tables" to see created tables
   - Verify RLS is enabled on all tables
   - Check that policies exist

### Method 2: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Initialize Supabase in your project
supabase init

# Link to your remote project
supabase link --project-ref your-project-id

# Run migrations
supabase db push
```

## 🔍 Verification Steps

After running all migrations, verify:

### 1. Tables Created
Check these tables exist:
- [ ] products
- [ ] profiles
- [ ] suppliers
- [ ] customers
- [ ] orders
- [ ] order_items
- [ ] purchase_orders
- [ ] purchase_order_items
- [ ] invoices
- [ ] payments
- [ ] expenses
- [ ] currencies
- [ ] categories
- [ ] inventory_movements
- [ ] price_history
- [ ] customer_loyalty
- [ ] promotions
- [ ] sales_reports
- [ ] user_sessions
- [ ] notifications
- [ ] settings
- [ ] activity_logs

### 2. Functions Created
Check these functions exist:
- [ ] get_current_stock()
- [ ] update_product_stock()
- [ ] calculate_loyalty_points()
- [ ] get_low_stock_products()

### 3. Default Data
Verify default data was inserted:
- [ ] Brazilian Real (BRL) currency
- [ ] Product categories (Bebidas, Laticínios, etc.)
- [ ] System settings

### 4. Security Policies
Ensure RLS is enabled and policies exist for all tables.

## 🚨 Troubleshooting

### Common Migration Errors

#### 1. "relation already exists"
**Solution**: Some tables might already exist. This is usually safe to ignore.

#### 2. "permission denied"
**Solution**: Ensure you're running migrations as the database owner.

#### 3. "function does not exist"
**Solution**: Run migrations in the correct order. Some functions depend on others.

#### 4. "column already exists"
**Solution**: This happens if migrations are run multiple times. Usually safe to ignore.

### Recovery Steps

If migrations fail:

1. **Check Error Message**
   - Read the specific error in SQL Editor
   - Identify which line caused the issue

2. **Partial Recovery**
   - Comment out problematic lines
   - Run the rest of the migration
   - Fix issues manually

3. **Fresh Start**
   - Delete all tables (if safe to do so)
   - Run migrations from the beginning

## 📝 Migration Best Practices

1. **Always Backup**: Before running migrations in production
2. **Test First**: Run migrations on a test database first
3. **Run in Order**: Never skip or reorder migrations
4. **Verify Each Step**: Check success before proceeding
5. **Monitor Performance**: Watch for slow queries during migration

## 🔄 Updating Schema

When you need to modify the database:

1. **Never Edit Existing Migrations**: They should be immutable
2. **Create New Migration**: Add new migration file with timestamp
3. **Follow Naming Convention**: `YYYYMMDDHHMMSS_description.sql`
4. **Test Thoroughly**: Ensure new migration works with existing data

## 📞 Getting Help

If you encounter issues:

1. Check the error message carefully
2. Verify you're running migrations in order
3. Check Supabase documentation
4. Ask for help in the project repository