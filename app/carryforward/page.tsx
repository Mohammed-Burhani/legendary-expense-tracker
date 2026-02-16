'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { ArrowRight, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllCarryforwards, useCarryforwardHistory, useSites } from '@/lib/query/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatINR } from '@/lib/format';

export default function CarryforwardPage() {
  const { user } = useApp();
  const { data: sites = [] } = useSites();
  const { data: allCarryforwards = [] } = useAllCarryforwards();
  
  const [selectedSite, setSelectedSite] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const { data: filteredCarryforwards = [] } = useCarryforwardHistory(
    selectedSite !== 'ALL' ? selectedSite : undefined,
    startDate || undefined,
    endDate || undefined
  );

  const isAdmin = user?.role === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-zinc-500 mt-2">Only admins can view carryforward history.</p>
      </div>
    );
  }

  const displayCarryforwards = selectedSite === 'ALL' ? allCarryforwards : filteredCarryforwards;

  // Calculate total carryforward amount
  const totalCarryforward = displayCarryforwards.reduce((sum, cf) => sum + Number(cf.amount), 0);

  // Group by month for summary
  const monthlyCarryforwards = displayCarryforwards.reduce((acc, cf) => {
    const month = new Date(cf.from_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!acc[month]) {
      acc[month] = { count: 0, total: 0 };
    }
    acc[month].count++;
    acc[month].total += Number(cf.amount);
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Carryforward History</h2>
        <p className="text-sm text-zinc-500 mt-1">Track daily income carryforwards across sites</p>
      </div>

      {/* Summary Card */}
      <Card className={`border-none shadow-lg ${totalCarryforward >= 0 ? 'bg-linear-to-br from-blue-500 to-blue-600' : 'bg-linear-to-br from-orange-500 to-orange-600'}`}>
        <CardContent className="p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">
              {totalCarryforward >= 0 ? 'Total Surplus' : 'Total Deficit'}
            </span>
          </div>
          <p className="text-3xl font-bold mb-3">{formatINR(Math.abs(totalCarryforward))}</p>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <p className="text-xs opacity-75">Total Records</p>
              <p className="font-bold">{displayCarryforwards.length}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <p className="text-xs opacity-75">Sites Tracked</p>
              <p className="font-bold">{selectedSite === 'ALL' ? sites.length : 1}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-white border-zinc-200 shadow-sm">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold">Site</Label>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger className="bg-zinc-50 border-zinc-200 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sites</SelectItem>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-zinc-50 border-zinc-200 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-zinc-50 border-zinc-200 h-11"
              />
            </div>
          </div>

          {(startDate || endDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="mt-3"
            >
              Clear Dates
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      {Object.keys(monthlyCarryforwards).length > 0 && (
        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Monthly Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(monthlyCarryforwards).map(([month, data]) => (
              <div key={month} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                <div>
                  <p className="font-bold text-sm">{month}</p>
                  <p className="text-xs text-zinc-500">{data.count} carryforward{data.count !== 1 ? 's' : ''}</p>
                </div>
                <p className={`font-bold ${data.total >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {data.total >= 0 ? '+' : '-'}{formatINR(Math.abs(data.total))}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Carryforward List */}
      <div className="space-y-3">
        {displayCarryforwards.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">No carryforwards found</p>
            <p className="text-zinc-300 text-sm mt-1">
              {selectedSite !== 'ALL' || startDate || endDate
                ? 'Try adjusting your filters'
                : 'Carryforwards will appear here when there is a balance (positive or negative)'}
            </p>
          </div>
        ) : (
          displayCarryforwards.map((cf) => {
            const site = sites.find(s => s.id === cf.site_id);
            const fromDate = new Date(cf.from_date);
            const toDate = new Date(cf.to_date);
            
            return (
              <Card key={cf.id} className="bg-white border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-blue-100 px-2 py-0.5 rounded-full font-bold text-blue-700 uppercase">
                          {site?.name || 'Unknown Site'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-center">
                          <p className="text-xs text-zinc-500 font-medium">From</p>
                          <p className="font-bold text-sm">
                            {fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-zinc-400" />
                        <div className="text-center">
                          <p className="text-xs text-zinc-500 font-medium">To</p>
                          <p className="font-bold text-sm">
                            {toDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-zinc-500">Income</p>
                          <p className="font-bold text-emerald-600">{formatINR(cf.income_amount)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Expense</p>
                          <p className="font-bold text-rose-600">{formatINR(cf.expense_amount)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-zinc-500 mb-1">
                        {Number(cf.amount) >= 0 ? 'Surplus' : 'Deficit'}
                      </p>
                      <p className={`text-2xl font-bold ${Number(cf.amount) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {Number(cf.amount) >= 0 ? '+' : '-'}{formatINR(Math.abs(Number(cf.amount)))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
