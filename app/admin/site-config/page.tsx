"use client";

import { useState, useEffect } from "react";

interface SiteConfig {
  id: string;
  key: string;
  value: boolean;
  description: string;
  updated_at: string;
}

interface RequirementsStatus {
  hostingActive: boolean;
  stripeSetup: boolean;
  canDeploy: boolean;
  requirements: {
    hosting: {
      active: boolean;
      message: string;
    };
    stripe: {
      setup: boolean;
      message: string;
    };
  };
}

export default function SiteConfigPage(): JSX.Element {
  const [configs, setConfigs] = useState<SiteConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [requirementsStatus, setRequirementsStatus] = useState<RequirementsStatus | null>(null);
  const [isCheckingRequirements, setIsCheckingRequirements] = useState(false);

  useEffect(() => {
    fetchConfigs();
    checkRequirements();
  }, []);

  async function fetchConfigs() {
    try {
      const response = await fetch('/api/site-config');
      const result = await response.json();
      
      if (!response.ok) {
        return;
      }
      
      setConfigs(result.data || []);
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function checkRequirements() {
    try {
      setIsCheckingRequirements(true);
      const response = await fetch('/api/site-config/status');
      const result = await response.json();
      
      if (!response.ok) {
        return;
      }
      
      setRequirementsStatus(result);
    } catch (error) {
      console.error('Error checking requirements:', error);
    } finally {
      setIsCheckingRequirements(false);
    }
  }

  async function updateConfig(key: string, newValue: boolean) {
    // Prevent enabling deploy_site if requirements aren't met
    if (key === 'deploy_site' && newValue === true && requirementsStatus && !requirementsStatus.canDeploy) {
      alert('Cannot enable site deployment. Please ensure both hosting subscription is active and Stripe Connect account is fully configured.');
      return;
    }

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

      {/* Requirements Status Section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
        <div className="px-6 py-4 border-b border-white/20">
          <h2 className="text-white text-lg font-medium">Deployment Requirements</h2>
          <p className="mt-1 text-white/80 text-sm">
            Both hosting subscription and Stripe setup must be complete before enabling site deployment.
          </p>
        </div>
        
        <div className="p-6">
          {isCheckingRequirements ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              <span className="text-white/80">Checking requirements...</span>
            </div>
          ) : requirementsStatus ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Hosting Status */}
              <div className={`p-4 rounded-lg border ${
                requirementsStatus.hostingActive 
                  ? 'bg-green-500/10 border-green-500/20' 
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    requirementsStatus.hostingActive ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <h3 className="text-white font-medium">Hosting Subscription</h3>
                </div>
                <p className="text-white/80 text-sm">{requirementsStatus.requirements.hosting.message}</p>
                {!requirementsStatus.hostingActive && (
                  <a 
                    href="/admin/hosting" 
                    className="inline-block mt-3 text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Set up hosting →
                  </a>
                )}
              </div>

              {/* Stripe Status */}
              <div className={`p-4 rounded-lg border ${
                requirementsStatus.stripeSetup 
                  ? 'bg-green-500/10 border-green-500/20' 
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${
                    requirementsStatus.stripeSetup ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <h3 className="text-white font-medium">Stripe Connect</h3>
                </div>
                <p className="text-white/80 text-sm">{requirementsStatus.requirements.stripe.message}</p>
                {!requirementsStatus.stripeSetup && (
                  <a 
                    href="/admin/stripe" 
                    className="inline-block mt-3 text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Set up Stripe →
                  </a>
                )}
              </div>
            </div>
          ) : null}

          {/* Overall Status */}
          {requirementsStatus && (
            <div className={`mt-6 p-4 rounded-lg border ${
              requirementsStatus.canDeploy 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-yellow-500/10 border-yellow-500/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${
                  requirementsStatus.canDeploy ? 'bg-green-400' : 'bg-yellow-400'
                }`}></div>
                <div>
                  <h3 className="text-white font-medium">
                    {requirementsStatus.canDeploy ? 'Ready to Deploy' : 'Setup Required'}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {requirementsStatus.canDeploy 
                      ? 'All requirements are met. You can now enable site deployment.' 
                      : 'Please complete the missing requirements above before enabling site deployment.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {!requirementsStatus && !isCheckingRequirements && (
            <div className="text-center py-4">
              <p className="text-white/60 mb-3">Unable to check requirements status</p>
              <button 
                onClick={checkRequirements}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/20"
              >
                Retry
              </button>
            </div>
          )}
        </div>
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
              {configs.map((config) => {
                // Check if this config should be disabled due to requirements
                const isDeployConfig = config.key === 'deploy_site';
                const isDisabled = isDeployConfig && requirementsStatus ? !requirementsStatus.canDeploy : false;
                
                return (
                  <div key={config.id} className={`bg-white/5 border border-white/10 rounded-lg transition-colors ${
                    isDisabled ? 'opacity-60' : 'hover:bg-white/10'
                  }`}>
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
                          
                          {/* Show requirement warning for deploy_site */}
                          {isDeployConfig && isDisabled && (
                            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                              <p className="text-yellow-400 text-sm">
                                ⚠️ Site deployment requires both hosting subscription and Stripe Connect setup to be complete.
                              </p>
                            </div>
                          )}
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
                              disabled={isUpdating === config.key || isDisabled}
                              className={`min-w-[120px] px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                                config.value
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                              } ${(isUpdating === config.key || isDisabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                );
              })}
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
                    <li><strong>Requirements:</strong> Hosting subscription and Stripe Connect setup must be complete</li>
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