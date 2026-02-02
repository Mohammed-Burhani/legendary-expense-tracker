'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Search, Building2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function HistoryPage() {
  const { user, expenses, managers, sites, laborers, deleteExpense } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [filterSite, setFilterSite] = useState<string>('ALL');
  
  const visibleExpenses = user?.role === 'ADMIN' 
    ? expenses 
    : expenses.filter(e => e.managerId === user?.id);

  let filteredExpenses = visibleExpenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user?.role === 'ADMIN' && managers.find(m => m.id === e.managerId)?.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'ALL' || e.type === filterType;
    const matchesSite = filterSite === 'ALL' || e.siteId === filterSite;
    
    return matchesSearch && matchesType && matchesSite;
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      deleteExpense(id);
      toast.success('Entry deleted successfully');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Transaction History</h2>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Search descriptions, categories..." 
            className="pl-10 bg-white border-zinc-200 h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Select value={filterType} onValueChange={(val) => setFilterType(val as any)}>
            <SelectTrigger className="flex-1 bg-white border-zinc-200 h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="INCOME">Income Only</SelectItem>
              <SelectItem value="EXPENSE">Expense Only</SelectItem>
            </SelectContent>
          </Select>

          {user?.role === 'ADMIN' && (
            <Select value={filterSite} onValueChange={setFilterSite}>
              <SelectTrigger className="flex-1 bg-white border-zinc-200 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sites</SelectItem>
                {sites.map(site => (
                  <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-zinc-400 font-medium">No transactions found</p>
            <p className="text-zinc-300 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filteredExpenses.map((entry) => {
            const manager = managers.find(m => m.id === entry.managerId);
            const site = sites.find(s => s.id === entry.siteId);
            const laborer = entry.laborerId ? laborers.find(l => l.id === entry.laborerId) : null;
            
            return (
              <div key={entry.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2.5 rounded-xl ${entry.type === 'INCOME' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    {entry.type === 'INCOME' ? <ArrowUpRight className="h-5 w-5 text-emerald-600" /> : <ArrowDownRight className="h-5 w-5 text-rose-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-zinc-900 text-sm">{entry.description}</p>
                      {user?.role === 'ADMIN' && site && (
                        <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded-full font-bold text-blue-700 uppercase flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {site.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-[10px] text-zinc-500 font-medium">{entry.category}</p>
                      {user?.role === 'ADMIN' && manager && (
                        <>
                          <span className="text-[10px] text-zinc-300">•</span>
                          <p className="text-[10px] text-zinc-500 font-medium">{manager.name}</p>
                        </>
                      )}
                      {laborer && (
                        <>
                          <span className="text-[10px] text-zinc-300">•</span>
                          <p className="text-[10px] text-zinc-500 font-medium">{laborer.name}</p>
                        </>
                      )}
                      <span className="text-[10px] text-zinc-300">•</span>
                      <p className="text-[10px] text-zinc-500 font-medium">{format(new Date(entry.date), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`font-bold text-base ${entry.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {entry.type === 'INCOME' ? '+' : '-'}${entry.amount}
                  </p>
                  {user?.role === 'MANAGER' && entry.managerId === user.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
