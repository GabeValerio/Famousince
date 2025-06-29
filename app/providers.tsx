'use client'

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { CartProvider } from '@/lib/CartContext';

interface Props {
  children: React.ReactNode;
  session?: Session | null;
}

export function Providers({ children, session }: Props) {
  return (
    <SessionProvider session={session}>
      <CartProvider>
        {children}
      </CartProvider>
    </SessionProvider>
  );
}
