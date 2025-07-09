"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProductDisplayImage } from '@/app/utils/productUtils';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load cart from localStorage on mount
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        // Calculate initial total
        const total = parsedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setTotalAmount(total);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        setCart([]);
        setTotalAmount(0);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Only save to localStorage if we're not in the initial loading phase
    if (!isLoading) {
      localStorage.setItem('cart', JSON.stringify(cart));
      // Update total amount
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setTotalAmount(total);
    }
  }, [cart, isLoading]);

  const addToCart = (productOrItem, variantOrQuantity = 1, quantity = 1) => {
    setCart(currentCart => {
      // Handle case where a complete item object is passed
      if (typeof variantOrQuantity === 'number') {
        const item = productOrItem;
        const itemQuantity = variantOrQuantity;
        
        const existingItemIndex = currentCart.findIndex(cartItem => cartItem.id === item.id);
        
        if (existingItemIndex >= 0) {
          // Update quantity if item exists
          const updatedCart = [...currentCart];
          updatedCart[existingItemIndex] = {
            ...updatedCart[existingItemIndex],
            quantity: updatedCart[existingItemIndex].quantity + itemQuantity
          };
          return updatedCart;
        }
        
        return [...currentCart, { ...item, quantity: itemQuantity }];
      }
      
      // Handle case where separate product and variant objects are passed
      const product = productOrItem;
      const variant = variantOrQuantity;
      const cartItemId = `${product.id}-${variant.size}-${variant.color}`;
      const existingItemIndex = currentCart.findIndex(item => item.id === cartItemId);

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const updatedCart = [...currentCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        };
        return updatedCart;
      } else {
        // Add new item
        const newItem = {
          id: cartItemId,
          product_id: product.id,
          variant_id: variant.id,
          name: product.name,
          description: product.description,
          price: variant.price,
          quantity: quantity,
          image: getProductDisplayImage(product, variant),
          size: variant.size,
          color: variant.color
        };
        return [...currentCart, newItem];
      }
    });
  };

  const removeFromCart = (itemId) => {
    setCart(currentCart => currentCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    setCart(currentCart => {
      return currentCart.map(item => {
        if (item.id === itemId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  if (isLoading) {
    return null; // Or a loading spinner if you prefer
  }

  return (
    <CartContext.Provider value={{
      cart,
      totalAmount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
