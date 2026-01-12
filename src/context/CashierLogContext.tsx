
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { CashierLogEntry } from '@/lib/types';
import { useAuth } from './AuthContext';

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
  const { user, updateUserBalance } = useAuth();

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
    
    // In a real app, this POST request would add the log to the DB and return the new entry.
    const tempId = crypto.randomUUID();
    const tempLogEntry = {
        id: tempId,
        timestamp: new Date().toISOString(),
        ...newLogData
    }
    setLogs(prevLogs => [tempLogEntry, ...prevLogs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    const operation = details.type === 'deposit' ? 'add' : 'subtract';
    updateUserBalance(details.cashierId, details.amount, operation);

  }, [user, updateUserBalance]);

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
