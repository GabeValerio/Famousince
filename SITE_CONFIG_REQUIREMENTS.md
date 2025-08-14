# Site Configuration Requirements System

## Overview

The site configuration system now requires users to have both an active hosting subscription and a fully configured Stripe Connect account before they can enable site deployment. This ensures that users are properly set up for both hosting and payment processing.

## New Features

### 1. Requirements Status Dashboard
- **Hosting Subscription Status**: Shows whether the user has an active hosting subscription
- **Stripe Connect Status**: Shows whether the Stripe Connect account is fully configured
- **Overall Deployment Readiness**: Indicates if all requirements are met

### 2. Automatic Requirement Checking
- The system automatically checks hosting and Stripe status before allowing site deployment
- Users cannot enable the `deploy_site` configuration until all requirements are met
- Real-time status updates with visual indicators

### 3. Integration with Existing Systems
- **Hosting Page**: Users can subscribe to hosting services
- **Stripe Page**: Users can set up their Stripe Connect account
- **Site Config Page**: Shows requirements status and prevents deployment if not ready

## Database Changes

### New Table: `subscriptions`
```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### 1. `/api/site-config/status`
- **GET**: Returns the current status of hosting and Stripe requirements
- **Response**: 
  ```json
  {
    "hostingActive": boolean,
    "stripeSetup": boolean,
    "canDeploy": boolean,
    "requirements": {
      "hosting": { "active": boolean, "message": string },
      "stripe": { "setup": boolean, "message": string }
    }
  }
  ```

### 2. `/api/site-config` (Updated)
- **POST**: Now checks requirements before allowing `deploy_site` to be enabled
- **Validation**: Returns error if requirements aren't met

### 3. `/api/stripe/webhooks` (New)
- **POST**: Handles Stripe webhooks to track subscription changes
- **Events**: 
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

## Setup Instructions

### 1. Database Migration
Run the SQL migration to create the subscriptions table:
```bash
# Apply the migration
psql -d your_database -f migrations/create_subscriptions_table.sql
```

### 2. Environment Variables
Ensure these environment variables are set:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
```

### 3. Stripe Webhook Configuration
Set up a webhook endpoint in your Stripe dashboard:
- **URL**: `https://yourdomain.com/api/stripe/webhooks`
- **Events**: 
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 4. Price ID Configuration
Update the hosting price ID in the webhook handler:
```typescript
// In app/api/stripe/webhooks/route.ts
const isHostingSubscription = subscription.items.data.some(item => 
  item.price.id === 'your_hosting_price_id' // Update this
);
```

## User Flow

### 1. Initial Setup
1. User visits the admin panel
2. System checks requirements status
3. User sees what needs to be configured

### 2. Hosting Setup
1. User visits `/admin/hosting`
2. Subscribes to hosting service
3. Stripe webhook updates subscription status

### 3. Stripe Setup
1. User visits `/admin/stripe`
2. Completes Stripe Connect onboarding
3. System verifies account is fully configured

### 4. Site Deployment
1. All requirements are met
2. User can enable `deploy_site` configuration
3. Site goes live

## Security Features

- **Authentication Required**: All API endpoints require valid user session
- **Row Level Security**: Database tables have proper RLS policies
- **Webhook Verification**: Stripe webhooks are verified using signatures
- **Status Validation**: Server-side validation prevents bypassing requirements

## Monitoring and Debugging

### Logs
- Check browser console for client-side errors
- Check server logs for API errors
- Check Stripe webhook logs for subscription updates

### Common Issues
1. **Webhook not receiving events**: Verify webhook endpoint URL and secret
2. **Subscription not updating**: Check Stripe webhook configuration
3. **Requirements not showing**: Verify database connection and table structure

## Future Enhancements

- **Email Notifications**: Alert users when requirements are met or expire
- **Requirement History**: Track changes in requirements over time
- **Admin Override**: Allow admins to bypass requirements for testing
- **Analytics Dashboard**: Show requirement completion rates and trends
