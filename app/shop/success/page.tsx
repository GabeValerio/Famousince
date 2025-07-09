'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/lib/CartContext';
import { useSearchParams } from 'next/navigation';

export default function PaymentSuccess() {
  const { clearCart } = useCart();
  const [isVerified, setIsVerified] = useState(false);
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');
  const amount = searchParams.get('amount');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!paymentIntentId) return;

      try {
        const response = await fetch(`/api/verify-payment?payment_intent=${paymentIntentId}`);
        const data = await response.json();
        
        if (data.success) {
          setIsVerified(true);
          clearCart();
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      }
    };

    verifyPayment();
  }, [paymentIntentId, clearCart]);

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full mx-auto border border-white/20 rounded-lg p-8 bg-black">
            <div className="text-center space-y-4">
              <h1 
                className="text-2xl font-bold"
                style={{ fontFamily: 'Chalkduster, fantasy' }}
              >
                Verifying your payment...
              </h1>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full mx-auto border border-white/20 rounded-lg p-8 bg-black">
          <div className="text-center space-y-4">
            <h1 
              className="text-4xl font-bold"
              style={{ fontFamily: 'Chalkduster, fantasy' }}
            >
              Thank you!
            </h1>
            <h2 className="text-xl text-white/60">You successfully sent</h2>

            <div className="mt-6 text-5xl font-bold" style={{ fontFamily: 'Chalkduster, fantasy' }}>
              ${amount ? parseFloat(amount).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}