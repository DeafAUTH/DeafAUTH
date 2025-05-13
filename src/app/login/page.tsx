'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import React from 'react';
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
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);

    if (data.email === 'test@example.com' && data.password === 'password123') {
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
        variant: 'default',
      });
      // In a real app, redirect or update auth state here
      // form.reset();
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
      form.setError("email", { type: "manual", message: " "}); // Clear previous errors if any better way
      form.setError("password", { type: "manual", message: "Invalid credentials"});
    }
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
      <div className="mt-6 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </div>
      <div className="mt-2 text-center text-sm">
        Or try{' '}
        <Link href="/asl-verification" className="font-medium text-primary hover:underline">
          ASL Video Verification
        </Link>
      </div>
    </AuthFormContainer>
  );
}
