# 🚀 Supabase Setup Guide for Minimercado Selleto

This guide will walk you through setting up Supabase and configuring the database for your Minimercado Selleto system.

## 📋 Prerequisites

- A web browser
- Email account for Supabase registration
- Basic understanding of SQL (helpful but not required)

## 🎯 Step 1: Create Supabase Account and Project

### 1.1 Sign Up for Supabase
1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign Up"**
3. Sign up using:
   - GitHub account (recommended)
   - Google account
   - Or email/password

### 1.2 Create New Project
1. After logging in, click **"New Project"**
2. Choose your organization (or create one)
3. Fill in project details:
   - **Name**: `minimercado-selleto`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Start with "Free" tier
4. Click **"Create new project"**
5. Wait 2-3 minutes for project setup to complete

### 1.3 Get Project Credentials
1. In your project dashboard, go to **Settings** → **API**
2. Copy and save these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Project API Keys** → **anon public** (starts with `eyJ...`)

## 🔧 Step 2: Configure Environment Variables

### 2.1 Create Environment File
1. In your project root, copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 2.2 Verify Configuration
Your `.env` file should look like this:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://wkjinmeelnyukqtqqoyd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🗄️ Step 3: Run Database Migrations

### 3.1 Access SQL Editor
1. In your Supabase dashboard, go to **SQL Editor**
2. You'll see a query editor interface

### 3.2 Run Migrations in Order
Execute these migration files **in the exact order listed**:

#### Migration 1: Products Table
```sql
-- Copy and paste content from: supabase/migrations/20250512005747_jolly_king.sql
```

#### Migration 2: User Profiles
```sql
-- Copy and paste content from: supabase/migrations/20250512010422_green_hall.sql
```

#### Migration 3: Enhanced Features
```sql
-- Copy and paste content from: supabase/migrations/20250518232946_silent_wood.sql
```

#### Migration 4: Financial Management
```sql
-- Copy and paste content from: supabase/migrations/20250604100922_sparkling_ember.sql
```

#### Migration 5: Comprehensive Schema
```sql
-- Copy and paste content from: supabase/migrations/20250610191807_long_lagoon.sql
```

#### Migration 6: Final Schema
```sql
-- Copy and paste content from: supabase/migrations/20250115120000_comprehensive_schema.sql
```

### 3.3 Execute Each Migration
For each migration:
1. Copy the entire SQL content from the migration file
2. Paste it into the SQL Editor
3. Click **"Run"** button
4. Wait for "Success" message
5. Proceed to next migration

## 🔐 Step 4: Configure Authentication

### 4.1 Authentication Settings
1. Go to **Authentication** → **Settings**
2. Configure these settings:

#### Site URL
```
http://localhost:5173
```

#### Redirect URLs
```
http://localhost:5173/**
https://your-production-domain.com/**
```

#### Email Settings
- **Enable email confirmations**: ✅ Enabled
- **Enable email change confirmations**: ✅ Enabled
- **Enable phone confirmations**: ❌ Disabled

### 4.2 Email Templates (Optional)
1. Go to **Authentication** → **Email Templates**
2. Customize confirmation and reset password emails
3. Use your brand colors and messaging

### 4.3 SMTP Configuration (Production)
For production, configure SMTP:
1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure with your email provider:
   - **SMTP Host**: Your email provider's SMTP server
   - **SMTP Port**: Usually 587 or 465
   - **SMTP User**: Your email address
   - **SMTP Pass**: Your email password or app password

## 🛡️ Step 5: Configure Row Level Security (RLS)

The migrations automatically set up RLS, but verify:

### 5.1 Check RLS Status
1. Go to **Database** → **Tables**
2. For each table, ensure RLS is **enabled**
3. Check that policies exist for each table

### 5.2 Test Policies
The system includes these default policies:
- Users can view all data
- Users can manage their own data
- Admins have full access

## 🧪 Step 6: Test the Setup

### 6.1 Start Development Server
```bash
npm run dev
```

### 6.2 Test Registration
1. Go to `http://localhost:5173/register`
2. Create a test account
3. Check if email confirmation is sent (if enabled)

### 6.3 Test Login
1. Go to `http://localhost:5173/login`
2. Use demo credentials:
   - Email: `demo@selleto.com`
   - Password: `Demo@123456`

### 6.4 Test Database Operations
1. Try adding a product
2. Check if data appears in Supabase dashboard
3. Test other CRUD operations

## 🚀 Step 7: Production Deployment

### 7.1 Update Environment Variables
For production deployment:
1. Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Configure production redirect URLs in Supabase
3. Set up proper SMTP for email sending

### 7.2 Deploy to Platform
Choose your deployment platform:
- **Netlify**: Connect GitHub repo, set env vars
- **Vercel**: Import project, configure environment
- **Railway**: Deploy from GitHub

## 🔍 Troubleshooting

### Common Issues

#### 1. "Failed to fetch" errors
- Check if Supabase URL and API key are correct
- Verify project is not paused (free tier limitation)

#### 2. Authentication not working
- Check redirect URLs in Supabase settings
- Verify email confirmation settings

#### 3. Database errors
- Ensure all migrations ran successfully
- Check RLS policies are properly configured

#### 4. Email not sending
- Configure SMTP settings for production
- Check spam folder for confirmation emails

### Getting Help
1. Check Supabase documentation: [docs.supabase.com](https://docs.supabase.com)
2. Visit Supabase Discord community
3. Check project logs in Supabase dashboard

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] All 6 migrations executed successfully
- [ ] Authentication settings configured
- [ ] RLS policies enabled
- [ ] Test registration/login working
- [ ] Database operations functional
- [ ] Email confirmation working (if enabled)

## 🎉 You're Ready!

Your Minimercado Selleto system is now fully configured with Supabase! You can start using all features:

- ✅ Product management
- ✅ Supplier management  
- ✅ Financial tracking
- ✅ User authentication
- ✅ Dashboard analytics
- ✅ File imports
- ✅ AI shelf optimizer

Happy coding! 🚀