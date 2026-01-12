

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, UserRole } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';
import { useToast } from '@/hooks/use-toast';

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  users: User[];
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  addUser: (user: Omit<User, 'username' | 'role' | 'balance'> & { username: string; role: UserRole | string; }) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string, username: string) => void;
  updateUserBalance: (userId: string, amount: number, operation: 'add' | 'subtract') => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultBranchId = 'B-00001';

// --- Hardcoded Default Users ---
const initialUsers: User[] = [
    { id: 'CH-00001', username: 'root', password: 'Faith123$$', role: 'root', balance: 0 },
    { id: 'CH-00002', username: 'admin', password: 'admin', role: 'admin', branchId: defaultBranchId, balance: 0 },
    { id: 'CH-00003', username: 'cashier', password: 'cashier', role: 'cashier', branchId: defaultBranchId, balance: 0 },
    { id: 'CH-00004', username: 'markeeting', password: 'markeeting', role: 'marketing', balance: 0 },
    { id: 'CH-KDS-01', username: 'kds', password: 'KDS', role: 'kds', stationName: 'All Stations', branchId: defaultBranchId, balance: 0 },
    { id: 'CH-KDS-02', username: 'fried', password: 'FRIED', role: 'fried-station', stationName: 'FRIED Station', branchId: defaultBranchId, balance: 0 },
    { id: 'CH-KDS-03', username: 'make', password: 'MAKE', role: 'make-station', stationName: 'MAKE Station', branchId: defaultBranchId, balance: 0 },
    { id: 'CH-KDS-04', username: 'cutt', password: 'CUTT', role: 'cutt-station', stationName: 'CUTT Station', branchId: defaultBranchId, balance: 0 },
    { id: 'CH-KDS-05', username: 'bar', password: 'BAR', role: 'bar-station', stationName: 'BEVERAGES Station', branchId: defaultBranchId, balance: 0 },
    { id: 'CH-KDS-06', username: 'pasta', password: 'PASTA', role: 'pasta-station', stationName: 'PASTA Station', branchId: defaultBranchId, balance: 0 },
];

const USERS_STORAGE_KEY = 'cheeziousUsersV2';
const SESSION_STORAGE_KEY = 'cheeziousSession';

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const { toast } = useToast();
  const router = useRouter();

  // Load users from API and session on initial render
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      try {
        // Fetch users from the API endpoint
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        const fetchedUsers: User[] = data.users;

        // In a real scenario, the API would provide the full user object.
        // For this migration step, we'll merge with initialUsers to keep passwords.
        const userMap = new Map<string, User>();
        initialUsers.forEach(u => userMap.set(u.id, { ...u }));
        fetchedUsers.forEach(fetchedUser => {
            const existingUser = userMap.get(fetchedUser.id);
            if (existingUser) {
                userMap.set(fetchedUser.id, { ...existingUser, ...fetchedUser });
            } else {
                // This case is unlikely if initialUsers is the base
                userMap.set(fetchedUser.id, fetchedUser as User);
            }
        });
        
        const combinedUsers = Array.from(userMap.values());
        setUsers(combinedUsers);
        
        // Restore session from sessionStorage
        const sessionUserJSON = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (sessionUserJSON) {
          const sessionUser = JSON.parse(sessionUserJSON);
          const validUser = combinedUsers.find(u => u.id === sessionUser.id);
          if (validUser) {
              setUser(validUser);
          } else {
              sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }

      } catch (error) {
        console.error("Failed to initialize auth state:", error);
        // Fallback to initial hardcoded users if API fails
        setUsers(initialUsers);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, []);


  // This useEffect will now only handle saving the session, not the full user list.
  useEffect(() => {
      if (isLoading) return;
      try {
          if (user) {
              sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
          } else {
              sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }
      } catch (error) {
          console.error("Could not save session to session storage", error);
      }
  }, [user, isLoading]);

  // The storage event listener for USERS_STORAGE_KEY is no longer needed
  // as the API is the source of truth. It can be removed in a later step.

  const login = useCallback(async (username: string, password: string): Promise<User | null> => {
    // This logic will be replaced with a call to a /api/login endpoint
    const foundUser = users.find(u => u.username === username && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      logActivity(`User '${username}' logged in.`, username, 'System');
      return foundUser;
    }
    throw new Error('Invalid username or password');
  }, [users, logActivity]);

  const logout = useCallback(() => {
    if (user) {
        logActivity(`User '${user.username}' logged out.`, user.username, 'System');
    }
    setUser(null);
    router.push('/login');
  }, [router, user, logActivity]);

  // These functions will be updated to use API calls next.
  const addUser = useCallback((newUser: Omit<User, 'username' | 'role' | 'balance'> & { username: string; role: UserRole | string; }) => {
    if (!newUser.id) {
        toast({ variant: 'destructive', title: 'Error', description: 'User Code is required.' });
        return;
    }
    if (users.some(u => u.id === newUser.id || u.username === newUser.username)) {
      toast({ variant: 'destructive', title: 'Error', description: 'A user with this ID or username already exists.' });
      return;
    }
    const userToAdd: User = { ...newUser, role: newUser.role as UserRole, balance: 0 };
    setUsers(prev => [...prev, userToAdd]);
    logActivity(`Added new user '${newUser.username}'.`, user?.username || "System", 'User');
  }, [users, logActivity, user, toast]);

  const updateUser = useCallback((updatedUser: User) => {
    setUsers(prev => prev.map(u => {
        if (u.id === updatedUser.id) {
            const newPassword = updatedUser.password ? updatedUser.password : u.password;
            const finalUser = { ...u, ...updatedUser, password: newPassword };
            logActivity(`Updated user '${finalUser.username}'.`, user?.username || "System", 'User');
            return finalUser;
        }
        return u;
    }));
  }, [logActivity, user]);

  const deleteUser = useCallback((id: string, username: string) => {
    if (initialUsers.some(initialUser => initialUser.id === id)) {
        toast({ variant: 'destructive', title: 'Error', description: "Cannot delete a default system user." });
        return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    logActivity(`Deleted user '${username}'.`, user?.username || "System", 'User');
  }, [logActivity, user, toast]);

  const updateUserBalance = useCallback((userId: string, amount: number, operation: 'add' | 'subtract') => {
      setUsers(prevUsers => prevUsers.map(u => {
          if (u.id === userId) {
              const currentBalance = u.balance || 0;
              const newBalance = operation === 'add' ? currentBalance + amount : currentBalance - amount;
              return { ...u, balance: newBalance };
          }
          return u;
      }));
  }, []);


  const value = { user, users, isLoading, login, logout, addUser, updateUser, deleteUser, updateUserBalance };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
