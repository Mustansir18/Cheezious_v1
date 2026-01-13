
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import type { MenuData, MenuItem, MenuCategory, Addon, SubCategory } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDataFetcher } from '@/hooks/use-data-fetcher';

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

const postMenuData = async (type: string, data: any) => {
  const response = await fetch('/api/menu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Failed to create menu ${type}`);
  }
  return response.json();
};

export const MenuProvider = ({ children }: { children: ReactNode }) => {
  const { data: menu, isLoading, mutate } = useDataFetcher<MenuData>('/api/menu', { items: [], categories: [], addons: [] });
  const { logActivity } = useActivityLog();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleMutation = async (action: Promise<any>, logMessage: string, logCategory: 'Menu' | 'Deal' = 'Menu') => {
    try {
      await action;
      mutate(); // Re-fetch the entire menu state from the server
      logActivity(logMessage, user?.username || 'System', logCategory);
      toast({ title: 'Success', description: 'Menu has been updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Menu Update Failed', description: error.message });
    }
  };

  const addCategory = (newCategory: MenuCategory) => handleMutation(postMenuData('category', newCategory), `Added menu category: '${newCategory.name}'.`);
  const updateCategory = (category: MenuCategory) => handleMutation(postMenuData('categoryUpdate', category), `Updated menu category: '${category.name}'.`);
  const deleteCategory = (id: string, name: string) => handleMutation(postMenuData('categoryDelete', { id }), `Deleted menu category: '${name}'.`);
  
  const addSubCategory = (categoryId: string, subCategoryName: string) => {
    const newSubCategory = { categoryId, name: subCategoryName };
    const categoryName = menu.categories.find(c => c.id === categoryId)?.name;
    handleMutation(postMenuData('subCategory', newSubCategory), `Added sub-category '${subCategoryName}' to '${categoryName}'.`);
  };

  const deleteSubCategory = (categoryId: string, subCategoryId: string) => {
    const subCategoryName = menu.categories.find(c => c.id === categoryId)?.subCategories?.find(sc => sc.id === subCategoryId)?.name;
    handleMutation(postMenuData('subCategoryDelete', { subCategoryId }), `Deleted sub-category '${subCategoryName}'.`);
  };

  const addItem = (newItem: MenuItem) => {
    const isDeal = newItem.categoryId === 'C-00001';
    handleMutation(postMenuData('item', newItem), `Added ${isDeal ? 'deal' : 'item'}: '${newItem.name}'.`, isDeal ? 'Deal' : 'Menu');
  };

  const updateItem = (item: MenuItem) => {
    const isDeal = item.categoryId === 'C-00001';
    handleMutation(postMenuData('itemUpdate', item), `Updated ${isDeal ? 'deal' : 'item'}: '${item.name}'.`, isDeal ? 'Deal' : 'Menu');
  };

  const deleteItem = (id: string, name: string) => {
    const item = menu.items.find(i => i.id === id);
    const isDeal = item?.categoryId === 'C-00001';
    handleMutation(postMenuData('itemDelete', { id }), `Deleted ${isDeal ? 'deal' : 'item'}: '${name}'.`, isDeal ? 'Deal' : 'Menu');
  };

  const addAddon = (newAddon: Addon) => handleMutation(postMenuData('addon', newAddon), `Added add-on: '${newAddon.name}'.`);
  const updateAddon = (addon: Addon) => handleMutation(postMenuData('addonUpdate', addon), `Updated add-on: '${addon.name}'.`);
  const deleteAddon = (id: string, name: string) => handleMutation(postMenuData('addonDelete', { id }), `Deleted add-on: '${name}'.`);

  return (
    <MenuContext.Provider value={{ menu, isLoading, addCategory, updateCategory, deleteCategory, addSubCategory, deleteSubCategory, addItem, updateItem, deleteItem, addAddon, updateAddon, deleteAddon }}>
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
