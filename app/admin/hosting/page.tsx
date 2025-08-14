'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Server, AlertCircle } from 'lucide-react';

export default function HostingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.user?.email) {
        throw new Error('You must be logged in to subscribe');
      }

      // Initialize Stripe only when needed
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
      console.log('Stripe publishable key:', publishableKey ? 'Found' : 'Missing');
      
      if (!publishableKey) {
        throw new Error('Stripe configuration is missing. Please contact support.');
      }

      const stripe = await loadStripe(publishableKey);
      if (!stripe) {
        throw new Error('Failed to initialize Stripe. Please try again.');
      }
      
      console.log('Stripe initialized successfully');

      // Create subscription session for hosting
      const response = await fetch('/api/create-subscription-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          priceId: 'price_1RisNgDc80868KCRn2gWQR02', // GetValerio Monthly Hosting price ID
          productName: 'GetValerio Monthly Hosting',
          productDescription: 'Premium hosting service with dedicated domain and full control'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || 'Failed to create subscription session');
      }

      const responseData = await response.json();
      console.log('API Response:', responseData);
      
      const { sessionId, sessionUrl } = responseData;
      
      if (sessionUrl) {
        // Redirect to Stripe Checkout using the session URL
        window.location.href = sessionUrl;
      } else {
        // Fallback to redirectToCheckout if sessionUrl is not available
        const result = await stripe.redirectToCheckout({
          sessionId,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 
          className="text-white text-2xl md:text-3xl"
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          Hosting Site
        </h1>
      </div>

      <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-white/20 p-6 relative">
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-red-400">{error}</div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white">
              <Server className="h-5 w-5" />
              <h2 className="text-lg font-medium">Hosting Information</h2>
            </div>
            <div className="bg-white/5 rounded-lg border border-white/10 p-4">
              <p className="text-white/80">
                Host your own website with our premium hosting service. Get a dedicated domain and full control over your online presence.
              </p>
              <ul className="mt-4 space-y-2 text-white/60">
                <li className="flex items-center gap-2">
                  • Dedicated hosting environment
                </li>
                <li className="flex items-center gap-2">
                  • SSL certificate included
                </li>
                <li className="flex items-center gap-2">
                  • 24/7 uptime monitoring
                </li>
                <li className="flex items-center gap-2">
                  • Technical support
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white">
              <CreditCard className="h-5 w-5" />
              <h2 className="text-lg font-medium">Subscription Details</h2>
            </div>
            <div className="bg-white/5 rounded-lg border border-white/10 p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">$25</span>
                <span className="text-white/60">/month</span>
              </div>
              <p className="mt-2 text-white/80">
                Everything you need to run your own website
              </p>
              <div className="mt-6">
                <Button
                  onClick={handleSubscribe}
                  disabled={loading || !session}
                  className="w-full bg-white text-black hover:bg-white/90 font-medium"
                >
                  {loading ? 'Processing...' : 'Subscribe Now'}
                </Button>
                {!session && (
                  <p className="mt-2 text-sm text-white/60 text-center">
                    Please sign in to subscribe
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 