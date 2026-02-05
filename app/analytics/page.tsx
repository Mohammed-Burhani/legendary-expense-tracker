'use client';

import { useApp } from '@/lib/context';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useExpenses, useSites } from '@/lib/query/hooks';

const COLORS = ['#000000', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7', '#10b981', '#f43f5e'];

export default function AnalyticsPage() {
  const { user } = useApp();
  
  // Fetch expenses based on role: Admin sees all, Manager sees only their own
  const { data: expenses = [] } = useExpenses(user?.role === 'ADMIN' ? undefined : user?.id);
  const { data: sites = [] } = useSites();

  const visibleExpenses = expenses;

  // Category breakdown
  const expenseByCategory = visibleExpenses
    .filter(e => e.type === 'EXPENSE')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.entries(expenseByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Income vs Expense totals
  const totals = visibleExpenses.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + Number(curr.amount);
    return acc;
  }, { INCOME: 0, EXPENSE: 0 } as Record<string, number>);

  const totalData = [
    { name: 'Inward', value: totals.INCOME, fill: '#10b981' },
    { name: 'Outward', value: totals.EXPENSE, fill: '#f43f5e' }
  ];

  const balance = totals.INCOME - totals.EXPENSE;

  // Site performance (Admin only)
  const sitePerformance = sites.map(site => {
    const siteExp = expenses.filter(e => e.site_id === site.id && e.type === 'EXPENSE').reduce((a, c) => a + Number(c.amount), 0);
    const siteInc = expenses.filter(e => e.site_id === site.id && e.type === 'INCOME').reduce((a, c) => a + Number(c.amount), 0);
    return { 
      name: site.name.length > 15 ? site.name.substring(0, 15) + '...' : site.name, 
      Inward: siteInc, 
      Outward: siteExp,
      Balance: siteInc - siteExp
    };
  }).sort((a, b) => b.Balance - a.Balance);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-sm text-zinc-500 mt-1">
          {user?.role === 'ADMIN' ? 'Financial overview across all sites' : 'Your financial overview'}
        </p>
      </div>

      <Card className={`border-none shadow-lg ${balance >= 0 ? 'bg-linear-to-br from-emerald-500 to-emerald-600' : 'bg-linear-to-br from-rose-500 to-rose-600'}`}>
        <CardContent className="p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            {balance >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">Balance</span>
          </div>
          <p className="text-3xl font-bold mb-3">₹{Math.abs(balance).toFixed(2)}</p>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <p className="text-xs opacity-75">Total Inward</p>
              <p className="font-bold">₹{totals.INCOME}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-xs opacity-75">Total Outward</p>
              <p className="font-bold">₹{totals.EXPENSE}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Inward vs Outward</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={totalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip 
                  cursor={{ fill: '#f4f4f5' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {categoryData.length > 0 && (
          <Card className="bg-white border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Outward by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value) => `$${value}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-3">
                {categoryData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] font-bold text-zinc-600 uppercase">{entry.name}</span>
                    <span className="text-[10px] font-bold text-zinc-400">₹{entry.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {user?.role === 'ADMIN' && sitePerformance.length > 0 && (
          <Card className="bg-white border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">Site Performance</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sitePerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f4f4f5" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} width={100} />
                  <Tooltip 
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="Inward" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Outward" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
