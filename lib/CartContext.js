"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load cart from localStorage only on the client-side
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    // Save cart to local storage whenever it changes, but only after initial load
    if (isLoaded) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      // Check if the product is a subscription
      if (product.isSubscription) {
        const existingSubscription = prevCart.find(
          (item) => item.id === product.id && item.isSubscription
        );
        if (existingSubscription) {
          return prevCart;
        }
      }

      // Find existing item with EXACT same variant (using the composite ID)
      const existingItem = prevCart.find(
        (item) => item.id === `${product.id}-${product.size}-${product.color}`
      );

      if (existingItem) {
        return prevCart.map((item) =>
          item.id === `${product.id}-${product.size}-${product.color}`
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        );
      }
      return [...prevCart, { 
        ...product,
        id: `${product.id}-${product.size}-${product.color}` // Ensure ID is set correctly
      }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, totalAmount, isLoaded }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
