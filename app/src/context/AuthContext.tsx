
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

  // Load users and session on initial render
  useEffect(() => {
    setIsLoading(true);
    try {
      // 1. Get stored users (without passwords)
      const storedUsersJSON = localStorage.getItem(USERS_STORAGE_KEY);
      const storedUsers: Omit<User, 'password'>[] = storedUsersJSON ? JSON.parse(storedUsersJSON) : [];
      
      // 2. Create a map of users, prioritizing hardcoded users to preserve their passwords.
      const userMap = new Map<string, User>();
      initialUsers.forEach(u => userMap.set(u.id, { ...u }));
      
      // 3. Add/update users from storage.
      storedUsers.forEach(storedUser => {
          const existingUser = userMap.get(storedUser.id);
          if (existingUser) {
              // If it's a default user, merge stored data but keep the hardcoded password.
              userMap.set(storedUser.id, { ...existingUser, ...storedUser });
          } else {
              // It's a non-default user created by an admin. Add them without a password.
              // Note: The login logic relies on the live `users` state which *does* have the password when created.
              userMap.set(storedUser.id, storedUser as User);
          }
      });
      
      const combinedUsers = Array.from(userMap.values());
      setUsers(combinedUsers);
      
      // 4. Restore session user
      const sessionUserJSON = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionUserJSON) {
        const sessionUser = JSON.parse(sessionUserJSON);
        // Verify the session user still exists and is valid in our combined list.
        const validUser = combinedUsers.find(u => u.id === sessionUser.id);
        if (validUser) {
            // IMPORTANT: Use the user object from our authoritative `combinedUsers` list,
            // which guarantees the correct password and role information.
            setUser(validUser);
        } else {
            // The user in the session is no longer valid, so clear it.
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }

    } catch (error) {
      console.error("Failed to initialize auth state:", error);
      setUsers(initialUsers); // Reset to default if storage is corrupt
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist users (without passwords) to localStorage whenever they change
  useEffect(() => {
    if (isLoading) return;
    try {
        const usersToStore = users.map(({ password, ...userToStore }) => userToStore);
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
    // The `users` state is now authoritative and correctly constructed.
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
    logActivity(`Added new user '${username}'.`, user?.username || "System", 'User');
  }, [users, logActivity, user]);

  const updateUser = useCallback((updatedUser: User) => {
    setUsers(prev => prev.map(u => {
        if (u.id === updatedUser.id) {
            // Keep the old password if a new one is not provided.
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
        alert("Cannot delete a default system user.");
        return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    logActivity(`Deleted user '${username}'.`, user?.username || "System", 'User');
  }, [logActivity, user]);

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
