
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Floor, Table, PaymentMethod } from '@/lib/types';

interface Settings {
    floors: Floor[];
    tables: Table[];
    paymentMethods: PaymentMethod[];
    autoPrintReceipts: boolean;
    companyName: string;
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

const defaultPaymentMethods: PaymentMethod[] = [
    { id: 'cash', name: 'Cash' },
    { id: 'card', name: 'Credit/Debit Card' }
];

const floorsData: { id: string, name: string, prefix: string }[] = [
    { id: 'floor-basement', name: 'Basement', prefix: 'B' },
    { id: 'floor-ground', name: 'Ground', prefix: 'G' },
    { id: 'floor-first', name: 'First', prefix: 'F' },
    { id: 'floor-second', name: 'Second', prefix: 'S' },
    { id: 'floor-rooftop', name: 'Roof Top', prefix: 'R' }
];

const initialFloors: Floor[] = floorsData.map(({ id, name }) => ({ id, name }));

const initialTables: Table[] = floorsData.flatMap(floor => 
    Array.from({ length: 10 }, (_, i) => ({
        id: `table-${floor.prefix.toLowerCase()}-${i + 1}`,
        name: `${floor.prefix}-${i + 1}`,
        floorId: floor.id,
    }))
);


const initialSettings: Settings = {
    floors: initialFloors,
    tables: initialTables,
    paymentMethods: defaultPaymentMethods,
    autoPrintReceipts: false,
    companyName: "Cheezious",
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        
        // Ensure default payment methods are always present
        const customMethods = parsed.paymentMethods?.filter((pm: PaymentMethod) => !defaultPaymentMethods.some(dpm => dpm.id === pm.id)) || [];
        
        setSettings({
            floors: parsed.floors && parsed.floors.length > 0 ? parsed.floors : initialFloors,
            tables: parsed.tables && parsed.tables.length > 0 ? parsed.tables : initialTables,
            paymentMethods: [...defaultPaymentMethods, ...customMethods],
            autoPrintReceipts: parsed.autoPrintReceipts || false,
            companyName: parsed.companyName || "Cheezious",
        });
      } else {
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
    if (defaultPaymentMethods.some(pm => pm.id === id)) {
        console.warn("Cannot delete a default payment method.");
        return;
    }
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
