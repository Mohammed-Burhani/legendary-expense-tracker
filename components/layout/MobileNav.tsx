'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, BarChart2, List, Building2, Users, UserCog } from 'lucide-react';
import { useApp } from '@/lib/context';

export const MobileNav = () => {
  const pathname = usePathname();
  const { user } = useApp();

  const adminNavItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Sites', icon: Building2, href: '/sites' },
    { label: 'Managers', icon: UserCog, href: '/managers' },
    { label: 'History', icon: List, href: '/history' },
    { label: 'Stats', icon: BarChart2, href: '/analytics' },
  ];

  const managerNavItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Add', icon: PlusCircle, href: '/add' },
    { label: 'History', icon: List, href: '/history' },
    { label: 'Stats', icon: BarChart2, href: '/analytics' },
  ];

  const navItems = user?.role === 'ADMIN' ? adminNavItems : managerNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white pb-safe pt-2 shadow-lg">
      <div className="flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 transition-colors rounded-lg ${
                isActive ? 'text-zinc-950 bg-zinc-100' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? 'fill-zinc-950/10' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
