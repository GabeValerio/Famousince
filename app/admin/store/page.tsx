"use client";

import React from "react";
import ProductManagement from "./components/ProductManagement";

export default function StorePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative">
          <h1 
            className="text-white text-2xl md:text-3xl"
            style={{ fontFamily: 'Chalkduster, fantasy' }}
          >
            Product Management
          </h1>
        </div>

        <button
          className="bg-white text-black px-4 py-2 rounded hover:bg-white/90 text-sm font-semibold transition-colors"
          onClick={() => window.dispatchEvent(new CustomEvent('openAddProduct'))}
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          Add Product
        </button>
      </div>

      <ProductManagement />
    </div>
  );
}
