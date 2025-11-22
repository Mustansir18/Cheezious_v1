
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { menuItems } from "@/lib/data";
import type { OrderType } from "@/lib/types";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pizza, Beef, Drumstick, GlassWater } from 'lucide-react';

const categoryIcons: { [key: string]: React.ReactNode } = {
  Pizzas: <Pizza className="mr-2 h-5 w-5" />,
  Burgers: <Beef className="mr-2 h-5 w-5" />,
  Sides: <Drumstick className="mr-2 h-5 w-5" />,
  Drinks: <GlassWater className="mr-2 h-5 w-5" />,
};

export default function MenuPage({ params: { branchId } }: { params: { branchId: string } }) {
  const searchParams = useSearchParams();
  const { setOrderDetails } = useCart();

  useEffect(() => {
    const mode = searchParams.get("mode") as OrderType;
    if (mode && branchId) {
      setOrderDetails({ branchId: branchId, orderType: mode });
    }
  }, [searchParams, branchId, setOrderDetails]);

  const categories = [...new Set(menuItems.map((item) => item.category))];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl font-bold tracking-tight">Our Menu</h1>
        <p className="mt-2 text-lg text-muted-foreground">Explore our delicious offerings</p>
      </div>

      <Tabs defaultValue={categories[0]} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="py-2 text-base">
               {categoryIcons[category]} {category}
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map((category) => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
              {menuItems
                .filter((item) => item.category === category)
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
