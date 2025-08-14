import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeletion(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    // Check if this is a hosting subscription
    const isHostingSubscription = subscription.items.data.some(item => 
      item.price.id === 'price_1RisNgDc80868KCRn2gWQR02' // GetValerio Monthly Hosting price ID
    );

    if (!isHostingSubscription) {
      return; // Not a hosting subscription, ignore
    }

    // Get customer email
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    const customerEmail = customer && 'email' in customer ? customer.email : null;

    if (!customerEmail) {
      console.error('No customer email found for subscription:', subscription.id);
      return;
    }

    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', customerEmail)
      .single();

    if (userError || !userData) {
      console.error('User not found for email:', customerEmail);
      return;
    }

    // Upsert subscription record
    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userData.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        price_id: subscription.items.data[0].price.id,
        status: subscription.status,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'stripe_subscription_id'
      });

    if (upsertError) {
      console.error('Error upserting subscription:', upsertError);
    } else {
      console.log('Subscription updated successfully:', subscription.id);
    }
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

async function handleSubscriptionDeletion(subscription: Stripe.Subscription) {
  try {
    // Check if this is a hosting subscription
    const isHostingSubscription = subscription.items.data.some(item => 
      item.price.id === 'price_1RisNgDc80868KCRn2gWQR02'
    );

    if (!isHostingSubscription) {
      return;
    }

    // Update subscription status to canceled
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating subscription status:', updateError);
    } else {
      console.log('Subscription marked as canceled:', subscription.id);
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (!(invoice as any).subscription) return;

    // Check if this is a hosting subscription
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
    const isHostingSubscription = subscription.items.data.some(item => 
      item.price.id === 'price_1RisNgDc80868KCRn2gWQR02'
    );

    if (!isHostingSubscription) {
      return;
    }

    // Update subscription status to active
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating subscription status to active:', updateError);
    } else {
      console.log('Subscription marked as active:', subscription.id);
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (!(invoice as any).subscription) return;

    // Check if this is a hosting subscription
    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
    const isHostingSubscription = subscription.items.data.some(item => 
      item.price.id === 'price_1RisNgDc80868KCRn2gWQR02'
    );

    if (!isHostingSubscription) {
      return;
    }

    // Update subscription status to past_due
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating subscription status to past_due:', updateError);
    } else {
      console.log('Subscription marked as past_due:', subscription.id);
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}
