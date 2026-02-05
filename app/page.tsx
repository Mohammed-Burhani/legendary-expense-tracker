'use client';

import { useApp } from '@/lib/context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowUpRight, ArrowDownRight, Users, Wallet, Building2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useExpenses, useTodayExpenses, useSites, useLaborers, useManagers } from '@/lib/query/hooks';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user } = useApp();
  
  const { data: allExpenses = [] } = useExpenses();
  const { data: todayExpenses = [] } = useTodayExpenses();
  const { data: sites = [] } = useSites();
  const { data: laborers = [] } = useLaborers();
  const { data: managers = [] } = useManagers();

  const todayEntries = todayExpenses;
  
  const userSite = sites.find(s => s.id === user?.site_id);
  const managerEntries = todayEntries.filter(e => e.manager_id === user?.id);

  const adminStats = {
    inward: todayEntries.filter(e => e.type === 'INCOME' && e.category !== 'Carryforward').reduce((acc, curr) => acc + Number(curr.amount), 0),
    carryforward: todayEntries.filter(e => e.type === 'INCOME' && e.category === 'Carryforward').reduce((acc, curr) => acc + Number(curr.amount), 0),
    outward: todayEntries.filter(e => e.type === 'EXPENSE').reduce((acc, curr) => acc + Number(curr.amount), 0),
  };

  if (user?.role === 'ADMIN') {
    const activeSites = sites.filter(s => s.status === 'ACTIVE');
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
            <p className="text-sm text-zinc-500 mt-1">Overview of all sites and managers</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-linear-to-br from-emerald-500 to-emerald-600 border-none shadow-md">
            <CardContent className="p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-white/90" />
                <span className="text-[10px] font-bold text-white/90 uppercase tracking-wide">Today Inward</span>
              </div>
              <p className="text-2xl font-bold text-white leading-none">₹{adminStats.inward}</p>
              <p className="text-[10px] text-white/70 mt-1">Daily inward amount</p>
            </CardContent>
          </Card>
          
          <Card className="bg-linear-to-br from-blue-500 to-blue-600 border-none shadow-md">
            <CardContent className="p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet className="h-3.5 w-3.5 text-white/90" />
                <span className="text-[10px] font-bold text-white/90 uppercase tracking-wide">Carryforward</span>
              </div>
              <p className="text-2xl font-bold text-white leading-none">₹{adminStats.carryforward}</p>
              <p className="text-[10px] text-white/70 mt-1">Carried forward</p>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-rose-500 to-rose-600 border-none shadow-md">
            <CardContent className="p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowDownRight className="h-3.5 w-3.5 text-white/90" />
                <span className="text-[10px] font-bold text-white/90 uppercase tracking-wide">Today Outward</span>
              </div>
              <p className="text-2xl font-bold text-white leading-none">₹{adminStats.outward}</p>
              <p className="text-[10px] text-white/70 mt-1">Daily outward amount</p>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-purple-500 to-purple-600 border-none shadow-md">
            <CardContent className="p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Building2 className="h-3.5 w-3.5 text-white/90" />
                <span className="text-[10px] font-bold text-white/90 uppercase tracking-wide">Sites</span>
              </div>
              <p className="text-2xl font-bold text-white leading-none">{activeSites.length}</p>
              <p className="text-[10px] text-white/70 mt-1">Active sites</p>
            </CardContent>
          </Card>
        </div>

        <Link href="/add" className="block">
          <Button className="w-full h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center gap-2 group transition-all active:scale-95">
            <PlusCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="font-bold">Add Inward</span>
          </Button>
        </Link>

        <div className="flex gap-3">
          <Link href="/carryforward" className="flex-1">
            <Button variant="outline" className="w-full h-12 rounded-xl border-2 border-zinc-200 hover:bg-zinc-50 flex items-center justify-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="font-bold text-sm">Carryforward History</span>
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Sites & Managers
            </h3>
            <div className="flex gap-2">
              <Link href="/managers" className="text-xs font-bold text-purple-600 uppercase hover:text-purple-700">
                Managers
              </Link>
              <span className="text-zinc-300">•</span>
              <Link href="/sites" className="text-xs font-bold text-blue-600 uppercase hover:text-blue-700">
                Sites
              </Link>
            </div>
          </div>
          
          <div className="flex flex-col gap-y-4">
            {sites.map(site => {
              const manager = managers.find(m => m.id === site.manager_id);
              const siteExpenses = allExpenses.filter(e => e.site_id === site.id);
              const todaySiteExpenses = todayEntries.filter(e => e.site_id === site.id);
              
              // Today's inward (excluding carryforward)
              const todayInward = todaySiteExpenses
                .filter(e => e.type === 'INCOME' && e.category !== 'Carryforward')
                .reduce((acc, curr) => acc + Number(curr.amount), 0);
              
              // Today's outward
              const todayOutward = todaySiteExpenses
                .filter(e => e.type === 'EXPENSE')
                .reduce((acc, curr) => acc + Number(curr.amount), 0);
              
              // Today's balance
              const todayBalance = todayInward - todayOutward;
              
              // Total stats
              const siteIncome = siteExpenses.filter(e => e.type === 'INCOME').reduce((acc, curr) => acc + Number(curr.amount), 0);
              const siteExpense = siteExpenses.filter(e => e.type === 'EXPENSE').reduce((acc, curr) => acc + Number(curr.amount), 0);
              const totalBalance = siteIncome - siteExpense;
              
              const siteLaborers = laborers.filter(l => l.site_id === site.id);
              const todaySiteEntries = todaySiteExpenses.length;

              return (
                <Link key={site.id} href={`/sites/${site.id}`}>
                  <Card className="border-zinc-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-zinc-900 text-base">{site.name}</h4>
                          <p className="text-xs text-zinc-500 mt-0.5">{site.location}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                          site.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          site.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {site.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-100">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-zinc-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900">{manager?.name}</p>
                          <p className="text-[10px] text-zinc-500">{siteLaborers.length} laborers</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Today Inward</p>
                          <p className="text-sm font-bold text-emerald-600">₹{todayInward}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Today Outward</p>
                          <p className="text-sm font-bold text-rose-600">₹{todayOutward}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Today Balance</p>
                          <p className={`text-sm font-bold ${todayBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            ₹{Math.abs(todayBalance)}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-zinc-100">
                        <div className="flex items-center justify-between text-[10px]">
                          <div>
                            <span className="text-zinc-400 font-medium">Total Balance: </span>
                            <span className={`font-bold ${totalBalance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                              ₹{Math.abs(totalBalance)}
                            </span>
                          </div>
                          <div className="text-zinc-400">
                            {todaySiteEntries} entries today
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const siteLaborers = laborers.filter(l => l.site_id === user?.site_id);
  
  // Get today's income (daily budget) for this site
  const todayIncomeEntries = todayExpenses.filter(
    e => e.type === 'INCOME' && e.site_id === user?.site_id
  );
  
  // Separate daily budget from carryforward
  const dailyBudgetEntry = todayIncomeEntries.find(e => e.category === 'Daily Budget');
  const carryforwardEntry = todayIncomeEntries.find(e => e.category === 'Carryforward');
  
  const dailyBudget = dailyBudgetEntry ? Number(dailyBudgetEntry.amount) : 0;
  const carryforwardBalance = carryforwardEntry ? Number(carryforwardEntry.amount) : 0;
  const totalAvailable = dailyBudget + carryforwardBalance;
  
  // Calculate today's expenses
  const todayExpense = managerEntries
    .filter(e => e.type === 'EXPENSE')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  const remaining = totalAvailable - todayExpense;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manager Dashboard</h2>
          {userSite && <p className="text-sm text-zinc-500 mt-1">{userSite.name}</p>}
        </div>
      </div>

      {userSite && (
        <Card className="bg-linear-to-br from-zinc-900 to-zinc-800 text-white border-none shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Building2 className="h-24 w-24" />
          </div>
          <CardContent className="p-5 relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-zinc-400" />
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Site Information</p>
            </div>
            <h3 className="text-xl font-bold mb-1">{userSite.name}</h3>
            <p className="text-sm text-zinc-400 mb-4">{userSite.location}</p>
            
            <div className="flex items-center gap-4 pt-3 border-t border-zinc-700">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-medium">{siteLaborers.length} Laborers</span>
              </div>
              <div className="w-px h-4 bg-zinc-700" />
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${userSite.status === 'ACTIVE' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <span className="text-sm font-medium">{userSite.status}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
          <CardContent className="p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Inward</span>
            </div>
            <p className="text-2xl font-bold text-emerald-900 leading-none">₹{dailyBudget}</p>
            <p className="text-[10px] text-emerald-600 mt-1">
              {dailyBudgetEntry ? 'Today\'s inward' : 'Not set yet'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-100 shadow-sm">
          <CardContent className="p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Balance</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 leading-none">₹{carryforwardBalance}</p>
            <p className="text-[10px] text-blue-600 mt-1">
              {carryforwardEntry ? 'Carried forward' : 'No carryforward'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 border-rose-100 shadow-sm">
          <CardContent className="p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wide">Outward</span>
            </div>
            <p className="text-2xl font-bold text-rose-900 leading-none">₹{todayExpense}</p>
            <p className="text-[10px] text-rose-600 mt-1">
              {managerEntries.filter(e => e.type === 'EXPENSE').length} entries
            </p>
          </CardContent>
        </Card>

        <Card className={`${remaining >= 0 ? 'bg-purple-50 border-purple-100' : 'bg-orange-50 border-orange-100'} shadow-sm`}>
          <CardContent className="p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className={`h-3.5 w-3.5 ${remaining >= 0 ? 'text-purple-600' : 'text-orange-600'}`} />
              <span className={`text-[10px] font-bold ${remaining >= 0 ? 'text-purple-700' : 'text-orange-700'} uppercase tracking-wide`}>
                {remaining >= 0 ? 'Balance' : 'Deficit'}
              </span>
            </div>
            <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-purple-900' : 'text-orange-900'} leading-none`}>
              ₹{Math.abs(remaining).toFixed(2)}
            </p>
            <p className={`text-[10px] ${remaining >= 0 ? 'text-purple-600' : 'text-orange-600'} mt-1`}>
              {totalAvailable === 0 ? 'Waiting for inward' : remaining >= 0 ? 'Available' : 'Over spent'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Link href="/add" className="flex-1">
          <Button className="w-full h-14 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white shadow-lg flex items-center justify-center gap-2 group transition-all active:scale-95">
            <PlusCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="font-bold">Add Outward</span>
          </Button>
        </Link>
        <Link href="/laborers">
          <Button className="h-14 rounded-xl bg-white border-2 border-zinc-200 text-zinc-950 hover:bg-zinc-50 shadow-sm px-6">
            <Users className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Today&apos;s Activity</h3>
          <Link href="/history" className="text-xs font-bold text-blue-600 uppercase hover:text-blue-700">View All</Link>
        </div>
        
        <div className="space-y-3">
          {managerEntries.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-zinc-200">
              <Wallet className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">No entries for today yet</p>
              <p className="text-zinc-300 text-xs mt-1">Start tracking your site outwards</p>
            </div>
          ) : (
            managerEntries.slice(0, 5).map((entry) => {
              const laborer = entry.laborer_id ? laborers.find(l => l.id === entry.laborer_id) : null;
              
              return (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${entry.type === 'INCOME' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                      {entry.type === 'INCOME' ? <ArrowUpRight className="h-5 w-5 text-emerald-600" /> : <ArrowDownRight className="h-5 w-5 text-rose-600" />}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 text-sm">{entry.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-zinc-500 font-medium">{entry.category}</p>
                        {laborer && (
                          <>
                            <span className="text-[10px] text-zinc-300">•</span>
                            <p className="text-[10px] text-zinc-500 font-medium">{laborer.name}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className={`font-bold text-base ${entry.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {entry.type === 'INCOME' ? '+' : '-'}₹{entry.amount}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
