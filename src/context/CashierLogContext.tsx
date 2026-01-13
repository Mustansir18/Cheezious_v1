
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import type { CashierLogEntry } from '@/lib/types';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDataFetcher } from '@/hooks/use-data-fetcher';

interface CashierLogContextType {
  logs: CashierLogEntry[];
  isLoading: boolean;
  logTransaction: (details: Omit<CashierLogEntry, 'id' | 'timestamp' | 'adminId' | 'adminName'>) => void;
  clearLogs: () => void;
}

const CashierLogContext = createContext<CashierLogContextType | undefined>(undefined);

export const CashierLogProvider = ({ children }: { children: ReactNode }) => {
  const { data: logs, isLoading, mutate } = useDataFetcher<CashierLogEntry[]>('/api/cashier-log', []);
  const { user, updateUserBalance } = useAuth();
  const { toast } = useToast();

  const logTransaction = useCallback(async (details: Omit<CashierLogEntry, 'id' | 'timestamp' | 'adminId' | 'adminName'>) => {
    if (!user) return;

    const newLogData = {
      adminId: user.id,
      adminName: user.username,
      ...details,
    };
    
    try {
        const response = await fetch('/api/cashier-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newLogData),
        });

        if (response.ok) {
            mutate(); // Re-fetch logs from the server
            const operation = details.type === 'deposit' ? 'add' : 'subtract';
            updateUserBalance(details.cashierId, details.amount, operation);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to log transaction.');
        }
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'Transaction Failed',
            description: error.message
        });
        console.error("Failed to log transaction to API:", error);
    }
  }, [user, updateUserBalance, toast, mutate]);

  const clearLogs = useCallback(async () => {
    // This functionality would require a DELETE endpoint.
    // For now, it does nothing as clearing logs is a destructive action.
    console.warn("Clearing all cashier logs is not implemented.");
  }, []);

  return (
    <CashierLogContext.Provider value={{ logs, isLoading, logTransaction, clearLogs }}>
      {children}
    </CashierLogContext.Provider>
  );
};

export const useCashierLog = () => {
  const context = useContext(CashierLogContext);
  if (context === undefined) {
    throw new Error('useCashierLog must be used within a CashierLogProvider');
  }
  return context;
};
