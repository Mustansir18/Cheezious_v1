
'use client';

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import type { Settings, Floor, Table, PaymentMethod, Branch, Role, UserRole, DeliveryMode, PromotionSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';
import { useDataFetcher } from '@/hooks/use-data-fetcher';
import { initialDeals } from '@/lib/data';

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
    floors: [
      { id: 'F-001', name: 'Ground Floor' },
      { id: 'F-002', name: 'First Floor' },
    ],
    tables: [
        { id: 'T-001', name: 'Table 1', floorId: 'F-001' },
        { id: 'T-002', name: 'Table 2', floorId: 'F-001' },
        { id: 'T-003', name: 'Table 3', floorId: 'F-002' },
    ],
    paymentMethods: [
        { id: 'PM-001', name: 'Cash', taxRate: 0.16 },
        { id: 'PM-002', name: 'Card', taxRate: 0.16 },
    ],
    autoPrintReceipts: false, 
    companyName: "Cheezious",
    companyLogo: '/images/logo.png', 
    branches: [
      { id: 'B-00001', name: 'Johar Town, Lahore', dineInEnabled: true, takeAwayEnabled: true, deliveryEnabled: true, orderPrefix: 'JT' },
      { id: 'B-00002', name: 'DHA Phase 5, Lahore', dineInEnabled: true, takeAwayEnabled: true, deliveryEnabled: false, orderPrefix: 'DHA' },
    ], 
    defaultBranchId: 'B-00001',
    businessDayStart: "11:00", 
    businessDayEnd: "04:00", 
    roles: [
        { id: 'root', name: 'Root', permissions: ['admin:*'] },
        { id: 'admin', name: 'Admin', permissions: ['/admin/orders', '/admin/kds', '/admin/reporting'] },
        { id: 'cashier', name: 'Cashier', permissions: ['/cashier'] },
        { id: 'marketing', name: 'Marketing', permissions: ['/marketing/reporting', '/marketing/feedback', '/marketing/target'] },
        { id: 'kds', name: 'KDS (All)', permissions: ['/admin/kds'] },
        { id: 'make-station', name: 'MAKE Station', permissions: ['/admin/kds/pizza'] },
        { id: 'pasta-station', name: 'PASTA Station', permissions: ['/admin/kds/pasta'] },
        { id: 'fried-station', name: 'FRIED Station', permissions: ['/admin/kds/fried'] },
        { id: 'bar-station', name: 'BEVERAGES Station', permissions: ['/admin/kds/bar'] },
        { id: 'cutt-station', name: 'CUTT Station', permissions: ['/admin/kds/master'] },
    ], 
    deliveryModes: [
        { id: 'DM-01', name: 'Website' },
        { id: 'DM-02', name: 'Call Center' },
    ],
    promotion: { isEnabled: true, itemId: 'D-00001', imageUrl: 'https://images.unsplash.com/photo-1608835291093-394b0c943a75?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxtZWFsfGVufDB8fHx8MTc2ODI5MzU3OXww&ixlib=rb-4.1.0&q=80&w=1080' }
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { data: settings, isLoading, mutate } = useDataFetcher<Settings>('/api/settings', initialSettings);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const { user } = useAuth();
  
  const postSetting = useCallback(async (action: string, payload: any) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings.');
      }
      await mutate(); // Re-fetch settings from the server
      toast({ title: 'Settings Updated', description: 'Your changes have been saved.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    }
  }, [mutate, toast]);

  const addFloor = (id: string, name: string) => {
    if (!id || !name) return;
    postSetting('addFloor', { id, name });
    logActivity(`Added floor: '${name}'.`, user?.username || 'System', 'Settings');
  };

  const deleteFloor = (id: string, name: string) => {
    postSetting('deleteFloor', { id });
    logActivity(`Deleted floor: '${name}'.`, user?.username || 'System', 'Settings');
  };

  const addTable = (id: string, name: string, floorId: string) => {
    if (!id || !name || !floorId) return;
    postSetting('addTable', { id, name, floorId });
    const floorName = settings.floors.find(f => f.id === floorId)?.name || 'N/A';
    logActivity(`Added table: '${name}' to floor '${floorName}'.`, user?.username || 'System', 'Settings');
  };

  const deleteTable = (id: string, name: string) => {
    postSetting('deleteTable', { id });
    logActivity(`Deleted table: '${name}'.`, user?.username || 'System', 'Settings');
  };

  const addPaymentMethod = (id: string, name: string) => {
    if (!id || !name) return;
    postSetting('addPaymentMethod', { id, name, taxRate: 0 });
    logActivity(`Added payment method: '${name}'.`, user?.username || 'System', 'Settings');
  };

  const deletePaymentMethod = (id: string, name: string) => {
    postSetting('deletePaymentMethod', { id });
    logActivity(`Deleted payment method: '${name}'.`, user?.username || 'System', 'Settings');
  };
  
  const updatePaymentMethodTaxRate = (id: string, taxRate: number) => {
    if (isNaN(taxRate) || taxRate < 0) return;
    postSetting('updatePaymentMethodTaxRate', { id, taxRate });
  };
  
  const toggleAutoPrint = (enabled: boolean) => {
    postSetting('updateGlobal', { autoPrintReceipts: enabled });
    logActivity(`Toggled auto-print receipts to: ${enabled ? 'ON' : 'OFF'}.`, user?.username || 'System', 'Settings');
  };

  const addBranch = (id: string, name: string, orderPrefix: string) => {
    if (!id || !name || !orderPrefix) return;
    postSetting('addBranch', { id, name, orderPrefix, dineInEnabled: true, takeAwayEnabled: true, deliveryEnabled: true });
    logActivity(`Added branch: '${name}'.`, user?.username || 'System', 'Settings');
  };

  const updateBranch = (id: string, name: string, orderPrefix: string) => {
    postSetting('updateBranch', { id, name, orderPrefix });
    logActivity(`Updated branch: '${name}'.`, user?.username || 'System', 'Settings');
  };
  
  const deleteBranch = (id: string, name: string) => {
    postSetting('deleteBranch', { id });
    logActivity(`Deleted branch: '${name}'.`, user?.username || 'System', 'Settings');
  };

  const setDefaultBranch = (id: string) => {
    postSetting('updateGlobal', { defaultBranchId: id });
    const branchName = settings.branches.find(b => b.id === id)?.name;
    logActivity(`Set default branch to: '${branchName}'.`, user?.username || 'System', 'Settings');
  };
  
  const toggleService = (branchId: string, service: string, enabled: boolean) => {
    postSetting('toggleService', { branchId, service, enabled });
    const serviceName = service === 'dineInEnabled' ? 'Dine-In' : service === 'takeAwayEnabled' ? 'Take Away' : 'Delivery';
    logActivity(`Set ${serviceName} service to ${enabled ? 'ON' : 'OFF'}.`, user?.username || 'System', 'Settings');
  };

  const updateBusinessDayHours = (start: string, end: string) => {
    postSetting('updateGlobal', { businessDayStart: start, businessDayEnd: end });
    logActivity(`Updated business hours to ${start} - ${end}.`, user?.username || 'System', 'Settings');
  };
  
  const updateCompanyName = (name: string) => postSetting('updateGlobal', { companyName: name });
  const updateCompanyLogo = (logoUrl: string) => postSetting('updateGlobal', { companyLogo: logoUrl });
  const addRole = (role: Role) => postSetting('addRole', role);
  const updateRole = (role: Role) => postSetting('updateRole', role);
  const deleteRole = (id: UserRole) => postSetting('deleteRole', { id });
  const addDeliveryMode = (id: string, name: string) => postSetting('addDeliveryMode', { id, name });
  const deleteDeliveryMode = (id: string, name: string) => postSetting('deleteDeliveryMode', { id, name });
  const updatePromotion = (promotion: PromotionSettings) => postSetting('updateGlobal', { promotion });

  return (
    <SettingsContext.Provider
      value={{
        settings, isLoading, addFloor, deleteFloor, addTable, deleteTable, addPaymentMethod, deletePaymentMethod,
        updatePaymentMethodTaxRate, toggleAutoPrint, addBranch, updateBranch, deleteBranch, setDefaultBranch,
        toggleService, updateBusinessDayHours, updateCompanyName, updateCompanyLogo, addRole, updateRole, deleteRole,
        addDeliveryMode, deleteDeliveryMode, updatePromotion
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
