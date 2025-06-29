"use client";

import React, { useState } from "react";
import ProductManagement from "./components/ProductManagement";
import HomePageDisplay from "./components/HomePageDisplay";
import { ChevronDown } from 'lucide-react';

export default function StorePage() {
  const [currentView, setCurrentView] = useState<'products' | 'homepage'>('products');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative group">
          <button
            onClick={() => setCurrentView(currentView === 'products' ? 'homepage' : 'products')}
            className="text-white text-2xl md:text-3xl flex items-center gap-2 hover:text-white/90 transition-colors"
            style={{ fontFamily: 'Chalkduster, fantasy' }}
          >
            {currentView === 'products' ? 'Product Management' : 'Homepage Display'}
            <ChevronDown className="h-6 w-6 transition-transform group-hover:translate-y-0.5" />
          </button>
        </div>

        {currentView === 'products' ? (
          <button
            className="bg-white text-black px-4 py-2 rounded hover:bg-white/90 text-sm font-semibold transition-colors"
            onClick={() => window.dispatchEvent(new CustomEvent('openAddProduct'))}
            style={{ fontFamily: 'Chalkduster, fantasy' }}
          >
            Add Product
          </button>
        ) : (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('saveLayout'))}
            className="bg-white text-black px-4 py-2 rounded hover:bg-white/90 text-sm font-semibold transition-colors"
            style={{ fontFamily: 'Chalkduster, fantasy' }}
          >
            Save Layout
          </button>
        )}
      </div>

      {currentView === 'products' ? <ProductManagement /> : <HomePageDisplay />}
    </div>
  );
}
