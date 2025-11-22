
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Floor, Table, PaymentMethod } from '@/lib/types';

interface Settings {
    floors: Floor[];
    tables: Table[];
    paymentMethods: PaymentMethod[];
    autoPrintReceipts: boolean;
}

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  addFloor: (name: string) => void;
  deleteFloor: (id: string) => void;
  addTable: (name: string, floorId: string) => void;
  deleteTable: (id: string) => void;
  addPaymentMethod: (name: string) => void;
  deletePaymentMethod: (id: string) => void;
  toggleAutoPrint: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'cheeziousSettings';

const initialSettings: Settings = {
    floors: [],
    tables: [],
    paymentMethods: [
        { id: 'cash', name: 'Cash' },
        { id: 'card', name: 'Credit/Debit Card' }
    ],
    autoPrintReceipts: false,
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        // Ensure all arrays exist even if they were empty in localStorage
        setSettings({
            floors: parsed.floors || [],
            tables: parsed.tables || [],
            paymentMethods: parsed.paymentMethods || initialSettings.paymentMethods,
            autoPrintReceipts: parsed.autoPrintReceipts || false,
        });
      } else {
        // If nothing is in storage, set the initial state
        setSettings(initialSettings);
      }
    } catch (error) {
      console.error("Could not load settings from local storage", error);
      setSettings(initialSettings);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
        if (!isLoading) {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        }
    } catch (error) {
      console.error("Could not save settings to local storage", error);
    }
  }, [settings, isLoading]);

  const addFloor = useCallback((name: string) => {
    const newFloor: Floor = { id: crypto.randomUUID(), name };
    setSettings(s => ({ ...s, floors: [...s.floors, newFloor] }));
  }, []);

  const deleteFloor = useCallback((id: string) => {
    setSettings(s => ({ 
        ...s, 
        floors: s.floors.filter(f => f.id !== id),
        tables: s.tables.filter(t => t.floorId !== id), // Also remove tables on that floor
    }));
  }, []);

  const addTable = useCallback((name: string, floorId: string) => {
    const newTable: Table = { id: crypto.randomUUID(), name, floorId };
    setSettings(s => ({ ...s, tables: [...s.tables, newTable] }));
  }, []);

  const deleteTable = useCallback((id: string) => {
    setSettings(s => ({ ...s, tables: s.tables.filter(t => t.id !== id) }));
  }, []);

  const addPaymentMethod = useCallback((name: string) => {
    const newMethod: PaymentMethod = { id: crypto.randomUUID(), name };
    setSettings(s => ({ ...s, paymentMethods: [...s.paymentMethods, newMethod] }));
  }, []);

  const deletePaymentMethod = useCallback((id: string) => {
    setSettings(s => ({ ...s, paymentMethods: s.paymentMethods.filter(pm => pm.id !== id) }));
  }, []);

  const toggleAutoPrint = useCallback((enabled: boolean) => {
    setSettings(s => ({...s, autoPrintReceipts: enabled }));
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        addFloor,
        deleteFloor,
        addTable,
        deleteTable,
        addPaymentMethod,
        deletePaymentMethod,
        toggleAutoPrint,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
