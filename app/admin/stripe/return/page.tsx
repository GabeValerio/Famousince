"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

export default function StripeConnectReturn() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'incomplete'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccountStatus = async () => {
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

        // Check account status with Stripe
        const response = await fetch('/api/stripe/connect/check-status', {
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
          throw new Error(data.error || 'Failed to check account status');
        }

        if (data.isComplete) {
          // Update the account status in database
          const { error: updateError } = await supabase
            .from('stripe_connect_accounts')
            .update({ onboarding_complete: true })
            .eq('id', account.id);

          if (updateError) {
            throw updateError;
          }

          setStatus('success');
        } else {
          setStatus('incomplete');
          setError('Your Stripe account setup is incomplete. Please complete all requirements to start receiving payments.');
        }
      } catch (err) {
        console.error('Error checking account status:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to check account status');
      }
    };

    checkAccountStatus();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="h-6 w-6 animate-spin text-white/60" />
          <span className="text-white/60">Checking account status...</span>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="text-red-400 mb-4">{error || 'Something went wrong'}</div>
        <Button
          onClick={() => router.push('/admin/stripe')}
          variant="outline"
          className="border-white/20 bg-white/5 hover:bg-white/10"
        >
          Return to Stripe Settings
        </Button>
      </div>
    );
  }

  if (status === 'incomplete') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="flex items-center gap-2 mb-4 text-yellow-400">
          <AlertTriangle className="h-6 w-6" />
          <span>Action Required</span>
        </div>
        <p className="text-white/60 text-center mb-6 max-w-md">
          {error}
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => router.push('/admin/stripe/refresh')}
            className="bg-white text-black hover:bg-white/90"
          >
            Complete Setup
          </Button>
          <Button
            onClick={() => router.push('/admin/stripe')}
            variant="outline"
            className="border-white/20 bg-white/5 hover:bg-white/10"
          >
            View Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="flex items-center gap-2 mb-4 text-green-400">
        <CheckCircle2 className="h-6 w-6" />
        <span>Account setup complete!</span>
      </div>
      <p className="text-white/60 text-center mb-6">
        Your Stripe Connect account has been successfully set up and connected to our platform.
      </p>
      <Button
        onClick={() => router.push('/admin/stripe')}
        className="bg-white text-black hover:bg-white/90"
      >
        Continue to Stripe Settings
      </Button>
    </div>
  );
} 