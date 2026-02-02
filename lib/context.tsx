'use client';

import { createContext, useContext, useState, useEffect } from 'react';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('legendary_builders_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Default to first manager
      setUser({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'John Doe',
        role: 'MANAGER',
        site_id: '00000000-0000-0000-0000-000000000011',
        manager_id: null,
      });
    }
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('legendary_builders_user', JSON.stringify(user));
    }
  }, [user]);

  return (
    <AppContext.Provider value={{ user, setUser }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
