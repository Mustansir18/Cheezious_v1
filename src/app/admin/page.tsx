

"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, Settings, Users, Megaphone, ShoppingCart, QrCode, Monitor, Star, BarChart, ChefHat, Activity, Landmark, FileUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // This effect now ONLY handles redirecting non-root users who land here by mistake.
    // The main redirection logic is on the login page.
    if (!isLoading && user && user.role !== 'root') {
      // If a non-root user somehow lands on the main admin dashboard,
      // send them to their designated page.
      if (user.role === 'admin') router.push('/admin/orders');
      else if (user.role === 'kds') router.push('/admin/kds');
      else if (user.role === 'make-station') router.push('/admin/kds/pizza');
      else if (user.role === 'pasta-station') router.push('/admin/kds/pasta');
      else if (user.role === 'fried-station') router.push('/admin/kds/fried');
      else if (user.role === 'bar-station') router.push('/admin/kds/bar');
      else if (user.role === 'cutt-station') router.push('/admin/kds/master');
      else router.push('/login'); // Fallback if role has no specific dashboard
    }
  }, [user, isLoading, router]);


  // Show loading spinner while auth state is resolving, or if user is not root and is about to be redirected.
  if (isLoading || !user || user.role !== 'root') {
      return (
          <div className="flex h-screen items-center justify-center">
            <Loader className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading Dashboard...</p>
          </div>
      );
  }

  // This content will only be rendered for the 'root' user.
  const adminSections = [
    {
      title: 'Order Management',
      description: 'View and manage live orders.',
      href: '/admin/orders',
      icon: ShoppingCart,
      role: ['root', 'admin'],
    },
    {
      title: 'Kitchen Display System',
      description: 'Live displays for kitchen stations.',
      href: '/admin/kds',
      icon: ChefHat,
      role: ['root', 'admin'],
    },
    {
      title: 'Queue Display',
      description: 'Public-facing order status screen.',
      href: '/admin/queue',
      icon: Monitor,
      role: ['root', 'admin'],
    },
     {
      title: 'Sales Reports',
      description: 'View sales analytics and trends.',
      href: '/admin/reporting',
      icon: BarChart,
      role: ['root'],
    },
    {
      title: 'Cash Management',
      description: 'Manage cashier balances & transactions.',
      href: '/admin/cash-management',
      icon: Landmark,
      role: ['root'],
    },
    {
      title: 'Menu Management',
      description: 'Add, edit, or remove menu items.',
      href: '/admin/menu',
      icon: Package,
       role: ['root'],
    },
    {
      title: 'Deals & Discounts',
      description: 'Create and manage promotional deals.',
      href: '/admin/deals',
      icon: Megaphone,
       role: ['root'],
    },
    {
      title: 'QR Code Generation',
      description: 'Generate and print QR codes for tables.',
      href: '/admin/qr-codes',
      icon: QrCode,
      role: ['root'],
    },
    {
        title: 'Customer Feedback',
        description: 'View customer ratings and comments.',
        href: '/admin/feedback',
        icon: Star,
        role: ['root'],
    },
     {
        title: 'Activity Log',
        description: 'View a log of all system and user actions.',
        href: '/admin/activity-log',
        icon: Activity,
        role: ['root'],
    },
    {
      title: 'User Management',
      description: 'Manage admin and cashier accounts.',
      href: '/admin/users',
      icon: Users,
       role: ['root'],
    },
    {
      title: 'Restaurant Settings',
      description: 'Manage floors, tables, and payments.',
      href: '/admin/settings',
      icon: Settings,
      role: ['root'],
    },
    {
        title: 'Migrate Data',
        description: 'One-time data migration to SQL DB.',
        href: '/admin/migrate-data',
        icon: FileUp,
        role: ['root'],
    }
  ];

  const visibleSections = adminSections.filter(section => user?.role && section.role.includes(user.role));
  
  return (
    <div className="w-full">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
            Select a section to manage your restaurant.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleSections.map((section) => (
          <Card 
            key={section.href} 
            className="group transform cursor-pointer transition-transform duration-300 hover:scale-105 hover:shadow-xl"
            onClick={() => router.push(section.href)}
          >
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <section.icon className="h-10 w-10 text-primary" />
              <div>
                <CardTitle className="font-headline text-2xl">{section.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{section.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
