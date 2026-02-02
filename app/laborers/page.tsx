'use client';

import React from 'react';
import { useApp } from '@/lib/context';
import { Card, CardContent } from '@/components/ui/card';
import { Users, DollarSign, Calendar } from 'lucide-react';

export default function LaborersPage() {
  const { user, laborers, expenses, sites } = useApp();

  if (user?.role !== 'MANAGER') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-zinc-500 mt-2">Only managers can view laborers.</p>
      </div>
    );
  }

  const siteLaborers = laborers.filter(l => l.siteId === user.siteId);
  const userSite = sites.find(s => s.id === user.siteId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Laborers</h2>
        {userSite && <p className="text-sm text-zinc-500 mt-1">{userSite.name}</p>}
      </div>

      {siteLaborers.length === 0 ? (
        <div className="py-20 text-center">
          <Users className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">No laborers assigned yet</p>
          <p className="text-zinc-300 text-sm mt-1">Contact admin to assign laborers</p>
        </div>
      ) : (
        <div className="space-y-4">
          {siteLaborers.map(laborer => {
            const laborerExpenses = expenses.filter(e => e.laborerId === laborer.id);
            const totalPaid = laborerExpenses.reduce((acc, curr) => acc + curr.amount, 0);
            const lastPayment = laborerExpenses.length > 0 
              ? new Date(laborerExpenses[0].date).toLocaleDateString()
              : 'No payments yet';

            return (
              <Card key={laborer.id} className="border-zinc-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {laborer.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-zinc-900 text-lg">{laborer.name}</h3>
                      <p className="text-xs text-zinc-500 uppercase font-medium">Laborer</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-700 font-bold uppercase">Total Paid</p>
                        <p className="text-base font-bold text-emerald-900">${totalPaid}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-700 font-bold uppercase">Payments</p>
                        <p className="text-base font-bold text-blue-900">{laborerExpenses.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-100">
                    <p className="text-xs text-zinc-500">
                      Last payment: <span className="font-medium text-zinc-700">{lastPayment}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
