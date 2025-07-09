"use client";

import React, { useEffect, useState, useRef } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import convertToSubcurrency from "@/lib/convertToSubcurrency";
import { useCart } from "@/lib/CartContext";

interface CartItem {
  id: string;
  product_id: string;
  variant_id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  front_image_url?: string;
  back_image_url?: string;
  image?: string;
  size: string;
  color: string;
}

interface StripePaymentProps {
  amount: number;
  email: string;
  shippingAddress: string;
  customerName: string;
  postalCode: string;
  country: string;
  isSubscription?: boolean;
  priceId?: string;
  customer: { customerId: string };
  cart: CartItem[];
}

// Singleton pattern to store clientSecret
let clientSecretSingleton: string | null = null;

const StripePayment = ({
  amount,
  email,
  shippingAddress,
  customerName,
  postalCode,
  country,
  isSubscription,
  priceId,
  customer,
  cart,
}: StripePaymentProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(clientSecretSingleton);
  const [loading, setLoading] = useState(false);
  const paymentIntentCreationInProgress = useRef(false);

  useEffect(() => {
    // If we already have a client secret, don't create a new payment intent
    if (clientSecretSingleton) {
      return;
    }

    const createPaymentIntent = async () => {
      if (paymentIntentCreationInProgress.current) {
        return;
      }

      paymentIntentCreationInProgress.current = true;
      setLoading(true);

      try {
        let response;
        
        if (isSubscription && priceId && customer.customerId) {
          response = await fetch("/api/create-subscription", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              priceId,
              customerId: customer.customerId,
            }),
          });
        } else {
          response = await fetch("/api/create-payment-intent", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: amount,
              items: cart.map((item: CartItem) => ({
                id: item.variant_id,
                quantity: item.quantity,
                price: item.price,
                name: item.name,
                size: item.size,
                color: item.color
              }))
            }),
          });
        }

        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          clientSecretSingleton = data.clientSecret;
        }
      } catch (error) {
        setErrorMessage("Failed to initialize payment. Please try again.");
      } finally {
        setLoading(false);
        paymentIntentCreationInProgress.current = false;
      }
    };

    createPaymentIntent();
  }, [amount, cart, isSubscription, priceId, customer.customerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!stripe || !elements) {
      setErrorMessage('Payment processing is not ready');
      setLoading(false);
      return;
    }

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMessage(submitError.message ?? 'An error occurred during payment submission');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          currency: 'usd',
          paymentMethodType: 'card',
          items: cart.map((item: CartItem) => ({
            id: item.variant_id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            description: item.description,
            size: item.size,
            color: item.color
          }))
        }),
      });

      const { clientSecret, paymentIntentId } = await response.json();

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/shop/success?payment_intent=${paymentIntentId}&amount=${amount}`,
          receipt_email: email,
          shipping: {
            name: customerName,
            address: {
              line1: shippingAddress,
              postal_code: postalCode,
              country: country,
            },
          },
        },
      });

      if (confirmError) {
        setErrorMessage(confirmError.message ?? 'Payment confirmation failed');
      }
    } catch (error) {
      setErrorMessage('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!clientSecret || !stripe || !elements) {
    return (
      <div className="flex items-center justify-center p-4">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-e-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-black/50 p-4 rounded-md border border-white/20">
      {clientSecret && (
        <PaymentElement options={{
          layout: "tabs"
        }} />
      )}

      {errorMessage && (
        <div className="mt-4 p-2 bg-red-500/20 text-red-300 text-center rounded border border-red-500/40">
          {errorMessage}
        </div>
      )}

      <div className="flex justify-end mt-4">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="px-8 py-2 bg-white text-black hover:bg-white/90 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!loading ? "Complete Order" : "Processing..."}
        </button>
      </div>
    </form>
  );
};

export default StripePayment; 