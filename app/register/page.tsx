"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Mail, Lock, User } from 'lucide-react';
import { PasswordInput } from "@/components/ui/password-input";

// Create a client component that uses useSearchParams
function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const isClaiming = searchParams.get('action') === 'claim';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          name, 
          phone: '', // Include empty phone if your schema requires it
          isClaiming: isClaiming // Pass the claiming status to the API
        }),
      });

      if (response.ok) {
        router.push(isClaiming ? '/login?action=claim' : '/login');
      } else {
        const data = await response.json();
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md mt-[-150px] bg-black rounded-[20px] shadow-lg">
        <CardContent className="pt-8 px-8">
          {/* Heading */}
          <div className="flex justify-center w-full mb-6">
            <h1 
              className="text-4xl sm:text-5xl font-bold tracking-tight text-white"
              style={{ fontFamily: 'Chalkduster, fantasy' }}
            >
              FAMOUSINCE.COM
            </h1>
          </div>

          <div className="text-center mb-8">
            <h2 
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: 'Chalkduster, fantasy' }}
            >
              {isClaiming ? 'Create Your Account' : 'Join the Famous'}
            </h2>
            <p className="font-['Raleway',Helvetica] font-normal text-white/60 text-base">
              {isClaiming ? 'Set up your profile to claim your cards' : 'Create your account'}
            </p>
          </div>
          
          {isClaiming && (
            <div className="mb-6 p-4 bg-white/10 rounded-[10px] border border-white/20">
              <p className="font-['Raleway',Helvetica] font-normal text-white/80 text-sm text-center">
                You're just moments away from claiming your cards! 
                Create your account to get started.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-['Raleway',Helvetica] font-medium text-white text-sm">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-12 h-12 font-['Raleway',Helvetica] bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-[10px] focus:bg-white/20 focus:border-white/40 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-['Raleway',Helvetica] font-medium text-white text-sm">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 font-['Raleway',Helvetica] bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-[10px] focus:bg-white/20 focus:border-white/40 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-['Raleway',Helvetica] font-medium text-white text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white z-20" />
                  <PasswordInput
                    id="password"
                    placeholder="Create a password"
                    required
                    value={password}
                    onChange={(value) => setPassword(value)}
                    className="pl-12 h-12 font-['Raleway',Helvetica] bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-[10px] focus:bg-white/20 focus:border-white/40 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-[15px] font-normal text-base transition-all duration-200"
              style={{ fontFamily: 'Chalkduster, fantasy' }}
            >
              {isClaiming ? 'Create Account & Continue' : 'Create Account'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center items-center pb-8 px-8">
          <div className="font-['Raleway',Helvetica] text-sm text-white/60 flex items-center gap-1">
            Already have an account?
            <Link 
              href={isClaiming ? '/login?action=claim' : '/login'}
              className="font-['Raleway',Helvetica] font-medium text-white hover:text-white/80 transition-colors ml-1"
              prefetch={false}
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Main page component with Suspense boundary
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md mt-[-150px] bg-black rounded-[20px] shadow-lg">
          <CardContent className="pt-8 px-8 flex flex-col justify-center items-center py-16">
            <div className="flex justify-center w-full mb-6">
              <h1 
                className="text-4xl sm:text-5xl font-bold tracking-tight text-white"
                style={{ fontFamily: 'Chalkduster, fantasy' }}
              >
                FAMOUSINCE.COM
              </h1>
            </div>
            <div className="text-center">
              <h2 
                className="font-medium text-xl text-white mb-2"
                style={{ fontFamily: 'Chalkduster, fantasy' }}
              >
                Loading...
              </h2>
              <p className="font-['Raleway',Helvetica] font-normal text-white/60 text-sm">
                Please wait while we prepare your registration page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
