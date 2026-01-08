
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import type { OrderType, MenuCategory } from "@/lib/types";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";

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

  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);

  useEffect(() => {
    if (categories.length > 0) {
      const defaultCategory = categories[0];
      setActiveCategory(defaultCategory);
      if (defaultCategory.subCategories.length > 0) {
        setActiveSubCategory(defaultCategory.subCategories[0].id);
      }
    }
  }, [categories]);

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

  const handleCategoryChange = (categoryId: string) => {
    const newCategory = categories.find(c => c.id === categoryId);
    if (newCategory) {
        setActiveCategory(newCategory);
        setActiveSubCategory(newCategory.subCategories[0]?.id || null);
    }
  };

  if (isMenuLoading || areDealsLoading || !activeCategory) {
    return (
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
            <Loader className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading Menu...</p>
        </div>
    )
  }

  const displayedItems = menuItems.filter(item => {
    return item.categoryId === activeCategory.id && item.subCategoryId === activeSubCategory;
  });

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

      <Tabs value={activeCategory.id} onValueChange={handleCategoryChange} className="w-full">
        <TabsList className="flex justify-center bg-transparent p-0">
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="menu-tab-trigger"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <div className="sub-menu-bar py-2 px-4 flex justify-center">
             <Tabs value={activeSubCategory || ""} onValueChange={setActiveSubCategory}>
                <TabsList className="bg-transparent p-0 h-auto">
                    {activeCategory.subCategories.map(sub => (
                        <TabsTrigger 
                            key={sub.id} 
                            value={sub.id}
                            className="text-white data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-md px-4 py-2"
                        >
                            {sub.name}
                        </TabsTrigger>
                    ))}
                </TabsList>
             </Tabs>
        </div>

        <div className="mt-6">
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} forceMount className={cn('hidden', activeCategory.id === category.id && 'block')}>
                {category.subCategories.map(sub => (
                    <TabsContent key={sub.id} value={sub.id} forceMount className={cn('hidden', activeSubCategory === sub.id && 'block')}>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
                            {menuItems
                                .filter(item => item.categoryId === category.id && item.subCategoryId === sub.id)
                                .map((item) => <MenuItemCard key={item.id} item={item} />)
                            }
                        </div>
                    </TabsContent>
                ))}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
