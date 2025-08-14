"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Users, Mail, Calendar } from 'lucide-react';

interface WaitlistEntry {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  subscribed_at: string;
  created_at: string;
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWaitlistEntries();
  }, []);

  const fetchWaitlistEntries = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/waitlist/admin');
      
      if (!response.ok) {
        throw new Error('Failed to fetch waitlist entries');
      }
      
      const result = await response.json();
      setEntries(result.data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch waitlist');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Subscribed Date'];
    const csvContent = [
      headers.join(','),
      ...entries.map(entry => [
        entry.first_name,
        entry.last_name,
        entry.email,
        new Date(entry.subscribed_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-2 text-white/80">Loading waitlist...</p>
        </div>
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
          Waitlist Management
        </h1>
        <Button
          onClick={exportToCSV}
          className="bg-white text-black hover:bg-white/90"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-white/60" />
            <div>
              <p className="text-white/60 text-sm">Total Subscribers</p>
              <p className="text-white text-2xl font-bold">{entries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <div className="flex items-center space-x-3">
            <Mail className="h-8 w-8 text-white/60" />
            <div>
              <p className="text-white/60 text-sm">This Month</p>
              <p className="text-white text-2xl font-bold">
                {entries.filter(entry => {
                  const entryDate = new Date(entry.subscribed_at);
                  const now = new Date();
                  return entryDate.getMonth() === now.getMonth() && 
                         entryDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-white/60" />
            <div>
              <p className="text-white/60 text-sm">This Week</p>
              <p className="text-white text-2xl font-bold">
                {entries.filter(entry => {
                  const entryDate = new Date(entry.subscribed_at);
                  const now = new Date();
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  return entryDate >= weekAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Waitlist Entries */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
        <div className="px-6 py-4 border-b border-white/20">
          <h2 className="text-white text-lg font-medium">Recent Subscribers</h2>
          <p className="text-white/60 text-sm">People who have joined the waitlist</p>
        </div>
        
        <div className="p-6">
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60">No waitlist entries yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-white font-medium">
                          {entry.first_name} {entry.last_name}
                        </h3>
                        <span className="text-white/60 text-sm">•</span>
                        <span className="text-white/60 text-sm">{entry.email}</span>
                      </div>
                      <p className="text-white/60 text-xs">
                        Joined: {new Date(entry.subscribed_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
