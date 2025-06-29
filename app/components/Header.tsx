"use client"

import { ShoppingCart, User, Home, Store } from "lucide-react"
import { useState } from "react"
import { useCart } from "@/lib/CartContext"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { UserDropdown } from "./UserDropdown"

interface HeaderProps {
  onCartClick: () => void;
}

export function Header({ onCartClick }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(1024);
  const { cart } = useCart();
  const { data: session } = useSession();
  const [isNavBarOpen, setIsNavBarOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const totalQuantity = cart.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0);

  return (
    <header className="w-full bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Navigation icons on the left */}
          <div className="flex space-x-2">
            <Link href="/">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Home className="h-6 w-6 text-white" />
              </button>
            </Link>
            <Link href="/shop">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Store className="h-6 w-6 text-white" />
              </button>
            </Link>
          </div>

          <div className="flex space-x-2">
            {/* User icon - shows dropdown if authenticated, links to login if not */}
            {session ? (
              <div className="relative">
                <button 
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <User className="h-6 w-6 text-white" />
                </button>
                <UserDropdown
                  isOpen={isUserDropdownOpen}
                  onClose={() => setIsUserDropdownOpen(false)}
                  userName={session.user?.name}
                />
              </div>
            ) : (
              <Link href="/login">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <User className="h-6 w-6 text-white" />
                </button>
              </Link>
            )}

            {/* Shopping cart icon */}
            <button 
              onClick={onCartClick}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
            >
              <ShoppingCart className="h-6 w-6 text-white" />
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalQuantity}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
