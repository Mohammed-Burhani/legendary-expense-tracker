'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from './supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

type Role = 'ADMIN' | 'MANAGER' | 'LABORER';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  site_id?: string | null;
  manager_id?: string | null;
  auth_id?: string;
}

interface AppContextType {
  user: User | null;
  logout: () => Promise<void>;
  isLoading: boolean;
  authUser: SupabaseUser | null;
  currentSiteId: string | null;
  setCurrentSiteId: (siteId: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSiteId, setCurrentSiteId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Load user from Supabase Auth on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setAuthUser(session.user);

          // Fetch user profile from users table
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching user profile:', error);
          } else if (profile) {
            setUser(profile as User);
            // Set initial site for managers
            if (profile.role === 'MANAGER' && profile.site_id) {
              setCurrentSiteId(profile.site_id);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Remove async from here - handle async operations inside
        if (event === 'SIGNED_IN' && session?.user) {
          setAuthUser(session.user);

          // Fetch user profile without blocking
          supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single()
            .then(({ data: profile }) => {
              if (profile) {
                setUser(profile as User);
                // Set initial site for managers
                if (profile.role === 'MANAGER' && profile.site_id) {
                  setCurrentSiteId(profile.site_id);
                }
              }
            })
            
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null);
          setUser(null);
          setCurrentSiteId(null);
        }
      }
    );

    // Handle tab visibility changes - refresh session when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Don't use async here either
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            setAuthUser(session.user);

            // Re-fetch user profile to ensure fresh data
            supabase
              .from('users')
              .select('*')
              .eq('auth_id', session.user.id)
              .single()
              .then(({ data: profile }) => {
                if (profile) {
                  setUser(profile as User);
                  // Set initial site for managers
                  if (profile.role === 'MANAGER' && profile.site_id) {
                    setCurrentSiteId(profile.site_id);
                  }
                }
              })
          } else {
            // Session expired, clear user
            setAuthUser(null);
            setUser(null);
            setCurrentSiteId(null);
          }
        }).catch(error => console.error('Error getting session:', error));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAuthUser(null);
    setCurrentSiteId(null);
    router.push('/login');
  };

  return (
    <AppContext.Provider value={{ user, logout, isLoading, authUser, currentSiteId, setCurrentSiteId }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
