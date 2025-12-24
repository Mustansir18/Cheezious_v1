
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Floor, Table, PaymentMethod, Branch } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface Settings {
    floors: Floor[];
    tables: Table[];
    paymentMethods: PaymentMethod[];
    autoPrintReceipts: boolean;
    companyName: string;
    branches: Branch[];
    defaultBranchId: string | null;
    businessDayStart: string; // "HH:MM"
    businessDayEnd: string; // "HH:MM"
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
  addBranch: (name: string, orderPrefix: string) => void;
  updateBranch: (id: string, name: string, orderPrefix: string) => void;
  deleteBranch: (id: string) => void;
  setDefaultBranch: (id: string) => void;
  toggleService: (branchId: string, service: 'dineInEnabled' | 'takeAwayEnabled', enabled: boolean) => void;
  updateBusinessDayHours: (start: string, end: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'cheeziousSettings';

const defaultPaymentMethods: PaymentMethod[] = [
    { id: 'cash', name: 'Cash' },
    { id: 'card', name: 'Credit/Debit Card' }
];

const initialBranches: Branch[] = [
    { id: 'j3-johar-town-lahore', name: 'CHZ J3, JOHAR TOWN LAHORE', dineInEnabled: true, takeAwayEnabled: true, orderPrefix: 'G3' }
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
    branches: initialBranches,
    defaultBranchId: initialBranches[0]?.id || null,
    businessDayStart: "11:00",
    businessDayEnd: "04:00",
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        
        const customMethods = parsed.paymentMethods?.filter((pm: PaymentMethod) => !defaultPaymentMethods.some(dpm => dpm.id === pm.id)) || [];
        const loadedBranches = parsed.branches && parsed.branches.length > 0 ? parsed.branches : initialBranches;
        
        setSettings({
            floors: parsed.floors && parsed.floors.length > 0 ? parsed.floors : initialFloors,
            tables: parsed.tables && parsed.tables.length > 0 ? parsed.tables : initialTables,
            paymentMethods: [...defaultPaymentMethods, ...customMethods],
            autoPrintReceipts: parsed.autoPrintReceipts || false,
            companyName: parsed.companyName || "Cheezious",
            branches: loadedBranches,
            defaultBranchId: parsed.defaultBranchId || loadedBranches[0]?.id || null,
            businessDayStart: parsed.businessDayStart || "11:00",
            businessDayEnd: parsed.businessDayEnd || "04:00",
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
        tables: s.tables.filter(t => t.floorId !== id),
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
        toast({ title: "Action Denied", description: "Cannot delete a default payment method.", variant: "destructive" });
        return;
    }
    setSettings(s => ({ ...s, paymentMethods: s.paymentMethods.filter(pm => pm.id !== id) }));
  }, [toast]);

  const toggleAutoPrint = useCallback((enabled: boolean) => {
    setSettings(s => ({...s, autoPrintReceipts: enabled }));
  }, []);

  const addBranch = useCallback((name: string, orderPrefix: string) => {
    const newBranch: Branch = { id: crypto.randomUUID(), name, orderPrefix, dineInEnabled: true, takeAwayEnabled: true };
    setSettings(s => ({...s, branches: [...s.branches, newBranch]}));
  }, []);

  const updateBranch = useCallback((id: string, name: string, orderPrefix: string) => {
    setSettings(s => ({...s, branches: s.branches.map(b => b.id === id ? {...b, name, orderPrefix} : b)}));
  }, []);

  const deleteBranch = useCallback((id: string) => {
    setSettings(s => {
        const newBranches = s.branches.filter(b => b.id !== id);
        // If the deleted branch was the default, reset the default
        const newDefaultId = id === s.defaultBranchId ? (newBranches[0]?.id || null) : s.defaultBranchId;
        return {...s, branches: newBranches, defaultBranchId: newDefaultId };
    });
  }, []);
  
  const setDefaultBranch = useCallback((id: string) => {
      setSettings(s => ({...s, defaultBranchId: id}));
  }, []);
  
  const toggleService = useCallback((branchId: string, service: 'dineInEnabled' | 'takeAwayEnabled', enabled: boolean) => {
    setSettings(s => ({...s, branches: s.branches.map(b => b.id === branchId ? {...b, [service]: enabled} : b)}));
  }, []);

  const updateBusinessDayHours = useCallback((start: string, end: string) => {
      setSettings(s => ({...s, businessDayStart: start, businessDayEnd: end}));
      toast({ title: "Success", description: "Business hours have been updated." });
  }, [toast]);


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
        addBranch,
        updateBranch,
        deleteBranch,
        setDefaultBranch,
        toggleService,
        updateBusinessDayHours,
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

    