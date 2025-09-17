# Deployment Setup Guide

This document outlines the required GitHub Secrets and environment setup for deploying the Smart Yoram Admin Dashboard.

## Required GitHub Secrets

To enable automatic deployment to Vercel, you need to configure the following secrets in your GitHub repository:

### 1. Navigate to Repository Settings
1. Go to your GitHub repository
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret**

### 2. Required Secrets for Vercel Deployment

#### Core Vercel Configuration
```
VERCEL_TOKEN - Your Vercel authentication token
VERCEL_ORG_ID - Your Vercel organization ID
```

#### Project IDs (for different environments)
```
VERCEL_PROJECT_ID_ADMIN - Development project ID
VERCEL_PROJECT_ID_ADMIN_STAGING - Staging project ID (optional)
VERCEL_PROJECT_ID_ADMIN_PROD - Production project ID (optional)
```

#### Supabase Configuration
```
REACT_APP_SUPABASE_URL - Default Supabase project URL
REACT_APP_SUPABASE_ANON_KEY - Default Supabase anonymous key

# Environment-specific (optional)
REACT_APP_SUPABASE_URL_DEV - Development Supabase URL
REACT_APP_SUPABASE_ANON_KEY_DEV - Development Supabase key
REACT_APP_SUPABASE_URL_STAGING - Staging Supabase URL
REACT_APP_SUPABASE_ANON_KEY_STAGING - Staging Supabase key
REACT_APP_SUPABASE_URL_PROD - Production Supabase URL
REACT_APP_SUPABASE_ANON_KEY_PROD - Production Supabase key
```

## How to Get These Values

### Vercel Token
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your profile (bottom left)
3. Go to **Settings** → **Tokens**
4. Click **Create Token**
5. Copy the generated token

### Vercel Organization ID
1. In Vercel Dashboard, go to **Settings** → **General**
2. Copy the **Team ID** (this is your org ID)

### Vercel Project ID
1. Go to your project in Vercel Dashboard
2. Go to **Settings** → **General**
3. Copy the **Project ID**

### Supabase Credentials
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy **Project URL** and **anon public** key

## Manual Deployment (if secrets are not configured)

If GitHub Secrets are not configured, the deployment steps will be skipped automatically. You can still:

1. **Download build artifacts** from GitHub Actions
2. **Deploy manually** to Vercel:
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy from admin-dashboard directory
   cd admin-dashboard
   vercel --prod
   ```

## Environment Configuration

The workflow supports three environments:
- **Development**: Automatically deploys on push to `develop` branch
- **Staging**: Deploys on push to `main` branch (if secrets are configured)
- **Production**: Manual deployment via GitHub Actions workflow dispatch

## Troubleshooting

### Deployment Skipped
If you see "Deploy to Development (Vercel) skipped", it means required secrets are missing. Configure the secrets listed above.

### Build Failures
The build process includes:
- TypeScript type checking (warnings allowed)
- ESLint linting (warnings allowed)
- React build process
- Test execution (optional)

All steps use `continue-on-error: true` to prevent blocking deployment on warnings.

### Missing Environment Variables
Make sure all required `REACT_APP_*` environment variables are set in GitHub Secrets, as they are injected during the build process.