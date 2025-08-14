# 🚀 Site Configuration Requirements System - Setup Completion Guide

## ✅ What's Already Complete

The following components have been successfully implemented and deployed to your Supabase project:

### 1. **Database Infrastructure**
- ✅ `subscriptions` table created with proper structure
- ✅ Row Level Security (RLS) policies configured
- ✅ Automatic timestamp triggers set up
- ✅ Proper foreign key relationships established

### 2. **API Endpoints**
- ✅ `/api/site-config/status` - Returns requirements status
- ✅ `/api/site-config` - Updated with requirements validation
- ✅ `/api/stripe/webhooks` - Handles subscription lifecycle

### 3. **Frontend Components**
- ✅ Enhanced site-config page with requirements dashboard
- ✅ Visual status indicators for hosting and Stripe
- ✅ Requirement blocking for site deployment
- ✅ Direct links to setup pages

### 4. **Security Features**
- ✅ Authentication required for protected endpoints
- ✅ Server-side validation prevents bypassing requirements
- ✅ Proper RLS policies for data access control

## 🔧 Next Steps to Complete Setup

### Step 1: Environment Variables
Ensure these environment variables are set in your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://iptdufjyombwjqxhbmdq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdGR1Zmp5b21id2pxeGhibWRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwODgyNDIsImV4cCI6MjA2NjY2NDI0Mn0.1xM3chrskV6iQYK8z2koqFSAAqUrFXbLJtD2Z32Zt8w
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Step 2: Stripe Webhook Configuration
Set up webhooks in your Stripe Dashboard:

1. **Go to Stripe Dashboard** → Developers → Webhooks
2. **Add endpoint**: `https://yourdomain.com/api/stripe/webhooks`
3. **Select events**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copy webhook secret** and add to your environment variables

### Step 3: Update Hosting Price ID
In `app/api/stripe/webhooks/route.ts`, update the hosting price ID:

```typescript
// Line 67: Update this to your actual hosting price ID
const isHostingSubscription = subscription.items.data.some(item => 
  item.price.id === 'price_your_actual_hosting_price_id' // Update this
);
```

### Step 4: Test the System

#### 4.1 Start Development Server
```bash
npm run dev
# or
yarn dev
```

#### 4.2 Test API Endpoints
Run the test script to verify endpoints:
```bash
node test-api-endpoints.js
```

#### 4.3 Visit Admin Pages
1. **Site Configuration**: `/admin/site-config`
   - Should show requirements dashboard
   - Both hosting and Stripe should show as incomplete
   - Site deployment should be disabled

2. **Hosting Setup**: `/admin/hosting`
   - Should allow subscription to hosting service
   - Test with Stripe test card: `4242 4242 4242 4242`

3. **Stripe Setup**: `/admin/stripe`
   - Should allow Stripe Connect account creation
   - Complete onboarding process

### Step 5: Verify Requirements Flow

#### 5.1 Complete Hosting Subscription
1. Subscribe to hosting via `/admin/hosting`
2. Check Stripe webhook logs for subscription events
3. Verify `subscriptions` table is populated

#### 5.2 Complete Stripe Connect Setup
1. Create Stripe Connect account via `/admin/stripe`
2. Complete all onboarding requirements
3. Verify account shows as fully configured

#### 5.3 Enable Site Deployment
1. Return to `/admin/site-config`
2. Both requirements should show as complete
3. Site deployment should now be enabled
4. Enable `deploy_site` configuration

## 🧪 Testing Checklist

### API Endpoints
- [ ] `/api/site-config/status` returns 401 without auth
- [ ] `/api/site-config` GET works without auth
- [ ] `/api/site-config` POST returns 401 without auth
- [ ] `/api/site-config` POST blocks deployment without requirements

### Database
- [ ] `subscriptions` table exists with proper structure
- [ ] RLS policies are working correctly
- [ ] Timestamp triggers are functioning

### Frontend
- [ ] Requirements dashboard displays correctly
- [ ] Status indicators show proper colors
- [ ] Deployment button is disabled when requirements not met
- [ ] Direct links to setup pages work

### Stripe Integration
- [ ] Webhooks are receiving events
- [ ] Subscription status updates correctly
- [ ] Stripe Connect account verification works

## 🚨 Troubleshooting

### Common Issues

#### 1. **Webhook Not Receiving Events**
- Verify webhook endpoint URL is correct
- Check webhook secret in environment variables
- Ensure webhook is active in Stripe dashboard

#### 2. **Requirements Not Updating**
- Check browser console for errors
- Verify database connection
- Check API endpoint responses

#### 3. **Authentication Issues**
- Verify NextAuth configuration
- Check session handling
- Ensure proper middleware setup

#### 4. **Database Errors**
- Check Supabase logs
- Verify table structure
- Check RLS policies

### Debug Commands

#### Check Database Status
```sql
-- Check subscriptions table
SELECT * FROM subscriptions;

-- Check site config
SELECT * FROM site_config;

-- Check Stripe accounts
SELECT * FROM stripe_connect_accounts;
```

#### Check API Responses
```bash
# Test status endpoint
curl -X GET http://localhost:3000/api/site-config/status

# Test config endpoint
curl -X GET http://localhost:3000/api/site-config
```

## 🎯 Expected Final State

Once setup is complete, you should see:

1. **Requirements Dashboard**: Both hosting and Stripe show green checkmarks
2. **Deployment Ready**: Overall status shows "Ready to Deploy"
3. **Site Control**: `deploy_site` configuration can be enabled
4. **Live Site**: Visitors see the full website instead of coming soon page

## 📞 Support

If you encounter issues:

1. **Check logs**: Browser console, server logs, Supabase logs
2. **Verify configuration**: Environment variables, Stripe settings
3. **Test endpoints**: Use the provided test script
4. **Database queries**: Use Supabase MCP to inspect data

## 🎉 Success Indicators

- ✅ Requirements dashboard shows all green
- ✅ Site deployment can be enabled
- ✅ No console errors in browser
- ✅ API endpoints return expected responses
- ✅ Database tables populated correctly
- ✅ Stripe webhooks receiving events

---

**Congratulations!** 🎊 You now have a fully functional site configuration requirements system that ensures users must complete both hosting and Stripe setup before deploying their site.
