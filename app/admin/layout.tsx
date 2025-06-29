'use client';

import { useSession } from 'next-auth/react';
import { AdminNav } from './components/AdminNav';
import AdminBreadcrumb from './components/AdminBreadcrumb';
import { SidebarProvider } from './components/SidebarContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen bg-black text-white">        
        {/* Main content area with sidebar */}
        <div className="flex flex-1 w-full">
          {/* Admin Navigation */}
          <AdminNav />

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
              <AdminBreadcrumb />
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
} 