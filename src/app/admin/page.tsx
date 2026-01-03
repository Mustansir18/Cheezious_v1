
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, Settings, Users, Megaphone, ShoppingCart, QrCode, Monitor, ClipboardList, Star, BarChart, ChefHat } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { Loader, Pizza } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // If user is a branch admin, redirect them directly to their default page
    if (!isLoading && user?.role === 'admin') {
      router.push('/admin/orders');
    }
  }, [user, isLoading, router]);


  // If the user is loading or an admin (who will be redirected),
  // we return a loading state to prevent the rest of the component from rendering
  // and causing a flash of incorrect content or a race condition with navigation.
  if (isLoading || (user && user.role === 'admin')) {
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
      title: 'Kitchen Display (KDS)',
      description: 'Live display for kitchen stations.',
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
  ];

  const visibleSections = adminSections.filter(section => user?.role && section.role.includes(user.role));
  
  return (
    <div className="container mx-auto p-4 lg:p-8">
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
