"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ComingSoon() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  useEffect(() => {
    // Fetch waitlist count when component mounts
    fetchWaitlistCount();
  }, []);

  const fetchWaitlistCount = async () => {
    try {
      const response = await fetch('/api/waitlist');
      if (response.ok) {
        const result = await response.json();
        setWaitlistCount(result.totalSubscribers);
      }
    } catch (error) {
      console.error('Failed to fetch waitlist count:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Send data to the waitlist API
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to join waitlist');
      }
      
      setIsSubmitted(true);
      setFormData({ firstName: '', lastName: '', email: '' });
      
      // Refresh the waitlist count after successful submission
      fetchWaitlistCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Famous Since Text */}
        <h2 
          className="text-4xl md:text-6xl font-bold mb-2"
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          Famous Since
        </h2>

        {/* Coming Soon Text */}
        <h1 
          className="text-3xl md:text-5xl font-bold mb-4"
          style={{ fontFamily: 'Chalkduster, fantasy' }}
        >
          Coming Soon
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl text-white/80 mb-8 font-main">
          We're crafting something extraordinary. Get ready to be amazed!
        </p>

        {/* Waitlist Count */}
        {waitlistCount !== null && waitlistCount > 1 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/20 px-6 py-3">
            <p className="text-white/70 text-sm">
              <span className="font-semibold text-white">{waitlistCount}</span> people have already joined the waitlist
            </p>
          </div>
        )}

        {/* Information Collection Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/20 p-6 md:p-8">
          <div className="space-y-6">
            {/* Form Header */}
            <div className="text-center space-y-2">
              <h2 
                className="text-2xl md:text-3xl font-bold"
                style={{ fontFamily: 'Chalkduster, fantasy' }}
              >
                Stay in the Loop
              </h2>
              <p className="text-white/70 text-sm md:text-base">
                Be the first to know when we launch and get exclusive early access
              </p>
            </div>

            {/* Success Message */}
            {isSubmitted && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-green-400 font-medium">
                  🎉 Thanks for joining! We'll keep you updated on our progress.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 font-medium">{error}</p>
              </div>
            )}

            {/* Form */}
            {!isSubmitted && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-medium text-white/80 text-left">
                      First Name *
                    </label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-medium text-white/80 text-left">
                      Last Name *
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-white/80 text-left">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-white text-black hover:bg-white/90 font-medium py-3 text-base transition-all duration-200 shadow-lg hover:shadow-xl"
                    style={{ fontFamily: 'Chalkduster, fantasy' }}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        <span>Joining...</span>
                      </div>
                    ) : (
                      'Join the Waitlist'
                    )}
                  </Button>
                </div>

                {/* Privacy Note */}
                <p className="text-xs text-white/50 text-center">
                  We respect your privacy. No spam, just updates on our launch.
                </p>
              </form>
            )}

            {/* Reset Button for Submitted State */}
            {isSubmitted && (
              <div className="pt-4">
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 font-medium py-3 text-base transition-all duration-200"
                >
                  Add Another Email
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 text-white/60 font-main">
          © {new Date().getFullYear()} Famous Since. All rights reserved.
        </div>
      </div>
    </div>
  );
} 