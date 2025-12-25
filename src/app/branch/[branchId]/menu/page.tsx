
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import type { OrderType, MenuItem } from "@/lib/types";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as LucideIcons from 'lucide-react';
import { useMenu } from "@/context/MenuContext";
import { useDeals } from "@/context/DealsContext";
import { Loader } from "lucide-react";


const Icon = ({ name, className }: { name: string, className: string }) => {
    const LucideIcon = (LucideIcons as any)[name];
    if (!LucideIcon) {
      // Fallback icon
      return <LucideIcons.Package className={className} />;
    }
    return <LucideIcon className={className} />;
};


export default function MenuPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params.branchId as string;
  const searchParams = useSearchParams();
  const { setOrderDetails, addItem } = useCart();
  const { menu, isLoading: isMenuLoading } = useMenu();
  const { deals, isLoading: areDealsLoading } = useDeals();
  const processedDeal = useRef(false);

  const { items: menuItems, categories } = menu;

  useEffect(() => {
    const mode = searchParams.get("mode") as OrderType;
    const floorId = searchParams.get("floorId") || undefined;
    const tableId = searchParams.get("tableId") || undefined;
    const dealId = searchParams.get("dealId");

    if (mode && branchId) {
      setOrderDetails({ branchId: branchId, orderType: mode, floorId, tableId });
    }

    // Auto-add deal to cart if dealId is present and not yet processed
    if (dealId && !areDealsLoading && !processedDeal.current) {
        const dealToAdd = deals.find(d => d.id === dealId);
        if (dealToAdd) {
            // Convert Deal to a MenuItem-like structure for the cart
            const dealAsMenuItem: MenuItem = {
                id: dealToAdd.id,
                name: dealToAdd.name,
                description: dealToAdd.description,
                price: dealToAdd.price,
                imageUrl: dealToAdd.imageUrl,
                categoryId: 'deals', // Assign to a conceptual 'deals' category
            };
            addItem({ item: dealAsMenuItem });
            processedDeal.current = true; // Mark as processed
            
            // Remove dealId from URL to prevent re-adding on refresh
            const current = new URL(window.location.toString());
            current.searchParams.delete('dealId');
            router.replace(current.pathname + current.search);
        }
    }

  }, [searchParams, branchId, setOrderDetails, deals, areDealsLoading, addItem, router]);

  if (isMenuLoading || areDealsLoading) {
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
