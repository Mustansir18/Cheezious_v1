
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Floor, Table, PaymentMethod, Branch, Role, UserRole } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { generateUniqueCode } from '@/lib/utils';

const defaultRoles: Role[] = [
    {
        id: "root",
        name: "Root",
        permissions: ["admin:*"]
    },
    {
        id: "admin",
        name: "Branch Admin",
        permissions: [
            "/admin",
            "/admin/orders",
            "/admin/queue",
        ]
    },
    {
        id: "cashier",
        name: "Cashier",
        permissions: [
            "/cashier"
        ]
    },
    {
        id: "marketing",
        name: "Marketing",
        permissions: [
            "/marketing/reporting",
            "/marketing/feedback",
            "/marketing/target"
        ]
    }
];

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
    roles: Role[];
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
  updatePaymentMethodTaxRate: (id: string, taxRate: number) => void;
  toggleAutoPrint: (enabled: boolean) => void;
  addBranch: (name: string, orderPrefix: string) => void;
  updateBranch: (id: string, name: string, orderPrefix: string) => void;
  deleteBranch: (id: string, name: string) => void;
  setDefaultBranch: (id: string) => void;
  toggleService: (branchId: string, service: 'dineInEnabled' | 'takeAwayEnabled', enabled: boolean) => void;
  updateBusinessDayHours: (start: string, end: string) => void;
  updateCompanyName: (name: string) => void;
  // Role management
  addRole: (role: Omit<Role, 'id'>) => void;
  updateRole: (role: Role) => void;
  deleteRole: (id: UserRole) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'cheeziousSettings';

const defaultPaymentMethods: PaymentMethod[] = [
    { id: 'cash', name: 'Cash', taxRate: 0.16 },
    { id: 'card', name: 'Credit/Debit Card', taxRate: 0.05 }
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
    roles: defaultRoles,
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
        
        // Ensure default payment methods are always present and up-to-date
        const parsedMethods = parsed.paymentMethods || [];
        const paymentMethodMap = new Map<string, PaymentMethod>();

        // Add defaults first
        defaultPaymentMethods.forEach(dpm => paymentMethodMap.set(dpm.id, dpm));
        
        // Overwrite defaults with stored values if they exist, and add custom ones
        parsedMethods.forEach((pm: PaymentMethod) => {
            paymentMethodMap.set(pm.id, pm);
        });

        const loadedBranches = parsed.branches && parsed.branches.length > 0 ? parsed.branches : initialBranches;
        
        const loadedRoles = parsed.roles && parsed.roles.length > 0 ? parsed.roles : defaultRoles;
        const roleMap = new Map<string, Role>();
        defaultRoles.forEach(r => roleMap.set(r.id, r));
        loadedRoles.forEach((r: Role) => roleMap.set(r.id, r));


        setSettings({
            floors: parsed.floors && parsed.floors.length > 0 ? parsed.floors : initialFloors,
            tables: parsed.tables && parsed.tables.length > 0 ? parsed.tables : initialTables,
            paymentMethods: Array.from(paymentMethodMap.values()),
            autoPrintReceipts: parsed.autoPrintReceipts || false,
            companyName: parsed.companyName || "Cheezious",
            branches: loadedBranches,
            defaultBranchId: parsed.defaultBranchId || loadedBranches[0]?.id || null,
            businessDayStart: parsed.businessDayStart || "11:00",
            businessDayEnd: parsed.businessDayEnd || "04:00",
            roles: Array.from(roleMap.values()),
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
    const newMethod: PaymentMethod = { id: crypto.randomUUID(), name, taxRate: 0 };
    setSettings(s => ({ ...s, paymentMethods: [...s.paymentMethods, newMethod] }));
    logActivity(`Added payment method: '${name}'.`, user?.username || 'System', 'Settings');
  }, [logActivity, user]);

  const deletePaymentMethod = useCallback((id: string, name: string) => {
    setSettings(s => ({ ...s, paymentMethods: s.paymentMethods.filter(pm => pm.id !== id) }));
    logActivity(`Deleted payment method: '${name}'.`, user?.username || 'System', 'Settings');
  }, [logActivity, user]);

  const updatePaymentMethodTaxRate = useCallback((id: string, taxRate: number) => {
    if (isNaN(taxRate) || taxRate < 0) return;
    setSettings(s => ({
        ...s,
        paymentMethods: s.paymentMethods.map(pm => pm.id === id ? {...pm, taxRate} : pm)
    }))
  }, []);

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

  const addRole = useCallback((role: Omit<Role, 'id'>) => {
    const newRole: Role = { ...role, id: generateUniqueCode('R') };
    if (settings.roles.some(r => r.id === newRole.id)) {
        toast({ variant: 'destructive', title: 'Error', description: `A role with the ID '${newRole.id}' already exists.` });
        return;
    }
    setSettings(s => ({ ...s, roles: [...s.roles, newRole] }));
    logActivity(`Added new role: '${role.name}'.`, user?.username || 'System', 'Settings');
  }, [settings.roles, toast, logActivity, user]);

  const updateRole = useCallback((updatedRole: Role) => {
    setSettings(s => ({
      ...s,
      roles: s.roles.map(r => r.id === updatedRole.id ? updatedRole : r),
    }));
    logActivity(`Updated role: '${updatedRole.name}'.`, user?.username || 'System', 'Settings');
  }, [logActivity, user]);

  const deleteRole = useCallback((roleId: UserRole) => {
    if (['root', 'admin', 'cashier', 'marketing'].includes(roleId)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot delete a default system role.' });
        return;
    }
    const roleName = settings.roles.find(r => r.id === roleId)?.name || 'N/A';
    setSettings(s => ({
      ...s,
      roles: s.roles.filter(r => r.id !== roleId),
    }));
    logActivity(`Deleted role: '${roleName}'.`, user?.username || 'System', 'Settings');
  }, [settings.roles, toast, logActivity, user]);


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
        updatePaymentMethodTaxRate,
        toggleAutoPrint,
        addBranch,
        updateBranch,
        deleteBranch,
        setDefaultBranch,
        toggleService,
        updateBusinessDayHours,
        updateCompanyName,
        addRole,
        updateRole,
        deleteRole,
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
