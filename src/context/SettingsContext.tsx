
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { Settings, Floor, Table, PaymentMethod, Branch, Role, UserRole, DeliveryMode, PromotionSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';
import { useSyncLocalStorage } from '@/hooks/use-sync-local-storage';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { initialDeals, menuCategories, addons } from '@/lib/data';
import { ALL_PERMISSIONS } from '@/config/permissions';

interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  addFloor: (id: string, name: string) => void;
  deleteFloor: (id: string, name: string) => void;
  addTable: (id: string, name: string, floorId: string) => void;
  deleteTable: (id: string, name: string) => void;
  addPaymentMethod: (id: string, name: string) => void;
  deletePaymentMethod: (id: string, name: string) => void;
  updatePaymentMethodTaxRate: (id: string, taxRate: number) => void;
  toggleAutoPrint: (enabled: boolean) => void;
  addBranch: (id: string, name: string, orderPrefix: string) => void;
  updateBranch: (id: string, name: string, orderPrefix: string) => void;
  deleteBranch: (id: string, name: string) => void;
  setDefaultBranch: (id: string) => void;
  toggleService: (branchId: string, service: 'dineInEnabled' | 'takeAwayEnabled' | 'deliveryEnabled', enabled: boolean) => void;
  updateBusinessDayHours: (start: string, end: string) => void;
  updateCompanyName: (name: string) => void;
  updateCompanyLogo: (logoUrl: string) => void;
  addRole: (role: Role) => void;
  updateRole: (role: Role) => void;
  deleteRole: (id: UserRole) => void;
  addDeliveryMode: (id: string, name: string) => void;
  deleteDeliveryMode: (id: string, name: string) => void;
  updatePromotion: (promotion: PromotionSettings) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const initialSettings: Settings = {
    floors: [{ id: 'F-00001', name: 'Ground' }],
    tables: [{ id: 'T-G-1', name: 'Table 1', floorId: 'F-00001' }],
    paymentMethods: [{ id: 'PM-1', name: 'Cash', taxRate: 0.16 }],
    autoPrintReceipts: false,
    companyName: "Cheezious",
    companyLogo: PlaceHolderImages.find(i => i.id === 'cheezious-special')?.imageUrl || undefined,
    branches: [{ id: 'B-00001', name: 'CHZ J3, JOHAR TOWN LAHORE', dineInEnabled: true, takeAwayEnabled: true, deliveryEnabled: true, orderPrefix: 'G3' }],
    defaultBranchId: 'B-00001',
    businessDayStart: "11:00",
    businessDayEnd: "04:00",
    roles: [
        { id: 'root', name: 'Root', permissions: ['admin:*'] },
        { id: 'admin', name: 'Admin', permissions: ['/admin/orders', '/admin/queue', '/admin/kds'] },
        { id: 'cashier', name: 'Cashier', permissions: ['/cashier'] },
        { id: 'marketing', name: 'Marketing', permissions: ['/marketing/reporting', '/marketing/feedback', '/marketing/target'] },
        { id: 'kds', name: 'KDS', permissions: ['/admin/kds'] },
        { id: 'make-station', name: 'MAKE Station', permissions: ['/admin/kds/pizza'] },
        { id: 'pasta-station', name: 'PASTA Station', permissions: ['/admin/kds/pasta'] },
        { id: 'fried-station', name: 'FRIED Station', permissions: ['/admin/kds/fried'] },
        { id: 'bar-station', name: 'BEVERAGES Station', permissions: ['/admin/kds/bar'] },
        { id: 'cutt-station', name: 'CUTT Station', permissions: ['/admin/kds/master'] },
    ],
    deliveryModes: [{ id: 'DM-1', name: 'Website' }],
    promotion: {
        isEnabled: true,
        itemId: initialDeals[0].id,
        imageUrl: initialDeals[0].imageUrl
    }
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings, isLoading] = useSyncLocalStorage<Settings>('settings', initialSettings, '/api/settings');
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const { user } = useAuth();
  
  const postSettings = useCallback(async (newSettings: Settings) => {
    setSettings(newSettings);
    // In a real app, we'd have more granular API endpoints.
    // For now, we post the entire settings object on any change.
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings }),
      });
      if (!response.ok) {
        throw new Error('Failed to save settings to the server.');
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Sync Error', description: 'Could not save settings to the server.' });
    }
  }, [setSettings, toast]);
  
  const addFloor = useCallback((id: string, name: string) => {
    if (!id || !name) { return; }
    const newFloor: Floor = { id, name };
    postSettings({ ...settings, floors: [...settings.floors, newFloor] });
    logActivity(`Added floor: '${name}'.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);

  const deleteFloor = useCallback((id: string, name: string) => {
    postSettings({ 
        ...settings, 
        floors: settings.floors.filter(f => f.id !== id),
        tables: settings.tables.filter(t => t.floorId !== id),
    });
    logActivity(`Deleted floor: '${name}' and its tables.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);

  const addTable = useCallback((id: string, name: string, floorId: string) => {
    if (!id || !name || !floorId) { return; }
    const newTable: Table = { id, name, floorId };
    postSettings({ ...settings, tables: [...settings.tables, newTable] });
    const floorName = settings.floors.find(f => f.id === floorId)?.name || 'N/A';
    logActivity(`Added table: '${name}' to floor '${floorName}'.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);

  const deleteTable = useCallback((id: string, name: string) => {
    postSettings({ ...settings, tables: settings.tables.filter(t => t.id !== id) });
    logActivity(`Deleted table: '${name}'.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);

  const addPaymentMethod = useCallback((id: string, name: string) => {
    if (!id || !name) { return; }
    const newMethod: PaymentMethod = { id, name, taxRate: 0 };
    postSettings({ ...settings, paymentMethods: [...settings.paymentMethods, newMethod] });
    logActivity(`Added payment method: '${name}'.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);

  const deletePaymentMethod = useCallback((id: string, name: string) => {
    postSettings({ ...settings, paymentMethods: settings.paymentMethods.filter(pm => pm.id !== id) });
    logActivity(`Deleted payment method: '${name}'.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);

  const updatePaymentMethodTaxRate = useCallback((id: string, taxRate: number) => {
    if (isNaN(taxRate) || taxRate < 0) return;
    const newSettings = {
        ...settings,
        paymentMethods: settings.paymentMethods.map(pm => pm.id === id ? {...pm, taxRate} : pm)
    };
    postSettings(newSettings);
  }, [settings, postSettings]);

  const toggleAutoPrint = useCallback((enabled: boolean) => {
    postSettings({...settings, autoPrintReceipts: enabled });
    logActivity(`Toggled auto-print receipts to: ${enabled ? 'ON' : 'OFF'}.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);

  const addBranch = useCallback((id: string, name: string, orderPrefix: string) => {
    if (!id || !name || !orderPrefix) { return; }
    const newBranch: Branch = { id, name, orderPrefix, dineInEnabled: true, takeAwayEnabled: true, deliveryEnabled: true };
    postSettings({...settings, branches: [...settings.branches, newBranch]});
    logActivity(`Added branch: '${name}'.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);

  const updateBranch = useCallback((id: string, name: string, orderPrefix: string) => {
    postSettings({...settings, branches: settings.branches.map(b => b.id === id ? {...b, name, orderPrefix} : b)});
    logActivity(`Updated branch: '${name}'.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);

  const deleteBranch = useCallback((id: string, name: string) => {
    const newBranches = settings.branches.filter(b => b.id !== id);
    const newDefaultId = id === settings.defaultBranchId ? (newBranches[0]?.id || null) : settings.defaultBranchId;
    postSettings({...settings, branches: newBranches, defaultBranchId: newDefaultId });
    logActivity(`Deleted branch: '${name}'.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);
  
  const setDefaultBranch = useCallback((id: string) => {
      postSettings({...settings, defaultBranchId: id});
      const branchName = settings.branches.find(b => b.id === id)?.name;
      logActivity(`Set default branch to: '${branchName}'.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);
  
  const toggleService = useCallback((branchId: string, service: 'dineInEnabled' | 'takeAwayEnabled' | 'deliveryEnabled', enabled: boolean) => {
    postSettings({...settings, branches: settings.branches.map(b => b.id === branchId ? {...b, [service]: enabled} : b)});
    const branchName = settings.branches.find(b => b.id === branchId)?.name;
    const serviceName = service === 'dineInEnabled' ? 'Dine-In' : service === 'takeAwayEnabled' ? 'Take Away' : 'Delivery';
    logActivity(`Set ${serviceName} service to ${enabled ? 'ON' : 'OFF'} for branch '${branchName}'.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);

  const updateBusinessDayHours = useCallback((start: string, end: string) => {
      postSettings({...settings, businessDayStart: start, businessDayEnd: end});
      logActivity(`Updated business hours. Start: ${start}, End: ${end}.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);

  const updateCompanyName = useCallback((name: string) => {
    postSettings({...settings, companyName: name});
  }, [settings, postSettings]);
  
  const updateCompanyLogo = useCallback((logoUrl: string) => {
    postSettings({...settings, companyLogo: logoUrl});
  }, [settings, postSettings]);

  const addRole = useCallback((newRole: Role) => {
    postSettings({ ...settings, roles: [...settings.roles, newRole] });
    logActivity(`Added new role: '${newRole.name}'.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);

  const updateRole = useCallback((updatedRole: Role) => {
    postSettings({
      ...settings,
      roles: settings.roles.map(r => r.id === updatedRole.id ? updatedRole : r),
    });
    logActivity(`Updated role: '${updatedRole.name}'.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);

  const deleteRole = useCallback((roleId: UserRole) => {
    const roleName = settings.roles.find(r => r.id === roleId)?.name || 'N/A';
    postSettings({
      ...settings,
      roles: settings.roles.filter(r => r.id !== roleId),
    });
    logActivity(`Deleted role: '${roleName}'.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);
  
  const addDeliveryMode = useCallback((id: string, name: string) => {
    if (!id || !name) { return; }
    const newMode: DeliveryMode = { id, name };
    postSettings({ ...settings, deliveryModes: [...settings.deliveryModes, newMode] });
    logActivity(`Added delivery mode: '${name}'.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);

  const deleteDeliveryMode = useCallback((id: string, name: string) => {
    postSettings({ ...settings, deliveryModes: settings.deliveryModes.filter(dm => dm.id !== id) });
    logActivity(`Deleted delivery mode: '${name}'.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);
  
  const updatePromotion = useCallback((promotion: PromotionSettings) => {
    postSettings({ ...settings, promotion });
    logActivity(`Updated homepage promotion settings.`, user?.username || 'System', 'Settings');
  }, [settings, postSettings, logActivity, user]);


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
        updateCompanyLogo,
        addRole,
        updateRole,
        deleteRole,
        addDeliveryMode,
        deleteDeliveryMode,
        updatePromotion,
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
