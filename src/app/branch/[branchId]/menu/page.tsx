
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import type { OrderType, MenuCategory } from "@/lib/types";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
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

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string | null>(null);
  
  const activeCategory = useMemo(() => categories.find(c => c.id === activeCategoryId), [categories, activeCategoryId]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
      const defaultCategory = categories[0];
      setActiveCategoryId(defaultCategory.id);
      if (defaultCategory.subCategories && defaultCategory.subCategories.length > 0) {
        setActiveSubCategoryId(defaultCategory.subCategories[0].id);
      } else {
        setActiveSubCategoryId(null);
      }
    }
  }, [categories, activeCategoryId]);

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
        setActiveCategoryId(newCategory.id);
        setActiveSubCategoryId(newCategory.subCategories?.[0]?.id || null);
    }
  };

  const handleSubCategoryChange = (subId: string) => {
    setActiveSubCategoryId(subId);
  }

  if (isMenuLoading || areDealsLoading || !activeCategory) {
    return (
        <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
            <Loader className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading Menu...</p>
        </div>
    )
  }
  
  const currentMenuItems = menuItems.filter(item => 
      item.categoryId === activeCategory.id &&
      (!activeCategory.subCategories || activeCategory.subCategories.length === 0 || item.subCategoryId === activeSubCategoryId)
  );

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

      <div className="main-menu-container">
        {/* CATEGORY TABS */}
        <div className="main-menu-tabs">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={cn(
                "main-menu-tab",
                activeCategory.id === category.id && "main-menu-tab-active"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* SUB CATEGORY BAR */}
        <div className="sub-menu-bar">
          {activeCategory.subCategories?.length > 0 && (
            <div className="sub-menu-items">
              {activeCategory.subCategories.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => handleSubCategoryChange(sub.id)}
                  className={cn(
                    "sub-menu-trigger",
                    activeSubCategoryId === sub.id && "sub-menu-trigger-active"
                  )}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {currentMenuItems.map((item) => <MenuItemCard key={item.id} item={item} />)}
        </div>
        {currentMenuItems.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No items in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
