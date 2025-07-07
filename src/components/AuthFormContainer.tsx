import type React from 'react';
import Logo from '@/components/Logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface AuthFormContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const AuthFormContainer: React.FC<AuthFormContainerProps> = ({ title, description, children, footer }) => {
  return (
    <div className="flex flex-1 items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/20">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Logo size="text-3xl" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl">{title}</CardTitle>
          {description && <CardDescription className="text-base">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {children}
          {footer && <div className="mt-6">{footer}</div>}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthFormContainer;
