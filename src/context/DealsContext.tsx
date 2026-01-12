
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { MenuItem } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSyncLocalStorage } from '@/hooks/use-sync-local-storage';

interface DealsContextType {
  deals: MenuItem[];
  isLoading: boolean;
  addDeal: (deal: MenuItem) => void;
  updateDeal: (deal: MenuItem) => void;
  deleteDeal: (id: string, name: string) => void;
}

const DealsContext = createContext<DealsContextType | undefined>(undefined);

const DEALS_STORAGE_KEY = 'cheeziousDealsV2';

export const DealsProvider = ({ children }: { children: ReactNode }) => {
  const [deals, setDeals, isLoading] = useSyncLocalStorage<MenuItem[]>(DEALS_STORAGE_KEY, [], '/api/deals');
  const { logActivity } = useActivityLog();
  const { user } = useAuth();

  const addDeal = useCallback((newDeal: MenuItem) => {
    // This will now be handled by the menu context/api as deals are just items
    logActivity(`Added new deal: '${newDeal.name}'.`, user?.username || 'System', 'Deal');
  }, [logActivity, user]);

  const updateDeal = useCallback((updatedDeal: MenuItem) => {
    // This will now be handled by the menu context/api
    logActivity(`Updated deal: '${updatedDeal.name}'.`, user?.username || 'System', 'Deal');
  }, [logActivity, user]);

  const deleteDeal = useCallback((id: string, name: string) => {
    // This will now be handled by the menu context/api
    logActivity(`Deleted deal: '${name}'.`, user?.username || 'System', 'Deal');
  }, [logActivity, user]);

  return (
    <DealsContext.Provider
      value={{
        deals,
        isLoading,
        addDeal,
        updateDeal,
        deleteDeal,
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
