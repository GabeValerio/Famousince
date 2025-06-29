import React from 'react'

export function MostFamousLabel() {
  return (
    <div 
      className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-90 text-white px-2 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-xl z-50 border border-white/30 flex items-center whitespace-nowrap"
      style={{
        background: 'linear-gradient(to bottom, #ffffff, #c0c0c0, #808080, #c0c0c0, #ffffff)',
        boxShadow: '0 4px 15px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)'
      }}
    >
      <span>most famous</span>&nbsp;<span>🔥</span>
    </div>
  )
} 