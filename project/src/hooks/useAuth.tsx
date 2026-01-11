import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

// Simple context to satisfy main.tsx requirement, though with Zustand we can use the store directly.
// This Provider can be used for auth checks on mount.

const AuthContext = createContext<{ isAuthenticated: boolean } | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check initial session or validate token here if needed
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const diff = useAuthStore();
  return { ...diff };
};