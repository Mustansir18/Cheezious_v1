

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, Eye, EyeOff, Home } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(username, password);
      if (user) {
        toast({ title: 'Login Successful', description: `Welcome back, ${user.username}!` });
        
        // This is now the single source of truth for post-login redirection.
        switch (user.role) {
            case 'root':
                router.push('/admin');
                break;
            case 'admin':
                router.push('/admin/orders');
                break;
            case 'cashier':
                router.push('/cashier');
                break;
            case 'marketing':
                router.push('/marketing/reporting');
                break;
            case 'kds':
                router.push('/admin/kds');
                break;
            case 'make-station':
                router.push('/admin/kds/pizza');
                break;
            case 'pasta-station':
                router.push('/admin/kds/pasta');
                break;
            case 'fried-station':
                router.push('/admin/kds/fried');
                break;
            case 'bar-station':
                router.push('/admin/kds/bar');
                break;
            case 'cutt-station':
                router.push('/admin/kds/master');
                break;
            default:
                router.push('/'); // Fallback to home
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
             {isMounted && settings.companyLogo ? (
                <Image src={settings.companyLogo} alt={settings.companyName} width={96} height={96} className="mx-auto object-contain" />
             ) : (
                <div style={{ width: 96, height: 96 }} className="mx-auto" />
             )}
            <CardTitle className="font-headline text-2xl">Welcome to {settings.companyName}</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            <Button variant="outline" className="w-full" asChild>
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Go to Homepage
                </Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
