'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { ArrowUpRight, ArrowDownRight, Search, Building2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useExpenses, useManagers, useSites, useLaborers, useDeleteExpense } from '@/lib/query/hooks';

export default function HistoryPage() {
  const { user } = useApp();
  
  // Fetch data based on user role
  // Admin: all expenses, Manager: only their expenses
  const { data: expenses = [] } = useExpenses(user?.role === 'ADMIN' ? undefined : user?.id);
  const { data: managers = [] } = useManagers();
  const { data: sites = [] } = useSites();
  const { data: laborers = [] } = useLaborers();
  const deleteExpenseMutation = useDeleteExpense();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [filterSite, setFilterSite] = useState<string>('ALL');

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user?.role === 'ADMIN' && managers.find(m => m.id === e.manager_id)?.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'ALL' || e.type === filterType;
    const matchesSite = filterSite === 'ALL' || e.site_id === filterSite;
    
    return matchesSearch && matchesType && matchesSite;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteExpenseMutation.mutateAsync(id);
        toast.success('Entry deleted successfully');
      } catch (error) {
        toast.error('Failed to delete entry');
        console.error(error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transaction History</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {user?.role === 'ADMIN' ? 'All transactions across sites' : 'Your transactions'}
          </p>
        </div>
        
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
          <Select value={filterType} onValueChange={(val) => setFilterType(val as 'ALL' | 'INCOME' | 'EXPENSE')}>
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
            <p className="text-zinc-300 text-sm mt-1">
              {searchTerm || filterType !== 'ALL' || filterSite !== 'ALL' 
                ? 'Try adjusting your filters' 
                : user?.role === 'ADMIN' 
                  ? 'No transactions yet' 
                  : 'Start adding expenses to see them here'}
            </p>
          </div>
        ) : (
          filteredExpenses.map((entry) => {
            const manager = managers.find(m => m.id === entry.manager_id);
            const site = sites.find(s => s.id === entry.site_id);
            const laborer = entry.laborer_id ? laborers.find(l => l.id === entry.laborer_id) : null;
            const entryDate = new Date(entry.date);
            const canDelete = user?.role === 'MANAGER' && entry.manager_id === user.id;
            
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
                      <p className="text-[10px] text-zinc-500 font-medium">
                        {entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`font-bold text-base ${entry.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {entry.type === 'INCOME' ? '+' : '-'}₹{entry.amount}
                  </p>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleteExpenseMutation.isPending}
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
