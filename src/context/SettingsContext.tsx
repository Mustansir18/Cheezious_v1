
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Floor, Table, PaymentMethod, Branch } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';

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
  deleteFloor: (id: string, name: string) => void;
  addTable: (name: string, floorId: string) => void;
  deleteTable: (id: string, name: string) => void;
  addPaymentMethod: (name: string) => void;
  deletePaymentMethod: (id: string, name: string) => void;
  toggleAutoPrint: (enabled: boolean) => void;
  addBranch: (name: string, orderPrefix: string) => void;
  updateBranch: (id: string, name: string, orderPrefix: string) => void;
  deleteBranch: (id: string, name: string) => void;
  setDefaultBranch: (id: string) => void;
  toggleService: (branchId: string, service: 'dineInEnabled' | 'takeAwayEnabled', enabled: boolean) => void;
  updateBusinessDayHours: (start: string, end: string) => void;
  updateCompanyName: (name: string) => void;
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
  const { logActivity } = useActivityLog();
  const { user } = useAuth();

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
    logActivity(`Added floor: '${name}'.`, user?.username || 'System', 'Settings');
  }, [logActivity, user]);

  const deleteFloor = useCallback((id: string, name: string) => {
    setSettings(s => ({ 
        ...s, 
        floors: s.floors.filter(f => f.id !== id),
        tables: s.tables.filter(t => t.floorId !== id),
    }));
    logActivity(`Deleted floor: '${name}' and its tables.`, user?.username || 'System', 'Settings');
  }, [logActivity, user]);

  const addTable = useCallback((name: string, floorId: string) => {
    const newTable: Table = { id: crypto.randomUUID(), name, floorId };
    setSettings(s => ({ ...s, tables: [...s.tables, newTable] }));
    const floorName = settings.floors.find(f => f.id === floorId)?.name || 'N/A';
    logActivity(`Added table: '${name}' to floor '${floorName}'.`, user?.username || 'System', 'Settings');
  }, [logActivity, settings.floors, user]);

  const deleteTable = useCallback((id: string, name: string) => {
    setSettings(s => ({ ...s, tables: s.tables.filter(t => t.id !== id) }));
    logActivity(`Deleted table: '${name}'.`, user?.username || 'System', 'Settings');
  }, [logActivity, user]);

  const addPaymentMethod = useCallback((name: string) => {
    const newMethod: PaymentMethod = { id: crypto.randomUUID(), name };
    setSettings(s => ({ ...s, paymentMethods: [...s.paymentMethods, newMethod] }));
    logActivity(`Added payment method: '${name}'.`, user?.username || 'System', 'Settings');
  }, [logActivity, user]);

  const deletePaymentMethod = useCallback((id: string, name: string) => {
    if (defaultPaymentMethods.some(pm => pm.id === id)) {
        toast({ title: "Action Denied", description: "Cannot delete a default payment method.", variant: "destructive" });
        return;
    }
    setSettings(s => ({ ...s, paymentMethods: s.paymentMethods.filter(pm => pm.id !== id) }));
    logActivity(`Deleted payment method: '${name}'.`, user?.username || 'System', 'Settings');
  }, [toast, logActivity, user]);

  const toggleAutoPrint = useCallback((enabled: boolean) => {
    setSettings(s => ({...s, autoPrintReceipts: enabled }));
    logActivity(`Toggled auto-print receipts to: ${enabled ? 'ON' : 'OFF'}.`, user?.username || 'System', 'Settings');
  }, [logActivity, user]);

  const addBranch = useCallback((name: string, orderPrefix: string) => {
    const newBranch: Branch = { id: crypto.randomUUID(), name, orderPrefix, dineInEnabled: true, takeAwayEnabled: true };
    setSettings(s => ({...s, branches: [...s.branches, newBranch]}));
    logActivity(`Added branch: '${name}'.`, user?.username || 'System', 'Settings');
  }, [logActivity, user]);

  const updateBranch = useCallback((id: string, name: string, orderPrefix: string) => {
    setSettings(s => ({...s, branches: s.branches.map(b => b.id === id ? {...b, name, orderPrefix} : b)}));
    logActivity(`Updated branch: '${name}'.`, user?.username || 'System', 'Settings');
  }, [logActivity, user]);

  const deleteBranch = useCallback((id: string, name: string) => {
    setSettings(s => {
        const newBranches = s.branches.filter(b => b.id !== id);
        // If the deleted branch was the default, reset the default
        const newDefaultId = id === s.defaultBranchId ? (newBranches[0]?.id || null) : s.defaultBranchId;
        return {...s, branches: newBranches, defaultBranchId: newDefaultId };
    });
    logActivity(`Deleted branch: '${name}'.`, user?.username || 'System', 'Settings');
  }, [logActivity, user]);
  
  const setDefaultBranch = useCallback((id: string) => {
      setSettings(s => ({...s, defaultBranchId: id}));
      const branchName = settings.branches.find(b => b.id === id)?.name;
      logActivity(`Set default branch to: '${branchName}'.`, user?.username || 'System', 'Settings');
  }, [logActivity, settings.branches, user]);
  
  const toggleService = useCallback((branchId: string, service: 'dineInEnabled' | 'takeAwayEnabled', enabled: boolean) => {
    setSettings(s => ({...s, branches: s.branches.map(b => b.id === branchId ? {...b, [service]: enabled} : b)}));
    const branchName = settings.branches.find(b => b.id === branchId)?.name;
    const serviceName = service === 'dineInEnabled' ? 'Dine-In' : 'Take Away';
    logActivity(`Set ${serviceName} service to ${enabled ? 'ON' : 'OFF'} for branch '${branchName}'.`, user?.username || 'System', 'Settings');
  }, [logActivity, settings.branches, user]);

  const updateBusinessDayHours = useCallback((start: string, end: string) => {
      setSettings(s => ({...s, businessDayStart: start, businessDayEnd: end}));
      toast({ title: "Success", description: "Business hours have been updated." });
      logActivity(`Updated business hours. Start: ${start}, End: ${end}.`, user?.username || 'System', 'Settings');
  }, [toast, logActivity, user]);

  const updateCompanyName = useCallback((name: string) => {
    setSettings(s => ({...s, companyName: name}));
    toast({ title: "Success", description: "Company name has been updated." });
    logActivity(`Updated company name to: '${name}'.`, user?.username || 'System', 'Settings');
  }, [toast, logActivity, user]);


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
        updateCompanyName,
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
