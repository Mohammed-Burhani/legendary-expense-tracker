import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';
import { queryKeys } from './keys';
import type { Database } from '../supabase/types';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type Site = Database['public']['Tables']['sites']['Row'];
type SiteInsert = Database['public']['Tables']['sites']['Insert'];
type SiteUpdate = Database['public']['Tables']['sites']['Update'];
type Expense = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type Carryforward = Database['public']['Tables']['carryforwards']['Row'];

// Users Queries
export function useManagers() {
  return useQuery({
    queryKey: queryKeys.users.managers,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['ADMIN', 'MANAGER'])
        .order('name');
      
      if (error) throw error;
      return data as User[];
    },
  });
}

export function useLaborers(siteId?: string) {
  return useQuery({
    queryKey: queryKeys.users.laborers(siteId),
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('*')
        .eq('role', 'LABORER')
        .order('name');
      
      if (siteId) {
        query = query.eq('site_id', siteId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as User[];
    },
    enabled: !!siteId || siteId === undefined,
  });
}

// User Mutations
export function useAddManager() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (manager: { name: string }) => {
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: manager.name,
          role: 'MANAGER',
          site_id: null,
          manager_id: null,
        } as UserInsert)
        .select()
        .single();
      
      if (error) throw error;
      return data as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.managers });
    },
  });
}

// Sites Queries
export function useSites() {
  return useQuery({
    queryKey: queryKeys.sites.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Site[];
    },
  });
}

export function useSite(id?: string) {
  return useQuery({
    queryKey: queryKeys.sites.byId(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('id', id!)
        .single();
      
      if (error) throw error;
      return data as Site;
    },
    enabled: !!id,
  });
}

// Site Mutations
export function useAddSite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (site: SiteInsert) => {
      const { data, error } = await supabase
        .from('sites')
        .insert(site)
        .select()
        .single();
      
      if (error) throw error;
      return data as Site;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
    },
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: SiteUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('sites')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Site;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sites.byId(data.id) });
    },
  });
}

// Expenses Queries
export function useExpenses(managerId?: string) {
  return useQuery({
    queryKey: managerId ? queryKeys.expenses.byManager(managerId) : queryKeys.expenses.all,
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (managerId) {
        query = query.eq('manager_id', managerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
  });
}

export function useTodayExpenses(managerId?: string) {
  return useQuery({
    queryKey: queryKeys.expenses.today(managerId),
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('date', today)
        .order('created_at', { ascending: false });
      
      if (managerId) {
        query = query.eq('manager_id', managerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
  });
}

// Expense Mutations
export function useAddExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (expense: ExpenseInsert) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single();
      
      if (error) throw error;
      return data as Expense;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.byManager(data.manager_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.today(data.manager_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.today() });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      // Invalidate all expense queries
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
  });
}

// Carryforward Queries
export function usePendingCarryforward(siteId?: string, date?: string) {
  return useQuery({
    queryKey: queryKeys.carryforwards.pending(siteId, date),
    queryFn: async () => {
      if (!siteId || !date) return null;
      
      const { data, error } = await supabase
        .rpc('get_pending_carryforward', {
          p_site_id: siteId,
          p_date: date,
        });
      
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!siteId && !!date,
  });
}

export function useCarryforwardHistory(siteId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.carryforwards.history(siteId, startDate, endDate),
    queryFn: async () => {
      if (!siteId) return [];
      
      const { data, error } = await supabase
        .rpc('get_carryforward_history', {
          p_site_id: siteId,
          p_start_date: startDate || null,
          p_end_date: endDate || null,
        });
      
      if (error) throw error;
      return data as Carryforward[];
    },
    enabled: !!siteId,
  });
}

export function useAllCarryforwards() {
  return useQuery({
    queryKey: queryKeys.carryforwards.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('carryforwards')
        .select('*')
        .order('from_date', { ascending: false });
      
      if (error) throw error;
      return data as Carryforward[];
    },
  });
}

// Carryforward Mutations
export function useCreateCarryforward() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ siteId, date }: { siteId: string; date: string }) => {
      const { data, error } = await supabase
        .rpc('create_carryforward', {
          p_site_id: siteId,
          p_date: date,
        });
      
      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.carryforwards.all });
    },
  });
}
