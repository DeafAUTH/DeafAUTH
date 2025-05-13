import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { LogIn, UserPlus, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-background to-secondary min-h-screen">
      <div className="text-center mb-12">
        <Logo size="text-5xl sm:text-6xl" />
        <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Welcome to deafAuth, providing secure and accessible authentication solutions, including innovative ASL video verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full max-w-4xl">
        <Card className="hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <LogIn className="text-primary" />
              Standard Login
            </CardTitle>
            <CardDescription>Access your account using your email and password.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" passHref>
              <Button className="w-full" aria-label="Go to Login page">
                Login
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <UserPlus className="text-primary" />
              Create Account
            </CardTitle>
            <CardDescription>Join deafAuth by creating a new account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/signup" passHref>
              <Button className="w-full" aria-label="Go to Sign Up page">
                Sign Up
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <Video className="text-primary" />
              ASL Verification
            </CardTitle>
            <CardDescription>Verify your identity using ASL video.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/asl-verification" passHref>
              <Button className="w-full" aria-label="Go to ASL Verification page">
                Verify with ASL
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
