'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { Users, Building2, Bell, Star, Briefcase } from "lucide-react";

interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
}

export default function OverviewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    orders: { total: 0, pending: 0, processing: 0, completed: 0 },
    revenue: { total: 0, thisMonth: 0, lastMonth: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      if (ordersError) {
        throw new Error('Failed to fetch orders');
      }

      // Fetch revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('revenue')
        .select('*');

      if (revenueError) {
        throw new Error('Failed to fetch revenue');
      }

      // Process stats with proper structure
      setStats({
        orders: {
          total: orders?.length || 0,
          pending: orders?.filter(o => o.status === 'pending').length || 0,
          processing: orders?.filter(o => o.status === 'processing').length || 0,
          completed: orders?.filter(o => o.status === 'completed').length || 0
        },
        revenue: {
          total: revenueData?.reduce((total, revenue) => total + revenue.amount, 0) || 0,
          thisMonth: revenueData?.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).reduce((total, revenue) => total + revenue.amount, 0) || 0,
          lastMonth: revenueData?.filter(r => new Date(r.date).getMonth() === new Date().getMonth() - 1).reduce((total, revenue) => total + revenue.amount, 0) || 0
        }
      });
    } catch (err) {
      setError('Failed to fetch statistics');
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 
          className="text-white text-2xl md:text-3xl"
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          Admin Overview
        </h1>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 md:p-4 border border-white/20">
        <p className="text-white/80 text-base md:text-lg">
          Welcome, {session?.user?.name || 'Admin'}
        </p>
      </div>

      <div className="space-y-4">
        <h2 
          className="text-white text-xl md:text-2xl"
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          Overview
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Orders Card */}
          <div 
            className="bg-white/5 rounded-lg p-6 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => router.push('/admin/orders')}
          >
            <div className="flex items-center gap-3 md:gap-4">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
              <div>
                <h2 className="font-semibold text-base md:text-lg text-white">Orders</h2>
                <p className="text-sm md:text-base text-white/60">Total: {stats.orders.total}</p>
              </div>
            </div>
            <div className="mt-3 md:mt-4 space-y-1 md:space-y-2 text-sm md:text-base text-white/80">
              <p>Pending: {stats.orders.pending}</p>
              <p>Processing: {stats.orders.processing}</p>
              <p>Completed: {stats.orders.completed}</p>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-white/5 rounded-lg p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <Briefcase className="w-6 h-6 md:w-8 md:h-8 text-white" />
              <div>
                <h2 className="font-semibold text-base md:text-lg text-white">Revenue</h2>
                <p className="text-sm md:text-base text-white/60">Total: {stats.revenue.total.toLocaleString('en-US')}</p>
              </div>
            </div>
            <div className="mt-3 md:mt-4 space-y-1 md:space-y-2 text-sm md:text-base text-white/80">
              <p>This Month: {stats.revenue.thisMonth.toLocaleString('en-US')}</p>
              <p>Last Month: {stats.revenue.lastMonth.toLocaleString('en-US')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 