"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface FieldErrors {
  email: string;
  password: string;
}

// Create a client component that uses useSearchParams
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    email: "",
    password: "",
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const isClaiming = searchParams.get('action') === 'claim';
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session) {
      // Check user role and redirect accordingly
      if (session.user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [session, router]);

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md mt-[-100px] bg-black rounded-[20px] shadow-lg">
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
                Please wait while we prepare your login page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If already authenticated, don't show the form
  if (session) {
    return null;
  }

  const handleInputChange = (field: keyof FieldErrors, value: string) => {
    if (field === 'email') {
      setEmail(value);
    } else if (field === 'password') {
      setPassword(value);
    }
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateField = (field: keyof FieldErrors, value: string): string => {
    if (!value.trim()) {
      return "This is required";
    }

    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Please enter a valid email address.";
      }
    }

    return "";
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {
      email: validateField('email', email),
      password: validateField('password', password),
    };

    setFieldErrors(errors);

    // Return true if no errors
    return !Object.values(errors).some(error => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: '/'
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          alert("Invalid email or password. Please try again.");
        } else {
          alert("An error occurred during sign in. Please try again.");
        }
      }
    } catch (error) {
      alert("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md mt-[-100px] bg-black rounded-[20px] shadow-lg">
        <CardContent className="pt-8 px-8">
          {/* Replace Logo with Text */}
          <div className="flex justify-center w-full mb-6">
            <h1 
              className="text-4xl sm:text-5xl font-bold tracking-tight text-white"
              style={{ fontFamily: 'Chalkduster, fantasy' }}
            >
              FAMOUSINCE.COM
            </h1>
          </div>

          <div className="text-center mb-8">
            <h1 
              className="font-bold text-[32px] text-white mb-2 leading-[38px]"
              style={{ fontFamily: 'Chalkduster, fantasy' }}
            >
              {isClaiming ? 'Welcome Back' : 'Welcome'}
            </h1>
            <p className="font-['Raleway',Helvetica] font-normal text-white/60 text-base">
              {isClaiming ? 'Continue setting up your profile' : 'Sign in to your account'}
            </p>
          </div>
          
          {isClaiming && (
            <div className="mb-6 p-4 bg-white/10 rounded-[10px] border border-white/20">
              <p className="font-['Raleway',Helvetica] font-normal text-white/80 text-sm text-center">
                Sign in to continue setting up your profile and access your dashboard.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label 
                  htmlFor="email" 
                  className="font-['Raleway',Helvetica] font-medium text-white text-sm"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-12 h-12 font-['Raleway',Helvetica] bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-[10px] focus:bg-white/20 focus:border-white/40 transition-all duration-200 ${
                      fieldErrors.email ? '!border-red-500 !border-2' : ''
                    }`}
                    style={fieldErrors.email ? { 
                      borderColor: '#ef4444',
                      borderWidth: '2px'
                    } as React.CSSProperties : {}}
                  />
                </div>
                {fieldErrors.email && (
                  <span className="text-xs font-['Raleway',Helvetica] font-medium text-red-400">
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <label 
                  htmlFor="password" 
                  className="font-['Raleway',Helvetica] font-medium text-white text-sm"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-12 pr-12 h-12 font-['Raleway',Helvetica] bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-[10px] focus:bg-white/20 focus:border-white/40 transition-all duration-200 ${
                      fieldErrors.password ? '!border-red-500 !border-2' : ''
                    }`}
                    style={fieldErrors.password ? { 
                      borderColor: '#ef4444',
                      borderWidth: '2px'
                    } as React.CSSProperties : {}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-white/80 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <span className="text-xs font-['Raleway',Helvetica] font-medium text-red-400">
                    {fieldErrors.password}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Link 
                href="/forgot-password"
                className="font-['Raleway',Helvetica] font-normal text-white/60 text-sm hover:text-white transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-[15px] font-['Raleway',Helvetica] font-normal text-base transition-all duration-200"
              style={{ fontFamily: 'Chalkduster, fantasy' }}
            >
              {isClaiming ? 'Sign In & Continue Setup' : 'Sign In'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center items-center pb-8 px-8">
          <div className="font-['Raleway',Helvetica] text-sm text-white/60 flex items-center gap-1">
            Don't have an account?
            <Link 
              href={isClaiming ? '/register?action=claim' : '/register'}
              className="font-['Raleway',Helvetica] font-medium text-white hover:text-white/80 transition-colors ml-1"
              prefetch={false}
            >
              Create account
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md mt-[-100px] bg-black rounded-[20px] shadow-lg">
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
                Please wait while we prepare your login page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
} 