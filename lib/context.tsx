'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'ADMIN' | 'MANAGER' | 'LABORER';

interface User {
  id: string;
  name: string;
  role: Role;
  siteId?: string;
  managerId?: string;
}

interface Site {
  id: string;
  name: string;
  location: string;
  managerId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  managerId: string;
  siteId: string;
  type: 'EXPENSE' | 'INCOME';
  laborerId?: string;
  createdAt: string;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  managers: User[];
  laborers: User[];
  sites: Site[];
  addSite: (site: Omit<Site, 'id'>) => void;
  addLaborer: (laborer: Omit<User, 'id' | 'role'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [laborers, setLaborers] = useState<User[]>([]);
  
  const managers: User[] = [
    { id: '1', name: 'John Doe', role: 'MANAGER', siteId: 'site1' },
    { id: '2', name: 'Jane Smith', role: 'MANAGER', siteId: 'site2' },
    { id: '3', name: 'Mike Johnson', role: 'MANAGER', siteId: 'site3' },
    { id: 'admin', name: 'Admin', role: 'ADMIN' },
  ];

  // Initialize with mock data
  useEffect(() => {
    const savedExpenses = localStorage.getItem('legendary_builders_expenses');
    const savedSites = localStorage.getItem('legendary_builders_sites');
    const savedLaborers = localStorage.getItem('legendary_builders_laborers');
    
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    } else {
      const today = new Date().toISOString();
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      
      const mockExpenses: Expense[] = [
        { id: 'e1', amount: 1500, description: 'Cement - 50 bags', category: 'Materials', date: today, managerId: '1', siteId: 'site1', type: 'EXPENSE', createdAt: today },
        { id: 'e2', amount: 800, description: 'Daily wages - 4 laborers', category: 'Labor', date: today, managerId: '1', siteId: 'site1', type: 'EXPENSE', laborerId: 'l1', createdAt: today },
        { id: 'e3', amount: 5000, description: 'Client advance payment', category: 'Payment', date: today, managerId: '1', siteId: 'site1', type: 'INCOME', createdAt: today },
        { id: 'e4', amount: 2200, description: 'Steel rods - 100kg', category: 'Materials', date: yesterday, managerId: '2', siteId: 'site2', type: 'EXPENSE', createdAt: yesterday },
        { id: 'e5', amount: 600, description: 'Daily wages - 3 laborers', category: 'Labor', date: yesterday, managerId: '2', siteId: 'site2', type: 'EXPENSE', laborerId: 'l2', createdAt: yesterday },
        { id: 'e6', amount: 3500, description: 'Client payment', category: 'Payment', date: yesterday, managerId: '2', siteId: 'site2', type: 'INCOME', createdAt: yesterday },
      ];
      setExpenses(mockExpenses);
    }

    if (savedSites) {
      setSites(JSON.parse(savedSites));
    } else {
      const mockSites: Site[] = [
        { id: 'site1', name: 'Downtown Plaza', location: 'Main Street, Downtown', managerId: '1', status: 'ACTIVE' },
        { id: 'site2', name: 'Riverside Apartments', location: 'River Road, East Side', managerId: '2', status: 'ACTIVE' },
        { id: 'site3', name: 'Industrial Complex', location: 'Highway 101, North', managerId: '3', status: 'ACTIVE' },
      ];
      setSites(mockSites);
    }

    if (savedLaborers) {
      setLaborers(JSON.parse(savedLaborers));
    } else {
      const mockLaborers: User[] = [
        { id: 'l1', name: 'Raj Kumar', role: 'LABORER', managerId: '1', siteId: 'site1' },
        { id: 'l2', name: 'Amit Singh', role: 'LABORER', managerId: '1', siteId: 'site1' },
        { id: 'l3', name: 'Suresh Patel', role: 'LABORER', managerId: '2', siteId: 'site2' },
        { id: 'l4', name: 'Vijay Sharma', role: 'LABORER', managerId: '2', siteId: 'site2' },
      ];
      setLaborers(mockLaborers);
    }
    
    const savedUser = localStorage.getItem('legendary_builders_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser(managers[0]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('legendary_builders_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('legendary_builders_sites', JSON.stringify(sites));
  }, [sites]);

  useEffect(() => {
    localStorage.setItem('legendary_builders_laborers', JSON.stringify(laborers));
  }, [laborers]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('legendary_builders_user', JSON.stringify(user));
    }
  }, [user]);

  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense = { 
      ...expense, 
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addSite = (site: Omit<Site, 'id'>) => {
    const newSite = { ...site, id: Math.random().toString(36).substr(2, 9) };
    setSites(prev => [...prev, newSite]);
  };

  const addLaborer = (laborer: Omit<User, 'id' | 'role'>) => {
    const newLaborer = { 
      ...laborer, 
      id: Math.random().toString(36).substr(2, 9),
      role: 'LABORER' as Role
    };
    setLaborers(prev => [...prev, newLaborer]);
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      setUser, 
      expenses, 
      addExpense, 
      deleteExpense,
      managers, 
      laborers,
      sites,
      addSite,
      addLaborer
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
