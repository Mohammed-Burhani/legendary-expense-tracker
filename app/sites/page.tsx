'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, TrendingUp, MapPin } from 'lucide-react';

export default function SitesPage() {
  const { user, sites, managers, expenses, laborers } = useApp();

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-zinc-500 mt-2">Only admins can view all sites.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">All Sites</h2>
        <p className="text-sm text-zinc-500 mt-1">Manage construction sites and assignments</p>
      </div>

      <div className="space-y-4">
        {sites.map(site => {
          const manager = managers.find(m => m.id === site.managerId);
          const siteExpenses = expenses.filter(e => e.siteId === site.id);
          const siteIncome = siteExpenses.filter(e => e.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
          const siteExpense = siteExpenses.filter(e => e.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
          const siteLaborers = laborers.filter(l => l.siteId === site.id);
          const profit = siteIncome - siteExpense;

          return (
            <Card key={site.id} className="border-zinc-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-5 w-5 text-zinc-600" />
                      <h3 className="font-bold text-zinc-900 text-lg">{site.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <MapPin className="h-3.5 w-3.5" />
                      <p className="text-sm">{site.location}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                    site.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    site.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {site.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-100">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-zinc-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{manager?.name}</p>
                    <p className="text-xs text-zinc-500">{siteLaborers.length} laborers assigned</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Income</p>
                    <p className="text-lg font-bold text-emerald-600">${siteIncome}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Expense</p>
                    <p className="text-lg font-bold text-rose-600">${siteExpense}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Profit
                    </p>
                    <p className={`text-lg font-bold ${profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                      ${Math.abs(profit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
