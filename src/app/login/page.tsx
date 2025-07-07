'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import AuthFormContainer from '@/components/AuthFormContainer';
import { LoginSchema, type LoginFormData } from '@/lib/auth-schemas';
import { Eye, EyeOff, Lock, Mail, Loader2, Video } from 'lucide-react';

export default function LoginPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      // Basic security: check the origin if possible
      // if (event.origin !== "http://your-allowed-origin.com") return;
      
      if (event.data && event.data.type === 'DEAF_AUTH_SUCCESS') {
        console.log('User authenticated via popup:', event.data.user);
        toast({
          title: 'ASL Verification Successful!',
          description: 'You have been authenticated.',
          variant: 'default',
        });
        // Here you would typically set user state, redirect, etc.
      }
    };

    window.addEventListener('message', handleAuthMessage);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('message', handleAuthMessage);
    };
  }, [toast]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/deafauth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Use message from API response if available
        throw new Error(result.message || 'An unknown error occurred.');
      }

      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
        variant: 'default',
      });
      // In a real app, you would handle redirection or state update here
      // e.g. router.push('/dashboard')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      // Display error on the form
      form.setError("password", { type: "manual", message: "Invalid email or password." });
    } finally {
      setIsLoading(false);
    }
  }
  
  const openAuthPopup = () => {
      const width = 600;
      const height = 800;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      window.open(
          '/asl-verification',
          'DeafAuth',
          `width=${width},height=${height},left=${left},top=${top}`
      );
  }

  return (
    <AuthFormContainer
      title="Welcome Back!"
      description="Log in to access your deafAuth account."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} className="pl-10" type="email" aria-describedby="email-error" />
                  </FormControl>
                </div>
                <FormMessage id="email-error" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...field}
                      className="pl-10 pr-10"
                      aria-describedby="password-error"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
                <FormMessage id="password-error" />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading} aria-live="polite">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Form>

       <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
      </div>

      <Button variant="outline" className="w-full" onClick={openAuthPopup}>
        <Video className="mr-2 h-5 w-5"/>
        ASL Video Verification
      </Button>

      <div className="mt-6 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </AuthFormContainer>
  );
}
