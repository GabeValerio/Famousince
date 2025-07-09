'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import { cn } from '@/lib/utils';
import { Home, Store, Layers, Settings, CreditCard, Package, Server, ShoppingCart } from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useSidebar();

  const navItems = [
    {
      title: "Products",
      href: "/admin/store",
      icon: <Store className="h-4 w-4" />,
    },
    {
      title: "Product Types",
      href: "/admin/product-types",
      icon: <Package className="h-4 w-4" />,
    },
    {
      title: "Home Display",
      href: "/admin/homedisplay",
      icon: <Home className="h-4 w-4" />,
    },
    {
      title: "Exception Table",
      href: "/admin/exceptions",
      icon: <Layers className="h-4 w-4" />,
    },
    {
      title: "Orders",
      href: "/admin/orders",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
    {
      title: "Stripe Setup",
      href: "/admin/stripe",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      title: "Hosting Site",
      href: "/admin/hosting",
      icon: <Server className="h-4 w-4" />,
    },
    {
      title: "Site Config",
      href: "/admin/site-config",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  const handleNavClick = () => {
    // Only close sidebar on mobile
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside className={`
      fixed md:relative 
      top-0 left-0 h-screen md:h-auto
      bg-black
      transition-[width] duration-200 ease-in-out
      md:w-64 md:min-h-full
      ${sidebarOpen ? 'w-64' : 'w-0'}
      shadow-lg md:shadow-none
      overflow-hidden
      flex-shrink-0
      z-50
      border-r border-white/20
    `}>
      <div className="h-full flex flex-col w-64">
        {/* Title Section - Only visible on mobile */}
        <div className="flex justify-center w-full pt-6 pb-2 md:hidden">
          <h1 
            className="text-white text-2xl"
            style={{ fontFamily: 'Chalkduster, fantasy' }}
          >
            FAMOUS SINCE
          </h1>
        </div>
        
        <div className="flex-1 p-6 md:p-8 pt-2 md:pt-6">
          <div className="flex justify-center mb-8">
            <h2 
              className="text-white text-xl"
              style={{ fontFamily: 'Chalkduster, fantasy' }}
            >
              Admin Panel
            </h2>
          </div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  pathname === item.href ? 'bg-white !text-black' : 'text-white hover:bg-white/10'
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
} 