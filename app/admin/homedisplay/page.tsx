"use client";

import React from "react";
import HomePageDisplay from "./components/HomePageDisplay";

export default function HomeDisplayPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative">
          <h1 
            className="text-white text-2xl md:text-3xl"
            style={{ fontFamily: 'Chalkduster, fantasy' }}
          >
            Homepage Display
          </h1>
        </div>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('saveLayout'))}
          className="bg-white text-black px-4 py-2 rounded hover:bg-white/90 text-sm font-semibold transition-colors"
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          Save Layout
        </button>
      </div>

      <HomePageDisplay />
    </div>
  );
} 