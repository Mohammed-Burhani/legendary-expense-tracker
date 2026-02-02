'use client';

import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useApp } from '@/lib/context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { useSites, useLaborers, useAddExpense, useTodayExpenses } from '@/lib/query/hooks';

const expenseValidationSchema = Yup.object({
  amount: Yup.number().positive('Must be positive').required('Required'),
  description: Yup.string().min(3, 'Too short').required('Required'),
  category: Yup.string().required('Required'),
  date: Yup.string().required('Required'),
});

const incomeValidationSchema = Yup.object({
  amount: Yup.number().positive('Must be positive').required('Required'),
  description: Yup.string().min(3, 'Too short').required('Required'),
  date: Yup.string().required('Required'),
  site_id: Yup.string().required('Site is required'),
});

export default function AddEntryPage() {
  const { user } = useApp();
  const router = useRouter();
  const { data: sites = [] } = useSites();
  const { data: laborers = [] } = useLaborers(user?.site_id || undefined);
  const { data: todayExpenses = [] } = useTodayExpenses();
  const addExpenseMutation = useAddExpense();

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';

  // Check if admin has already added income for a site today
  const hasIncomeToday = (siteId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return todayExpenses.some(
      e => e.type === 'INCOME' && e.site_id === siteId && e.date === today
    );
  };

  // Admin form for adding income
  const adminFormik = useFormik({
    initialValues: {
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      site_id: '',
    },
    validationSchema: incomeValidationSchema,
    onSubmit: async (values) => {
      if (!user) return;
      
      if (hasIncomeToday(values.site_id)) {
        toast.error('Income already added for this site today');
        return;
      }

      try {
        await addExpenseMutation.mutateAsync({
          amount: Number(values.amount),
          description: values.description,
          category: 'Daily Budget',
          date: values.date,
          manager_id: user.id,
          site_id: values.site_id,
          type: 'INCOME',
          laborer_id: null,
        });
        
        toast.success('Daily income added successfully');
        router.push('/');
      } catch (error) {
        toast.error('Failed to add income');
        console.error(error);
      }
    },
  });

  // Manager form for adding expenses
  const managerFormik = useFormik({
    initialValues: {
      amount: '',
      description: '',
      category: 'Materials',
      date: new Date().toISOString().split('T')[0],
      laborerId: '',
    },
    validationSchema: expenseValidationSchema,
    onSubmit: async (values) => {
      if (!user?.site_id) {
        toast.error('No site assigned to your account');
        return;
      }

      try {
        await addExpenseMutation.mutateAsync({
          amount: Number(values.amount),
          description: values.description,
          category: values.category,
          date: values.date,
          manager_id: user.id,
          site_id: user.site_id,
          type: 'EXPENSE',
          laborer_id: values.laborerId || null,
        });
        
        toast.success('Expense added successfully');
        router.push('/');
      } catch (error) {
        toast.error('Failed to add expense');
        console.error(error);
      }
    },
  });

  // Access control
  if (!isAdmin && !isManager) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-zinc-500 mt-2">Only managers and admins can add entries.</p>
      </div>
    );
  }

  const userSite = sites.find(s => s.id === user?.site_id);
  const siteLaborers = laborers;
  const expenseCategories = ['Materials', 'Labor', 'Fuel', 'Equipment', 'Maintenance', 'Transport', 'Tools', 'Other'];

  // Render Admin Form
  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Add Daily Income</h2>
          <p className="text-sm text-zinc-500 mt-1">Set daily budget for a site</p>
        </div>

        <Card className="border-zinc-200 shadow-sm bg-white">
          <CardContent className="p-5">
            <form onSubmit={adminFormik.handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="site_id" className="text-sm font-bold">Select Site</Label>
                <Select 
                  onValueChange={(val) => adminFormik.setFieldValue('site_id', val)} 
                  value={adminFormik.values.site_id}
                >
                  <SelectTrigger className="w-full bg-zinc-50 border-zinc-200 h-12">
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => {
                      const alreadyAdded = hasIncomeToday(site.id);
                      return (
                        <SelectItem 
                          key={site.id} 
                          value={site.id}
                          disabled={alreadyAdded}
                        >
                          {site.name} {alreadyAdded && '(Already added today)'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {adminFormik.touched.site_id && adminFormik.errors.site_id && (
                  <p className="text-xs text-red-500 font-medium">{adminFormik.errors.site_id as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-bold">Daily Budget Amount ($)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="bg-zinc-50 border-zinc-200 h-12 text-lg"
                  onChange={adminFormik.handleChange}
                  onBlur={adminFormik.handleBlur}
                  value={adminFormik.values.amount}
                />
                {adminFormik.touched.amount && adminFormik.errors.amount && (
                  <p className="text-xs text-red-500 font-medium">{adminFormik.errors.amount as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-bold">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="e.g. Daily budget for site operations"
                  className="bg-zinc-50 border-zinc-200 min-h-[80px] resize-none"
                  onChange={adminFormik.handleChange}
                  onBlur={adminFormik.handleBlur}
                  value={adminFormik.values.description}
                />
                {adminFormik.touched.description && adminFormik.errors.description && (
                  <p className="text-xs text-red-500 font-medium">{adminFormik.errors.description as string}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-bold">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  className="bg-zinc-50 border-zinc-200 h-12"
                  onChange={adminFormik.handleChange}
                  onBlur={adminFormik.handleBlur}
                  value={adminFormik.values.date}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button"
                  onClick={() => router.back()}
                  variant="outline"
                  className="flex-1 h-12 text-base font-bold border-2 border-zinc-200 hover:bg-zinc-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={adminFormik.isSubmitting || addExpenseMutation.isPending}
                >
                  {addExpenseMutation.isPending ? 'Adding...' : 'Add Income'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Manager Form
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Add Expense</h2>
        {userSite && <p className="text-sm text-zinc-500 mt-1">{userSite.name}</p>}
      </div>

      <Card className="border-zinc-200 shadow-sm bg-white">
        <CardContent className="p-5">
          <form onSubmit={managerFormik.handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-bold">Amount ($)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="bg-zinc-50 border-zinc-200 h-12 text-lg"
                onChange={managerFormik.handleChange}
                onBlur={managerFormik.handleBlur}
                value={managerFormik.values.amount}
              />
              {managerFormik.touched.amount && managerFormik.errors.amount && (
                <p className="text-xs text-red-500 font-medium">{managerFormik.errors.amount as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-bold">Category</Label>
              <Select 
                onValueChange={(val) => managerFormik.setFieldValue('category', val)} 
                value={managerFormik.values.category}
              >
                <SelectTrigger className="w-full bg-zinc-50 border-zinc-200 h-12">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {managerFormik.values.category === 'Labor' && siteLaborers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="laborerId" className="text-sm font-bold">Laborer (Optional)</Label>
                <Select 
                  onValueChange={(val) => managerFormik.setFieldValue('laborerId', val)} 
                  value={managerFormik.values.laborerId}
                >
                  <SelectTrigger className="w-full bg-zinc-50 border-zinc-200 h-12">
                    <SelectValue placeholder="Select laborer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {siteLaborers.map((laborer) => (
                      <SelectItem key={laborer.id} value={laborer.id}>{laborer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-bold">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="e.g. 50 bags of cement for foundation work"
                className="bg-zinc-50 border-zinc-200 min-h-[80px] resize-none"
                onChange={managerFormik.handleChange}
                onBlur={managerFormik.handleBlur}
                value={managerFormik.values.description}
              />
              {managerFormik.touched.description && managerFormik.errors.description && (
                <p className="text-xs text-red-500 font-medium">{managerFormik.errors.description as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-bold">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                className="bg-zinc-50 border-zinc-200 h-12"
                onChange={managerFormik.handleChange}
                onBlur={managerFormik.handleBlur}
                value={managerFormik.values.date}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button"
                onClick={() => router.back()}
                variant="outline"
                className="flex-1 h-12 text-base font-bold border-2 border-zinc-200 hover:bg-zinc-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 text-base font-bold bg-zinc-950 hover:bg-zinc-800 text-white"
                disabled={managerFormik.isSubmitting || addExpenseMutation.isPending}
              >
                {addExpenseMutation.isPending ? 'Saving...' : 'Add Expense'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
