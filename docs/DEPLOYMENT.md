# 🚀 Deployment Guide for Minimercado Selleto

This guide covers deploying your Minimercado Selleto system to production.

## 🎯 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] Supabase project is set up and configured
- [ ] All database migrations have been run successfully
- [ ] Environment variables are configured
- [ ] Application builds without errors locally
- [ ] Authentication is working in development
- [ ] Database operations are functional

## 🌐 Deployment Options

### Option 1: Netlify (Recommended)

#### Why Netlify?
- Easy GitHub integration
- Automatic deployments
- Built-in form handling
- Great performance
- Free tier available

#### Steps:
1. **Prepare Repository**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign up/login with GitHub
   - Click "New site from Git"
   - Choose your repository

3. **Configure Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: 18 or higher

4. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete
   - Your site will be available at a Netlify URL

### Option 2: Vercel

#### Steps:
1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure Environment Variables**
   - Go to Vercel dashboard
   - Add environment variables in project settings

### Option 3: Railway

#### Steps:
1. **Connect GitHub**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository

2. **Configure**
   - Set build command: `npm run build`
   - Set start command: `npm run preview`

3. **Environment Variables**
   - Add Supabase credentials in Railway dashboard

## 🔧 Production Configuration

### 1. Update Supabase Settings

#### Authentication URLs
In Supabase dashboard → Authentication → Settings:

- **Site URL**: `https://your-domain.com`
- **Redirect URLs**: 
  ```
  https://your-domain.com/**
  https://your-domain.com/login
  https://your-domain.com/reset-password
  ```

#### CORS Settings
Usually handled automatically, but verify in Supabase settings.

### 2. Environment Variables

Create production environment variables:

```env
# Production Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Optional: Analytics
VITE_GA_TRACKING_ID=your-google-analytics-id
```

### 3. Email Configuration

For production email sending:

1. **Configure SMTP in Supabase**
   - Go to Authentication → Settings → SMTP Settings
   - Use a service like:
     - SendGrid
     - Mailgun
     - AWS SES
     - Gmail (for testing only)

2. **Example SMTP Configuration**
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP User: apikey
   SMTP Pass: your-sendgrid-api-key
   ```

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit `.env` files to Git
- Use platform-specific environment variable settings
- Rotate API keys regularly

### 2. Database Security
- Ensure RLS is enabled on all tables
- Review and test all security policies
- Monitor database access logs

### 3. Authentication
- Enable email confirmation in production
- Configure proper redirect URLs
- Set up rate limiting if needed

## 📊 Monitoring and Analytics

### 1. Error Tracking
Consider adding error tracking:
- Sentry
- LogRocket
- Bugsnag

### 2. Analytics
Add analytics tracking:
- Google Analytics
- Mixpanel
- Plausible

### 3. Performance Monitoring
- Lighthouse CI
- Web Vitals
- Supabase dashboard metrics

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v1.2
      with:
        publish-dir: './dist'
        production-branch: main
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🧪 Testing in Production

### 1. Smoke Tests
After deployment, test:
- [ ] Homepage loads
- [ ] User registration works
- [ ] Login/logout functions
- [ ] Product CRUD operations
- [ ] File upload works
- [ ] Dashboard displays data

### 2. Performance Tests
- Check page load times
- Test with multiple users
- Monitor database performance

## 🚨 Troubleshooting

### Common Deployment Issues

#### 1. Build Failures
```bash
# Check build locally
npm run build

# Check for TypeScript errors
npm run lint
```

#### 2. Environment Variable Issues
- Verify all required variables are set
- Check variable names (case-sensitive)
- Ensure no trailing spaces

#### 3. Supabase Connection Issues
- Verify URL and API key
- Check CORS settings
- Ensure database is accessible

#### 4. Authentication Problems
- Check redirect URLs in Supabase
- Verify email templates
- Test email delivery

### Recovery Steps

If deployment fails:

1. **Check Build Logs**
   - Review error messages
   - Fix code issues
   - Redeploy

2. **Rollback if Needed**
   - Most platforms support rollback
   - Use previous working deployment

3. **Database Issues**
   - Check Supabase dashboard
   - Verify migrations ran correctly
   - Test database connectivity

## 📈 Post-Deployment

### 1. Monitor Performance
- Set up alerts for downtime
- Monitor error rates
- Track user engagement

### 2. Backup Strategy
- Regular database backups
- Code repository backups
- Environment configuration backups

### 3. Updates and Maintenance
- Plan regular updates
- Monitor security advisories
- Keep dependencies updated

## 🎉 Success!

Your Minimercado Selleto system is now live in production! 

### Next Steps:
1. Share the URL with your team
2. Start adding real data
3. Train users on the system
4. Monitor and optimize performance
5. Plan future enhancements

Remember to keep your system updated and monitor its performance regularly.