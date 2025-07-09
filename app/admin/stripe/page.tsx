"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, XCircle, Info } from 'lucide-react';

interface ConnectFormData {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  business_name: string;
  business_type: 'individual' | 'company' | 'non_profit' | 'government_entity';
}

interface StripeAccount {
  account_id: string;
  business_name: string;
  email: string;
  onboarding_complete: boolean;
  first_name: string;
  last_name: string;
}

export default function StripeConnectPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [account, setAccount] = useState<StripeAccount | null>(null);
  const [isOwnerAccount, setIsOwnerAccount] = useState(false);
  const [updatingProducts, setUpdatingProducts] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [formData, setFormData] = useState<ConnectFormData>({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    business_name: '',
    business_type: 'individual'
  });

  useEffect(() => {
    checkExistingAccount();
  }, []);

  const checkExistingAccount = async () => {
    try {
      // Check if there's an existing account
      const { data, error: accountError } = await supabase
        .from("stripe_connect_accounts")
        .select("*")
        .single();

      if (accountError && accountError.code !== 'PGRST116') {
        throw accountError;
      }

      if (data) {
        setAccount(data);
        
        // Check if this is the owner account by checking if any products use this account_id
        const { count, error: countError } = await supabase
          .from('products')
          .select('id', { count: 'exact' })
          .eq('stripe_account_id', data.account_id);
          
        if (countError) {
          console.error('Error checking owner status:', countError);
        }
          
        setIsOwnerAccount(count ? count > 0 : false);
      }
    } catch (err) {
      console.error('Error checking account:', err);
      setError('Failed to check existing account');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/stripe/connect/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect with Stripe');
      }

      if (!data.url) {
        throw new Error('No redirect URL provided');
      }

      // Redirect to Stripe's hosted onboarding
      window.location.href = data.url;
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect with Stripe');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetAsOwner = async () => {
    if (!account?.account_id) return;
    
    try {
      setUpdatingProducts(true);
      setError(null);
      
      console.log('Updating products and product types with account ID:', account.account_id);
      
      const response = await fetch('/api/stripe/connect/update-owner-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId: account.account_id
        })
      });

      const data = await response.json();
      console.log('Response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update products');
      }

      // Update product types directly with Supabase
      const { error: productTypesError } = await supabase
        .from('product_types')
        .update({ stripe_account_id: account.account_id })
        .neq('stripe_account_id', account.account_id);

      if (productTypesError) {
        throw new Error('Failed to update product types');
      }

      // Verify the updates
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, stripe_account_id')
        .limit(1);
        
      console.log('Products verification:', { products, error: productsError });

      if (productsError) {
        throw new Error('Failed to verify product update');
      }

      const { data: productTypes, error: typesVerifyError } = await supabase
        .from('product_types')
        .select('id, stripe_account_id')
        .limit(1);

      console.log('Product types verification:', { productTypes, error: typesVerifyError });

      if (typesVerifyError) {
        throw new Error('Failed to verify product types update');
      }

      setSuccess('Successfully set as owner account and updated all products and product types');
      setIsOwnerAccount(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update products and product types');
    } finally {
      setUpdatingProducts(false);
    }
  };

  const handleClearOwner = async () => {
    if (!window.confirm('Are you sure you want to clear the owner account? This will remove the Stripe account ID from all products and product types.')) {
      return;
    }
    
    try {
      setClearing(true);
      setError(null);
      
      console.log('Clearing owner account from products and product types');
      
      const response = await fetch('/api/stripe/connect/clear-owner-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear owner account');
      }

      // Clear product types directly with Supabase
      const { error: productTypesError } = await supabase
        .from('product_types')
        .update({ stripe_account_id: null });

      if (productTypesError) {
        throw new Error('Failed to clear product types');
      }

      // Verify the updates
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, stripe_account_id')
        .limit(1);
        
      console.log('Products verification:', { products, error: productsError });

      if (productsError) {
        throw new Error('Failed to verify product update');
      }

      const { data: productTypes, error: typesVerifyError } = await supabase
        .from('product_types')
        .select('id, stripe_account_id')
        .limit(1);

      console.log('Product types verification:', { productTypes, error: typesVerifyError });

      if (typesVerifyError) {
        throw new Error('Failed to verify product types update');
      }

      setSuccess('Successfully cleared owner account from all products and product types');
      setIsOwnerAccount(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear owner account');
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-2 text-white/80">Loading Stripe configuration...</p>
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
          Stripe Connect Setup
        </h1>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded">
          <p className="text-green-400">{success}</p>
        </div>
      )}
      
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
        <div className="px-6 py-4 border-b border-white/20">
          <p className="mt-1 text-white/80 text-sm">
            Connect your Stripe account to start accepting payments securely and manage your earnings in one place.
          </p>
        </div>
        
        <div className="p-6">
          {account ? (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="text-white text-lg mb-2"
                        style={{ fontFamily: 'Chalkduster, fantasy' }}
                      >
                        {account.business_name}
                      </h3>
                      <p className="text-white/60">{account.email}</p>
                      
                      <div className="mt-4">
                        <div className="flex items-center gap-2">
                          {account.onboarding_complete ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-green-400" />
                              <span className="text-green-400">Connected</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-5 w-5 text-yellow-400" />
                              <span className="text-yellow-400">Setup Incomplete</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-white/60">Account ID</dt>
                      <dd className="text-white font-mono text-sm">{account.account_id}</dd>
                    </div>
                    <div>
                      <dt className="text-white/60">Status</dt>
                      <dd className="text-white">
                        {isOwnerAccount ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-green-400">
                              <CheckCircle2 className="h-4 w-4" />
                              Owner Account
                            </span>
                            <Button
                              onClick={handleClearOwner}
                              disabled={clearing}
                              variant="outline"
                              size="sm"
                              className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 ml-2"
                            >
                              {clearing ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                  Clearing...
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Clear
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-white/60">Connected Account</span>
                        )}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>

              {account.onboarding_complete && !isOwnerAccount && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 
                    className="text-white text-lg mb-4"
                    style={{ fontFamily: 'Chalkduster, fantasy' }}
                  >
                    Set as Owner Account
                  </h3>
                  <p className="text-white/60 mb-4">
                    Setting this as the owner account will update all products to use this Stripe account for payments.
                    This action cannot be undone without contacting support.
                  </p>
                  <Button
                    onClick={handleSetAsOwner}
                    disabled={updatingProducts}
                    className="bg-white text-black hover:bg-white/90 flex items-center gap-2"
                  >
                    {updatingProducts ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating Products...
                      </>
                    ) : (
                      <>
                        Set as Owner Account
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!account.onboarding_complete && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-6">
                  <h3 className="font-medium text-yellow-400 mb-2">Action Required</h3>
                  <p className="text-white/60 mb-4">
                    Your Stripe account setup is incomplete. You need to complete the onboarding process to start receiving payments.
                  </p>
                  <Button
                    onClick={() => window.location.href = '/admin/stripe/refresh'}
                    className="bg-yellow-500 text-black hover:bg-yellow-400"
                  >
                    Complete Setup
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 
                  className="text-white text-lg mb-4"
                  style={{ fontFamily: 'Chalkduster, fantasy' }}
                >
                  Payment Processing
                </h3>
                <ul className="list-disc list-inside text-white/60 space-y-2">
                  <li>Secure payment processing through our platform</li>
                  <li>Automatic fee handling and transfers</li>
                  <li>Direct deposits to your bank account</li>
                </ul>
              </div>

              <form onSubmit={handleConnect} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      className="bg-white/10 border-white/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                      className="bg-white/10 border-white/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="bg-white/10 border-white/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="bg-white/10 border-white/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleInputChange}
                      required
                      className="bg-white/10 border-white/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_type">Business Type</Label>
                    <select
                      id="business_type"
                      name="business_type"
                      value={formData.business_type}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white/10 border-white/20 rounded-md px-3 py-2 text-white"
                    >
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                      <option value="non_profit">Non-Profit</option>
                      <option value="government_entity">Government Entity</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-white text-black hover:bg-white/90 py-6 text-lg"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Connecting...
                    </div>
                  ) : (
                    'Connect with Stripe'
                  )}
                </Button>
              </form>
            </div>
          )}
          
          {/* Info Section */}
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
                  About Stripe Connect
                </h3>
                <div className="mt-2 text-white/80 text-sm">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">How It Works</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Get started quickly with our streamlined Stripe Connect integration</li>
                        <li>Complete a simple onboarding process to verify your identity</li>
                        <li>Once approved, start accepting payments immediately</li>
                        <li>Track all your transactions in real-time through your Stripe dashboard</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Understanding Your Fees</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>For each sale, a total fee of <span className="text-white">4.9% + 30¢</span> applies</li>
                        <li>This fee consists of:
                          <ul className="list-[circle] list-inside ml-4 mt-1 space-y-1">
                            <li><span className="text-white">2.9% + 30¢</span> standard Stripe processing fee</li>
                            <li><span className="text-white">2.0%</span> platform service fee</li>
                          </ul>
                        </li>
                        <li>All fees are automatically calculated and deducted</li>
                        <li>Your earnings are transferred directly to your bank account on a rolling basis</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 