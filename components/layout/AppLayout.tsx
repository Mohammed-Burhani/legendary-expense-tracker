'use client';

import React from 'react';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
