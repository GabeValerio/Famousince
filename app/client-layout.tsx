"use client";

import { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import CartDrawer from './components/CartDrawer';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleCartOpen = () => setIsCartOpen(true);
  const handleCartClose = () => setIsCartOpen(false);

  return (
    <>
      <Header onCartClick={handleCartOpen} />
      <main className="min-h-screen">
        {children}
      </main>
      <CartDrawer isOpen={isCartOpen} onClose={handleCartClose} />
      <Footer />
    </>
  );
} 