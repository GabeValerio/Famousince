"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

if (!process.env.NEXT_PUBLIC_BASE_URL) {
  throw new Error('NEXT_PUBLIC_BASE_URL is not set');
}

export default function StripeConnectRefresh() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refreshOnboarding = async () => {
      try {
        // Get the current account
        const { data: account, error: fetchError } = await supabase
          .from('stripe_connect_accounts')
          .select('*')
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!account) {
          throw new Error('No Stripe Connect account found');
        }

        // Create a new account link
        const response = await fetch('/api/stripe/connect/create-account-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId: account.account_id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create account link');
        }

        // Redirect to the new onboarding URL
        window.location.href = data.url;
      } catch (err) {
        console.error('Error refreshing onboarding:', err);
        setError(err instanceof Error ? err.message : 'Failed to refresh onboarding');
      }
    };

    refreshOnboarding();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={() => router.push('/admin/stripe')}
          className="px-4 py-2 bg-white text-black rounded hover:bg-white/90"
        >
          Return to Stripe Settings
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="flex items-center gap-2 mb-4">
        <Loader2 className="h-6 w-6 animate-spin text-white/60" />
        <span className="text-white/60">Preparing onboarding...</span>
      </div>
    </div>
  );
} 