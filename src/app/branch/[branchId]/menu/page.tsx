
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import type { OrderType, MenuCategory } from "@/lib/types";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { useMenu } from "@/context/MenuContext";
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
  const { setOrderDetails, tableId, setTable, addItem, items: cartItems, orderType } = useCart();
  const { menu, isLoading: isMenuLoading } = useMenu();

  const { items: menuItems, categories } = menu;

  const modeFromUrl = searchParams.get("mode") as OrderType | null;
  const tableIdFromUrl = searchParams.get("tableId");
  const floorIdFromUrl = searchParams.get("floorId");
  const dealId = searchParams.get("dealId");

  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string | null>(null);
  const dealProcessedRef = useRef(false);
  
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

    if (mode === 'Dine-In' && tableIdFromUrl && floorIdFromUrl) {
      setTable(tableIdFromUrl, floorIdFromUrl);
    }

  }, [searchParams, branchId, tableIdFromUrl, floorIdFromUrl, setOrderDetails, setTable]);
  
  // Effect to add deal to cart
  useEffect(() => {
    // Only run if a dealId exists, menu is loaded, cart context is ready, and the deal hasn't been processed yet
    if (dealId && !isMenuLoading && orderType === modeFromUrl && !dealProcessedRef.current) {
      const dealItem = menuItems.find(item => item.id === dealId);
      
      if (dealItem) {
        // Mark as processed immediately to prevent re-runs from Strict Mode
        dealProcessedRef.current = true;

        addItem({
          item: dealItem,
          itemQuantity: 1,
          selectedAddons: [],
          instructions: '',
        });

        // Clean up URL
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete('dealId');
        router.replace(`${window.location.pathname}?${newParams.toString()}`, { scroll: false });
      }
    }
  }, [dealId, isMenuLoading, menuItems, addItem, router, searchParams, orderType, modeFromUrl]);


  const handleCategoryChange = (categoryId: string) => {
    const newCategory = categories.find(c => c.id === categoryId);
    if (newCategory) {
        setActiveCategoryId(newCategory.id);
        // This is the fix: When changing main category, also set the sub-category
        setActiveSubCategoryId(newCategory.subCategories?.[0]?.id || null);
    }
  };

  const handleSubCategoryChange = (subId: string) => {
    setActiveSubCategoryId(subId);
  }

  if (isMenuLoading || !activeCategory) {
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
    <div className="w-full px-4 py-8 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl font-bold tracking-tight">Our Menu</h1>
        <p className="mt-2 text-lg text-muted-foreground">Explore our delicious offerings</p>
      </div>
      
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
