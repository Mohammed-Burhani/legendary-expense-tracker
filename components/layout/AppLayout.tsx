'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { isLoading } = useApp();
  const isLoginPage = pathname === '/login';

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-950 pb-20">
      <Navbar />
      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
        {children}
      </main>
      <MobileNav />
    </div>
  );
};
