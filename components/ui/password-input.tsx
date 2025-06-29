"use client";

import React, { useState } from 'react';
import { Input } from "./input";
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (value: string) => void;
}

export function PasswordInput({ onChange, className, ...props }: PasswordInputProps) {
  const [password, setPassword] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setPassword(newValue);
    onChange?.(newValue);
  };

  const toggleVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        {...props}
        className={`absolute inset-0 w-full h-full opacity-0 z-10 ${className}`}
        value={password}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <div 
        className={`
          ${className} 
          border border-input 
          bg-background 
          pointer-events-none 
          flex items-center 
          gap-0.5 
          pl-10
          pr-10
          ring-offset-background
          ${isFocused ? 'ring-2 ring-ring ring-offset-2' : ''}
          transition-all
          relative
        `}
      >
        {password.length === 0 && (
          <span className="text-muted-foreground absolute left-10">{props.placeholder}</span>
        )}
        
        <div className="flex items-center gap-0.5 flex-1">
          {showPassword ? (
            <span className="text-sm">{password}</span>
          ) : (
            password.split('').map((_, index) => (
              <Image
                key={index}
                src="/images/yugioh_star.png"
                width={16}
                height={16}
                alt="star"
                className="h-4 w-4"
              />
            ))
          )}
          {isFocused && (
            <div 
              className="w-[2px] h-5 bg-[#000000]" 
              style={{ 
                animation: 'blink 1s step-end infinite',
              }}
            />
          )}
        </div>
      </div>
      
      <button
        type="button"
        onClick={toggleVisibility}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 cursor-pointer"
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="h-5 w-5 text-gray-400" />
        ) : (
          <Eye className="h-5 w-5 text-gray-400" />
        )}
      </button>
    </div>
  );
}

// Add this to your global CSS file (app/globals.css)
const styles = `
@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
} 