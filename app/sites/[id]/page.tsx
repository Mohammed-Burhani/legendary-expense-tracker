'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSites, useExpenses, useLaborers, useManagers } from '@/lib/query/hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, X, Users, Building2, Wallet } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';

export default function SiteDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.id as string;

  const { data: sites = [] } = useSites();
  const { data: allExpenses = [] } = useExpenses();
  const { data: laborers = [] } = useLaborers();
  const { data: managers = [] } = useManagers();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const site = sites.find(s => s.id === siteId);
  const manager = site ? managers.find(m => m.id === site.manager_id) : null;
  const siteLaborers = laborers.filter(l => l.site_id === siteId);

  // Filter expenses by site and date range
  const filteredExpenses = useMemo(() => {
    let expenses = allExpenses.filter(e => e.site_id === siteId);

    if (startDate) {
      expenses = expenses.filter(e => e.date >= startDate);
    }
    if (endDate) {
      expenses = expenses.filter(e => e.date <= endDate);
    }

    return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allExpenses, siteId, startDate, endDate]);

  const stats = useMemo(() => {
    const income = filteredExpenses
      .filter(e => e.type === 'INCOME')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    const expense = filteredExpenses
      .filter(e => e.type === 'EXPENSE')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
    return { income, expense, net: income - expense };
  }, [filteredExpenses]);

  if (!site) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-zinc-500">Site not found</p>
      </div>
    );
  }

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9 rounded-full hover:bg-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-zinc-900">{site.name}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{site.location}</p>
        </div>
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
          site.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
          site.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          {site.status}
        </span>
      </div>

      {/* Site Info Card */}
      <Card className="border-zinc-200 bg-gradient-to-br from-zinc-50 to-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-zinc-700">
              <Users className="h-4 w-4 text-zinc-500" />
              <span className="text-sm font-medium">{siteLaborers.length} Laborers</span>
            </div>
            {manager && (
              <>
                <div className="w-px h-4 bg-zinc-300" />
                <div className="flex items-center gap-2 text-zinc-700">
                  <Building2 className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm font-medium">{manager.name}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-none bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Inward</span>
              <TrendingUp className="h-3.5 w-3.5 opacity-80" />
            </div>
            <p className="text-xl font-bold">₹{stats.income.toLocaleString()}</p>
          </CardContent>
        </Card>
        
        <Card className="border-none bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Outward</span>
              <TrendingDown className="h-3.5 w-3.5 opacity-80" />
            </div>
            <p className="text-xl font-bold">₹{stats.expense.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className={`border-none ${stats.net >= 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20' : 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/20'} text-white shadow-lg`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Balance</span>
              <Wallet className="h-3.5 w-3.5 opacity-80" />
            </div>
            <p className="text-xl font-bold">₹{Math.abs(stats.net).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <Card className="border-zinc-200">
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                <span className="text-xs font-semibold text-zinc-700">Date Range</span>
              </div>
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 px-2 text-xs text-zinc-600 hover:text-zinc-900"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start date"
                className="h-9 text-xs"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End date"
                className="h-9 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-zinc-900">
            Transactions
          </h3>
          <span className="text-xs font-medium text-zinc-500">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        
        {filteredExpenses.length === 0 ? (
          <Card className="border-dashed border-2 border-zinc-200 bg-zinc-50/50">
            <CardContent className="py-10 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 mb-3">
                <Calendar className="h-6 w-6 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-600">No transactions found</p>
              <p className="text-xs text-zinc-400 mt-1">
                {startDate || endDate ? 'Try adjusting your filters' : 'No entries for this site yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {filteredExpenses.map((entry) => {
              const laborer = entry.laborer_id ? laborers.find(l => l.id === entry.laborer_id) : null;
              const entryDate = new Date(entry.date);
              
              return (
                <Card key={entry.id} className="border-zinc-200 hover:border-zinc-300 transition-all hover:shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                        entry.type === 'INCOME' 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'bg-rose-100 text-rose-600'
                      }`}>
                        {entry.type === 'INCOME' ? 
                          <TrendingUp className="h-4 w-4" /> : 
                          <TrendingDown className="h-4 w-4" />
                        }
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-zinc-900 truncate">{entry.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-500">
                          <span className="font-medium">{entry.category}</span>
                          {laborer && (
                            <>
                              <span>•</span>
                              <span className="truncate">{laborer.name}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>
                            {entryDate.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`flex-shrink-0 font-bold text-base ${
                        entry.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {entry.type === 'INCOME' ? '+' : '-'}₹{Number(entry.amount).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
