"use client";

import { useCart } from "../../lib/CartContext";
import { Button } from "@/components/ui/button";
import { FaMinus, FaPlus, FaTimes } from "react-icons/fa";
import { useState, useEffect } from "react";
import Image from 'next/image';

const CartDrawer = ({ isOpen, onClose }) => {
  const [isBreakdownMode, setIsBreakdownMode] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleResize = () => {
      setIsBreakdownMode(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const { cart, removeFromCart, updateQuantity, totalAmount } = useCart();
  const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleQuantityChange = (id, value) => {
    updateQuantity(id, value);
  };

  const handleRemoveItem = (id) => {
    removeFromCart(id);
  };

  const handleCheckout = () => {
    if (totalQuantity === 0) {
      setErrorMessage("Oh No! Looks like your Cart is empty.");
    } else {
      setErrorMessage("");
      window.location.href = '/shop/checkout';
    }
  };

  return (
    <div 
      className={`fixed top-0 right-0 h-full ${isBreakdownMode ? 'w-4/5' : 'w-1/3'} bg-black shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="absolute top-4 right-4">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="border-white/20 bg-black hover:bg-white hover:text-black text-white transition-colors"
        >
          <FaTimes className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4">
        <h2 
          className="font-bold mt-8 mb-4 text-2xl text-center text-white w-full"
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          Your Shopping Cart
        </h2>
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-250px)]">
          {cart.map((item) => (
            <div key={item.id} className="grid grid-cols-[80px_1fr_auto] items-center gap-4 text-sm border border-white/20 rounded-lg p-3">
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.name}
                width={80}
                height={80}
                className="rounded-md object-cover"
              />
              <div className="grid gap-1">
                <h3 className="font-medium text-sm text-white">{item.name}</h3>
                <div className="text-xs text-white/60">
                  {item.size && <span>Size: {item.size}</span>}
                  {item.size && item.color && <span> • </span>}
                  {item.color && <span>Color: {item.color}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    disabled={item.quantity === 1}
                    className="border-white/20 bg-black hover:bg-white hover:text-black text-white disabled:text-white/40 transition-colors"
                  >
                    <FaMinus className="w-4 h-4" />
                  </Button>
                  <span className="text-white">{item.quantity}</span>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    className="border-white/20 bg-black hover:bg-white hover:text-black text-white transition-colors"
                  >
                    <FaPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <span className="font-medium text-sm text-white">${item.price ? item.price.toFixed(2) : '0.00'}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-white/60 hover:bg-white hover:text-black transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/20 pt-4 mt-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium text-white/60">Subtotal</span>
            <span className="text-2xl font-bold text-white">${totalAmount.toFixed(2)}</span>
          </div>
          <Button 
            className="w-full bg-white text-black hover:bg-white/90"
            onClick={handleCheckout}
            style={{ fontFamily: 'Chalkduster, fantasy' }}
          >
            Checkout
          </Button>
          {errorMessage && (
            <div className="mt-2 p-2 bg-red-500/20 text-red-300 text-center rounded border border-red-500/40">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
