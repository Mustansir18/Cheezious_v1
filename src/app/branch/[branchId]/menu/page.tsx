
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
    if (categories.length > 0 && !activeCategory) {
      const defaultCategory = categories[0];
      setActiveCategory(defaultCategory);
      if (defaultCategory.subCategories.length > 0) {
        setActiveSubCategory(defaultCategory.subCategories[0].id);
      }
    }
  }, [categories, activeCategory]);

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
        <TabsList className="main-tabs-list">
            {categories.map((category) => (
            <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="main-tabs-trigger"
            >
                {category.name}
            </TabsTrigger>
            ))}
        </TabsList>
        
        {activeCategory.subCategories.length > 0 && (
          <div className="sub-menu-bar">
              <Tabs value={activeSubCategory || ""} onValueChange={setActiveSubCategory} className="w-full">
                  <TabsList className="flex justify-center h-auto p-0 bg-transparent">
                      {activeCategory.subCategories.map(sub => (
                          <TabsTrigger 
                              key={sub.id} 
                              value={sub.id}
                              className="sub-menu-trigger"
                          >
                              {sub.name}
                          </TabsTrigger>
                      ))}
                  </TabsList>
              </Tabs>
          </div>
        )}

        <div className="mt-6">
            {categories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="mt-0">
                    {category.subCategories.map(sub => (
                      <div key={sub.id} style={{ display: activeSubCategory === sub.id ? 'block' : 'none' }}>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
                            {menuItems
                                .filter(item => item.categoryId === category.id && item.subCategoryId === sub.id)
                                .map((item) => <MenuItemCard key={item.id} item={item} />)
                            }
                        </div>
                      </div>
                    ))}
                    {/* Render items without subcategory if no subcategory is selected */}
                    {category.subCategories.length > 0 && !activeSubCategory &&
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
                          {menuItems
                              .filter(item => item.categoryId === category.id && !item.subCategoryId)
                              .map((item) => <MenuItemCard key={item.id} item={item} />)
                          }
                      </div>
                    }
                    {/* Render all items if there are no subcategories */}
                     {category.subCategories.length === 0 && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
                            {menuItems
                                .filter(item => item.categoryId === category.id)
                                .map((item) => <MenuItemCard key={item.id} item={item} />)
                            }
                        </div>
                     )}
                </TabsContent>
            ))}
        </div>
      </Tabs>
    </div>
  );
}
