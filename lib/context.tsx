'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type Role = 'ADMIN' | 'MANAGER' | 'LABORER';

export interface User {
  id: string;
  name: string;
  role: Role;
  site_id?: string | null;
  manager_id?: string | null;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem('legendary_builders_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('legendary_builders_user', JSON.stringify(user));
    }
  }, [user]);

  const logout = () => {
    localStorage.removeItem('legendary_builders_user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AppContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
