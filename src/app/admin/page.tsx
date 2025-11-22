"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart4, Package, Settings, ClipboardList, CookingPot } from 'lucide-react';
import { useRouter } from 'next/navigation';

const adminSections = [
  {
    title: 'Reporting',
    description: 'View sales analytics and trends.',
    href: '/admin/reporting',
    icon: BarChart4,
  },
  {
    title: 'Menu Management',
    description: 'Add, edit, or remove menu items.',
    href: '/admin/menu',
    icon: Package,
  },
  {
    title: 'Restaurant Settings',
    description: 'Manage floors, tables, and payments.',
    href: '/admin/settings',
    icon: Settings,
  },
  {
    title: 'Cashier View',
    description: 'Manage ready and completed orders.',
    href: '/cashier',
    icon: ClipboardList,
  },
    {
    title: 'Kitchen Display',
    description: 'Live order display for the kitchen.',
    href: '/kds',
    icon: CookingPot,
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Select a section to manage your restaurant.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => (
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
