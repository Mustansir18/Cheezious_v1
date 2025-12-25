
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, UserRole } from '@/lib/types';
import { useActivityLog } from './ActivityLogContext';

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  users: User[];
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  addUser: (username: string, password: string, role: UserRole, branchId?: string) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string, username: string) => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultBranchId = 'j3-johar-town-lahore';

// --- Hardcoded Default Users ---
const initialUsers: User[] = [
    {
        id: 'root-user',
        username: 'root',
        password: 'Faith123$$',
        role: 'root',
    },
    {
        id: 'admin-user',
        username: 'admin',
        password: 'admin',
        role: 'admin',
        branchId: defaultBranchId,
    },
    {
        id: 'cashier-user',
        username: 'cashier',
        password: 'cashier',
        role: 'cashier',
        branchId: defaultBranchId,
    }
];

const USERS_STORAGE_KEY = 'cheeziousUsers';
const SESSION_STORAGE_KEY = 'cheeziousSession';

// Create the provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(true);
  const { logActivity } = useActivityLog();
  const router = useRouter();

  // Load users from localStorage on initial render
  useEffect(() => {
    setIsLoading(true);
    try {
      const storedUsersJSON = localStorage.getItem(USERS_STORAGE_KEY);
      let loadedUsers: User[] = [];
      if (storedUsersJSON) {
        loadedUsers = JSON.parse(storedUsersJSON);
      }

      // Merge stored users with initial users, giving precedence to stored users but ensuring initial users exist
      const combinedUsers = [...initialUsers];
      loadedUsers.forEach(storedUser => {
          const index = combinedUsers.findIndex(u => u.id === storedUser.id);
          if (index !== -1) {
              // Update existing user, but keep the initial password for default users
              combinedUsers[index] = { ...storedUser, password: combinedUsers[index].password };
          } else {
              // Add new user from storage
              combinedUsers.push(storedUser);
          }
      });

      setUsers(combinedUsers);

      const sessionUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if(sessionUser) {
        setUser(JSON.parse(sessionUser));
      }
    } catch (error) {
      console.error("Failed to initialize auth state:", error);
      setUsers(initialUsers); // Reset to default if storage is corrupt
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist users to localStorage whenever they change
  useEffect(() => {
    if (isLoading) return;
    try {
        const usersToStore = users.map(u => {
            const { password, ...userToStore } = u;
            // Never store passwords in localStorage
            return userToStore;
        });
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersToStore));
    } catch (error) {
      console.error("Could not save users to local storage", error);
    }
  }, [users, isLoading]);
  
  // Persist current user to sessionStorage
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

  const login = useCallback(async (username: string, password: string): Promise<User | null> => {
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

  const addUser = useCallback((username: string, password: string, role: UserRole, branchId?: string) => {
    if (users.some(u => u.username === username)) {
      alert('Username already exists.');
      return;
    }
    const newUser: User = { id: crypto.randomUUID(), username, password, role, branchId };
    setUsers(prev => [...prev, newUser]);
  }, [users]);

  const updateUser = useCallback((updatedUser: User) => {
    setUsers(prev => prev.map(u => {
        if (u.id === updatedUser.id) {
            // Keep the old password if the new one is not provided
            const newPassword = updatedUser.password ? updatedUser.password : u.password;
            return { ...updatedUser, password: newPassword };
        }
        return u;
    }));
  }, []);

  const deleteUser = useCallback((id: string, username: string) => {
    const userToDelete = users.find(u => u.id === id);
    if (initialUsers.some(initialUser => initialUser.id === id)) {
        alert("Cannot delete a default system user.");
        return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
  }, [users]);

  const value = { user, users, isLoading, login, logout, addUser, updateUser, deleteUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
