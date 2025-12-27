
"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import type { OrderType } from "@/lib/types";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as LucideIcons from 'lucide-react';
import { useMenu } from "@/context/MenuContext";
import { useDeals } from "@/context/DealsContext";
import { Loader } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";


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
  const { setOrderDetails, tableId, setTable } = useCart();
  const { menu, isLoading: isMenuLoading } = useMenu();
  const { deals, isLoading: areDealsLoading } = useDeals();
  const { settings } = useSettings();

  const { items: menuItems, categories } = menu;

  const orderType = searchParams.get("mode") as OrderType | null;

  const availableTables = useMemo(() => {
    return settings.tables.filter(t => !settings.occupiedTableIds.includes(t.id));
  }, [settings.tables, settings.occupiedTableIds]);

  const selectedTable = useMemo(() => {
    return settings.tables.find(t => t.id === tableId);
  }, [tableId, settings.tables]);


  useEffect(() => {
    const mode = searchParams.get("mode") as OrderType;

    if (mode && branchId) {
      setOrderDetails({ branchId: branchId, orderType: mode });
    }

  }, [searchParams, branchId, setOrderDetails, deals, areDealsLoading, router]);

  const handleTableChange = (newTableId: string) => {
    const table = settings.tables.find(t => t.id === newTableId);
    if(table) {
      setTable(table.id, table.floorId);
    }
  }

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
      
      {orderType === 'Dine-In' && (
        <div className="max-w-xs mx-auto mb-8 p-4 border rounded-lg bg-muted/50">
            <Label htmlFor="table-select">Your Table</Label>
            <Select value={tableId || undefined} onValueChange={handleTableChange}>
                <SelectTrigger id="table-select">
                    <SelectValue placeholder="Select your table" />
                </SelectTrigger>
                <SelectContent>
                    {availableTables.map(table => (
                        <SelectItem key={table.id} value={table.id}>
                            {settings.floors.find(f => f.id === table.floorId)?.name} - {table.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {!tableId && <p className="text-xs text-destructive mt-1">Please select a table to place an order.</p>}
        </div>
      )}


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
