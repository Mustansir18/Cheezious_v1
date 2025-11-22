
"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import type { OrderType } from "@/lib/types";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as LucideIcons from 'lucide-react';
import { useMenu } from "@/context/MenuContext";
import { Loader } from "lucide-react";


const Icon = ({ name, className }: { name: string, className: string }) => {
    const LucideIcon = (LucideIcons as any)[name];
    if (!LucideIcon) {
      // Fallback icon
      return <LucideIcons.Package className={className} />;
    }
    return <LucideIcon className={className} />;
};


export default function MenuPage({ params: { branchId } }: { params: { branchId: string } }) {
  const searchParams = useSearchParams();
  const { setOrderDetails } = useCart();
  const { menu, isLoading } = useMenu();

  const { items: menuItems, categories } = menu;

  useEffect(() => {
    const mode = searchParams.get("mode") as OrderType;
    if (mode && branchId) {
      setOrderDetails({ branchId: branchId, orderType: mode });
    }
  }, [searchParams, branchId, setOrderDetails]);

  if (isLoading) {
    return (
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
            <Loader className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading Menu...</p>
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl font-bold tracking-tight">Our Menu</h1>
        <p className="mt-2 text-lg text-muted-foreground">Explore our delicious offerings</p>
      </div>

      <Tabs defaultValue={categories[0]?.id} className="w-full">
        <TabsList className="grid w-full h-auto grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="py-2 text-base flex-wrap">
               <Icon name={category.icon} className="mr-2 h-5 w-5" /> {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
              {menuItems
                .filter((item) => item.categoryId === category.id)
                .map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
