'use client';

import { ChevronRight, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';

interface BreadcrumbProps {
  items?: {
    label: string;
    href?: string;
  }[];
}

export default function AdminBreadcrumb({ items = [] }: BreadcrumbProps) {
  const { setSidebarOpen } = useSidebar();
  const pathname = usePathname();

  // Generate breadcrumb items from pathname if none provided
  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbItems(pathname);

  return (
    <nav className="flex items-center space-x-1 text-sm mb-4">
      {/* Hamburger for mobile */}
      <button
        className="block md:hidden mr-2 p-1 rounded hover:bg-white/10 focus:outline-none"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5 text-white" />
      </button>
      
      <Link 
        href="/admin"
        className="text-white hover:text-white/80 transition-colors"
      >
        Admin
      </Link>
      
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1 text-white/40" />
          {item.href ? (
            <Link 
              href={item.href}
              className="text-white/60 hover:text-white transition-colors capitalize"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-white capitalize">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

function generateBreadcrumbItems(pathname: string) {
  // Remove leading slash and 'admin' from path
  const path = pathname.split('/').filter(segment => segment && segment !== 'admin');
  
  return path.map((segment, index) => {
    // Create the href by joining all segments up to current
    const href = '/admin/' + path.slice(0, index + 1).join('/');
    
    // Format the label by replacing hyphens with spaces
    const label = segment.replace(/-/g, ' ');
    
    // Make the last item not a link
    return index === path.length - 1
      ? { label }
      : { label, href };
  });
} 