'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { Users, Building2, Bell, Star, Briefcase } from "lucide-react";

interface Stats {
  consultations: {
    total: number;
    pending: number;
    contacted: number;
    completed: number;
  };
  marketRequests: {
    total: number;
    pending: number;
    contacted: number;
    completed: number;
  };
  notifyRequests: {
    total: number;
    pending: number;
    contacted: number;
    completed: number;
  };
  testimonials: {
    total: number;
    active: number;
    inactive: number;
  };
  jobs: {
    total: number;
    active: number;
    inactive: number;
  };
}

export default function OverviewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    consultations: { total: 0, pending: 0, contacted: 0, completed: 0 },
    marketRequests: { total: 0, pending: 0, contacted: 0, completed: 0 },
    notifyRequests: { total: 0, pending: 0, contacted: 0, completed: 0 },
    testimonials: { total: 0, active: 0, inactive: 0 },
    jobs: { total: 0, active: 0, inactive: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      // Fetch consultations
      const { data: consultations, error: consultationsError } = await supabase
        .from('consultations')
        .select('*');

      if (consultationsError) {
        throw new Error('Failed to fetch consultations');
      }

      // Fetch market requests
      const { data: marketRequests, error: marketRequestsError } = await supabase
        .from('market_requests')
        .select('*');

      if (marketRequestsError) {
        throw new Error('Failed to fetch market requests');
      }

      // Fetch notify requests
      const { data: notifyRequests, error: notifyRequestsError } = await supabase
        .from('notify_requests')
        .select('*');

      if (notifyRequestsError) {
        throw new Error('Failed to fetch notify requests');
      }

      // Fetch testimonials
      const { data: testimonials, error: testimonialsError } = await supabase
        .from('testimonials')
        .select('*');

      if (testimonialsError) {
        throw new Error('Failed to fetch testimonials');
      }

      // Fetch jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*');

      if (jobsError) {
        throw new Error('Failed to fetch jobs');
      }

      // Process stats with proper structure
      setStats({
        consultations: {
          total: consultations?.length || 0,
          pending: consultations?.filter(c => c.status === 'pending').length || 0,
          contacted: consultations?.filter(c => c.status === 'contacted').length || 0,
          completed: consultations?.filter(c => c.status === 'completed').length || 0
        },
        marketRequests: {
          total: marketRequests?.length || 0,
          pending: marketRequests?.filter(m => m.status === 'pending').length || 0,
          contacted: marketRequests?.filter(m => m.status === 'contacted').length || 0,
          completed: marketRequests?.filter(m => m.status === 'completed').length || 0
        },
        notifyRequests: {
          total: notifyRequests?.length || 0,
          pending: notifyRequests?.filter(n => n.status === 'pending').length || 0,
          contacted: notifyRequests?.filter(n => n.status === 'contacted').length || 0,
          completed: notifyRequests?.filter(n => n.status === 'completed').length || 0
        },
        testimonials: {
          total: testimonials?.length || 0,
          active: testimonials?.filter(t => t.active === true).length || 0,
          inactive: testimonials?.filter(t => t.active === false).length || 0
        },
        jobs: {
          total: jobs?.length || 0,
          active: jobs?.filter(j => j.status === 'active').length || 0,
          inactive: jobs?.filter(j => j.status === 'inactive').length || 0
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Consultations Card */}
          <Card 
            className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
            onClick={() => router.push('/admin/consultations')}
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
                <div>
                  <h2 className="font-semibold text-base md:text-lg text-white">Consultations</h2>
                  <p className="text-sm md:text-base text-white/60">Total: {stats.consultations.total}</p>
                </div>
              </div>
              <div className="mt-3 md:mt-4 space-y-1 md:space-y-2 text-sm md:text-base text-white/80">
                <p>Pending: {stats.consultations.pending}</p>
                <p>Contacted: {stats.consultations.contacted}</p>
                <p>Completed: {stats.consultations.completed}</p>
              </div>
            </CardContent>
          </Card>

          {/* Market Requests Card */}
          <Card 
            className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
            onClick={() => router.push('/admin/market-requests')}
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <Building2 className="w-6 h-6 md:w-8 md:h-8 text-white" />
                <div>
                  <h2 className="font-semibold text-base md:text-lg text-white">Market Requests</h2>
                  <p className="text-sm md:text-base text-white/60">Total: {stats.marketRequests.total}</p>
                </div>
              </div>
              <div className="mt-3 md:mt-4 space-y-1 md:space-y-2 text-sm md:text-base text-white/80">
                <p>Pending: {stats.marketRequests.pending}</p>
                <p>Contacted: {stats.marketRequests.contacted}</p>
                <p>Completed: {stats.marketRequests.completed}</p>
              </div>
            </CardContent>
          </Card>

          {/* Notify Requests Card */}
          <Card 
            className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
            onClick={() => router.push('/admin/notify-requests')}
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <Bell className="w-6 h-6 md:w-8 md:h-8 text-white" />
                <div>
                  <h2 className="font-semibold text-base md:text-lg text-white">Notify Requests</h2>
                  <p className="text-sm md:text-base text-white/60">Total: {stats.notifyRequests.total}</p>
                </div>
              </div>
              <div className="mt-3 md:mt-4 space-y-1 md:space-y-2 text-sm md:text-base text-white/80">
                <p>Pending: {stats.notifyRequests.pending}</p>
                <p>Contacted: {stats.notifyRequests.contacted}</p>
                <p>Completed: {stats.notifyRequests.completed}</p>
              </div>
            </CardContent>
          </Card>

          {/* Testimonials Card */}
          <Card 
            className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
            onClick={() => router.push('/admin/testimonials')}
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <Star className="w-6 h-6 md:w-8 md:h-8 text-white" />
                <div>
                  <h2 className="font-semibold text-base md:text-lg text-white">Testimonials</h2>
                  <p className="text-sm md:text-base text-white/60">Total: {stats.testimonials.total}</p>
                </div>
              </div>
              <div className="mt-3 md:mt-4 space-y-1 md:space-y-2 text-sm md:text-base text-white/80">
                <p>Active: {stats.testimonials.active}</p>
                <p>Inactive: {stats.testimonials.inactive}</p>
              </div>
            </CardContent>
          </Card>

          {/* Jobs Card */}
          <Card 
            className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
            onClick={() => router.push('/admin/jobs')}
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <Briefcase className="w-6 h-6 md:w-8 md:h-8 text-white" />
                <div>
                  <h2 className="font-semibold text-base md:text-lg text-white">Job Listings</h2>
                  <p className="text-sm md:text-base text-white/60">Total: {stats.jobs.total}</p>
                </div>
              </div>
              <div className="mt-3 md:mt-4 space-y-1 md:space-y-2 text-sm md:text-base text-white/80">
                <p>Full Time: {stats.jobs.active}</p>
                <p>Other: {stats.jobs.inactive}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 