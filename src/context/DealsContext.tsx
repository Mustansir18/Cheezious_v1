
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import type { MenuItem } from '@/lib/types';
import { useMenu } from './MenuContext';

interface DealsContextType {
  deals: MenuItem[];
  isLoading: boolean;
}

const DealsContext = createContext<DealsContextType | undefined>(undefined);

export const DealsProvider = ({ children }: { children: ReactNode }) => {
  const { menu, isLoading: isMenuLoading } = useMenu();
  
  const deals = useMemo(() => {
    return menu.items.filter(item => item.categoryId === 'C-00001');
  }, [menu.items]);
  
  return (
    <DealsContext.Provider
      value={{
        deals,
        isLoading: isMenuLoading,
      }}
    >
      {children}
    </DealsContext.Provider>
  );
};

export const useDeals = () => {
  const context = useContext(DealsContext);
  if (context === undefined) {
    throw new Error('useDeals must be used within a DealsProvider');
  }
  return context;
};
