
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { CashierLogEntry } from '@/lib/types';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CashierLogContextType {
  logs: CashierLogEntry[];
  isLoading: boolean;
  logTransaction: (details: Omit<CashierLogEntry, 'id' | 'timestamp' | 'adminId' | 'adminName'>) => void;
  clearLogs: () => void;
}

const CashierLogContext = createContext<CashierLogContextType | undefined>(undefined);

export const CashierLogProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<CashierLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, updateUserBalance } = useAuth(); // We'll now rely on the API to update the balance
  const { toast } = useToast();

  useEffect(() => {
    async function loadLogs() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/cashier-log');
        if (!response.ok) throw new Error('Failed to fetch cashier logs');
        const data = await response.json();
        setLogs(data.logs || []);
      } catch (error) {
        console.error("Could not load cashier logs from API", error);
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, []);


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
            const savedLog = await response.json();
            setLogs(prevLogs => [savedLog, ...prevLogs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            
            // Trigger a balance update in the AuthContext to reflect the change in the UI
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

  }, [user, updateUserBalance, toast]);

  const clearLogs = useCallback(async () => {
    // In a real app, this would be a DELETE request.
    setLogs([]);
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
