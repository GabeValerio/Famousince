"use client";

import { useState, useEffect } from "react";

interface SiteConfig {
  id: string;
  key: string;
  value: boolean;
  description: string;
  updated_at: string;
}

export default function SiteConfigPage(): JSX.Element {
  const [configs, setConfigs] = useState<SiteConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  async function fetchConfigs() {
    try {
      const response = await fetch('/api/site-config');
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error fetching configs:', result.error);
        return;
      }
      
      setConfigs(result.data || []);
    } catch (error) {
      console.error('Error in fetchConfigs:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateConfig(key: string, newValue: boolean) {
    setIsUpdating(key);
    try {
      const response = await fetch('/api/site-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value: newValue }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error updating config:', {
          status: response.status,
          statusText: response.statusText,
          result
        });
        alert(`Error updating configuration: ${result.error}`);
        return;
      }
      
      // Update local state
      setConfigs(prev => prev.map(config => 
        config.key === key ? { ...config, value: newValue, updated_at: new Date().toISOString() } : config
      ));
      
      // Show success message
      alert(result.message);
      
      // If we're updating the deploy_site config, also show deployment info
      if (key === 'deploy_site') {
        if (newValue) {
          alert('🚀 Site is now LIVE! Visitors will see the main website.');
        } else {
          alert('🚧 Site is now in Coming Soon mode. Visitors will be redirected to the Coming Soon page.');
        }
      }
    } catch (error) {
      console.error('Error in updateConfig:', error);
      alert('Error updating configuration');
    } finally {
      setIsUpdating(null);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-2 text-white/80">Loading site configuration...</p>
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
          Manage Site Configuration
        </h1>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
        <div className="px-6 py-4 border-b border-white/20">
          <p className="mt-1 text-white/80 text-sm">
            Manage site-wide configuration settings. Changes take effect immediately.
          </p>
        </div>
        
        <div className="p-6">
          {configs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/80 mb-4">No configurations found.</p>
              <button 
                onClick={fetchConfigs}
                className="px-6 py-3 rounded-lg bg-white text-black hover:bg-white/90 transition-colors"
                style={{ fontFamily: 'Chalkduster, fantasy' }}
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {configs.map((config) => (
                <div key={config.id} className="bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="text-white text-lg mb-2"
                          style={{ fontFamily: 'Chalkduster, fantasy' }}
                        >
                          {config.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <p className="text-white/80 text-sm mb-3">
                          {config.description}
                        </p>
                        <p className="text-white/60 text-xs">
                          Last updated: {new Date(config.updated_at).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-center">
                          <div className="text-white/60 text-xs mb-1">Current Status</div>
                          <span className={`inline-block px-4 py-2 text-sm font-semibold rounded-lg ${
                            config.value 
                              ? 'bg-white/10 text-white border border-white/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {config.value ? '🟢 ENABLED' : '🔴 DISABLED'}
                          </span>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-white/60 text-xs mb-1">Action</div>
                          <button
                            onClick={() => updateConfig(config.key, !config.value)}
                            disabled={isUpdating === config.key}
                            className={`min-w-[120px] px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                              config.value
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                            } ${isUpdating === config.key ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isUpdating === config.key ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                Updating...
                              </div>
                            ) : (
                              config.value ? 'Disable Site' : 'Enable Site'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Info Sections */}
          <div className="mt-8 bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 
                  className="text-white text-lg"
                  style={{ fontFamily: 'Chalkduster, fantasy' }}
                >
                  How Deploy Site Works
                </h3>
                <div className="mt-2 text-white/80 text-sm">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>ENABLED:</strong> Visitors see the full website with all features</li>
                    <li><strong>DISABLED:</strong> Visitors are redirected to the Coming Soon page</li>
                    <li>Changes take effect immediately across all devices</li>
                    <li>The admin panel is always accessible regardless of this setting</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 
                  className="text-white text-lg"
                  style={{ fontFamily: 'Chalkduster, fantasy' }}
                >
                  Quick Test
                </h3>
                <div className="mt-2 text-white/80 text-sm">
                  <p>
                    After making changes, visit <code className="bg-white/10 px-2 py-0.5 rounded text-white">http://localhost:3004</code> in a new tab to see the effect immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}