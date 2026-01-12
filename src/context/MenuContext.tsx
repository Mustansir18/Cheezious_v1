
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { MenuData, MenuItem, MenuCategory, Addon, SubCategory } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSyncLocalStorage } from '@/hooks/use-sync-local-storage';

interface MenuContextType {
  menu: MenuData;
  isLoading: boolean;
  addCategory: (category: MenuCategory) => void;
  updateCategory: (category: MenuCategory) => void;
  deleteCategory: (id: string, name: string) => void;
  addSubCategory: (categoryId: string, subCategoryName: string) => void;
  deleteSubCategory: (categoryId: string, subCategoryId: string) => void;
  addItem: (item: MenuItem) => void;
  updateItem: (item: MenuItem) => void;
  deleteItem: (id: string, name: string) => void;
  addAddon: (addon: Addon) => void;
  updateAddon: (addon: Addon) => void;
  deleteAddon: (id: string, name: string) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

const MENU_STORAGE_KEY = 'cheeziousMenuV3';

const initialData: MenuData = {
    items: [],
    categories: [],
    addons: [],
};

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const [menu, setMenu, isLoading] = useSyncLocalStorage<MenuData>(MENU_STORAGE_KEY, initialData, '/api/menu');
  const { logActivity } = useActivityLog();
  const { user } = useAuth();
  const { toast } = useToast();

  const postMenu = useCallback((newMenu: MenuData) => {
    setMenu(newMenu);
  }, [setMenu]);
  

  const addCategory = (newCategory: MenuCategory) => {
    if (!newCategory.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Category Code is required.' });
      return;
    }
    // In a real app, this would be a POST request to /api/menu
    postMenu({ ...menu, categories: [...menu.categories, newCategory] });
    logActivity(`Added menu category: '${newCategory.name}'.`, user?.username || 'System', 'Menu');
  };

  const updateCategory = (category: MenuCategory) => {
    // In a real app, this would be a PUT request to /api/menu
    postMenu({ ...menu, categories: menu.categories.map(c => c.id === category.id ? category : c) });
    logActivity(`Updated menu category: '${category.name}'.`, user?.username || 'System', 'Menu');
  };

  const deleteCategory = (id: string, name: string) => {
    // In a real app, this would be a DELETE request to /api/menu
    const newItems = menu.items.filter(i => i.categoryId !== id);
    const newCategories = menu.categories.filter(c => c.id !== id);
    postMenu({ ...menu, items: newItems, categories: newCategories });
    logActivity(`Deleted menu category: '${name}' and its items.`, user?.username || 'System', 'Menu');
  };
  
  const addSubCategory = (categoryId: string, subCategoryName: string) => {
    const newSubCategory: SubCategory = {
      id: `SC-${crypto.randomUUID().slice(0, 5)}`,
      name: subCategoryName,
    };
    const newCategories = menu.categories.map(c => {
        if (c.id === categoryId) {
          const updatedSubCategories = [...(c.subCategories || []), newSubCategory];
          return { ...c, subCategories: updatedSubCategories };
        }
        return c;
      });
    postMenu({...menu, categories: newCategories });
    const categoryName = menu.categories.find(c => c.id === categoryId)?.name;
    logActivity(`Added sub-category '${subCategoryName}' to '${categoryName}'.`, user?.username || 'System', 'Menu');
  };

  const deleteSubCategory = (categoryId: string, subCategoryId: string) => {
    const newCategories = menu.categories.map(c => {
        if (c.id === categoryId) {
          const updatedSubCategories = c.subCategories?.filter(sc => sc.id !== subCategoryId);
          return { ...c, subCategories: updatedSubCategories };
        }
        return c;
      });
    const newItems = menu.items.map(i => i.subCategoryId === subCategoryId ? { ...i, subCategoryId: undefined } : i);
    postMenu({ ...menu, categories: newCategories, items: newItems });
    const subCategoryName = menu.categories.find(c => c.id === categoryId)?.subCategories?.find(sc => sc.id === subCategoryId)?.name;
    logActivity(`Deleted sub-category '${subCategoryName}'.`, user?.username || 'System', 'Menu');
  };


  const addItem = (newItem: MenuItem) => {
     if (!newItem.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Item Code is required.' });
      return;
    }
    postMenu({ ...menu, items: [...menu.items, newItem] });
    const logMessage = newItem.categoryId === 'C-00001' ? `Added new deal: '${newItem.name}'.` : `Added menu item: '${newItem.name}'.`;
    logActivity(logMessage, user?.username || 'System', 'Menu');
  };

  const updateItem = (item: MenuItem) => {
    postMenu({ ...menu, items: menu.items.map(i => i.id === item.id ? item : i) });
     const logMessage = item.categoryId === 'C-00001' ? `Updated deal: '${item.name}'.` : `Updated menu item: '${item.name}'.`;
    logActivity(logMessage, user?.username || 'System', 'Menu');
  };

  const deleteItem = (id: string, name: string) => {
    const item = menu.items.find(i => i.id === id);
    postMenu({ ...menu, items: menu.items.filter(i => i.id !== id) });
    const logMessage = item?.categoryId === 'C-00001' ? `Deleted deal: '${name}'.` : `Deleted menu item: '${name}'.`;
    logActivity(logMessage, user?.username || 'System', 'Menu');
  };

  const addAddon = (newAddon: Addon) => {
    if (!newAddon.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Add-on Code is required.' });
      return;
    }
    postMenu({ ...menu, addons: [...menu.addons, newAddon] });
    logActivity(`Added add-on: '${newAddon.name}'.`, user?.username || 'System', 'Menu');
  };
  
  const updateAddon = (addon: Addon) => {
    postMenu({ ...menu, addons: menu.addons.map(a => a.id === addon.id ? addon : a) });
    logActivity(`Updated add-on: '${addon.name}'.`, user?.username || 'System', 'Menu');
  };

  const deleteAddon = (id: string, name: string) => {
    const newItems = menu.items.map(item => ({
        ...item,
        availableAddonIds: item.availableAddonIds?.filter(addonId => addonId !== id)
    }));
    const newAddons = menu.addons.filter(a => a.id !== id);
    postMenu({ ...menu, addons: newAddons, items: newItems });
    logActivity(`Deleted add-on: '${name}'.`, user?.username || 'System', 'Menu');
  };

  return (
    <MenuContext.Provider
      value={{
        menu,
        isLoading,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubCategory,
        deleteSubCategory,
        addItem,
        updateItem,
        deleteItem,
        addAddon,
        updateAddon,
        deleteAddon,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};
