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
import { useSites, useLaborers, useAddExpense } from '@/lib/query/hooks';

const validationSchema = Yup.object({
  type: Yup.string().oneOf(['EXPENSE', 'INCOME']).required('Required'),
  amount: Yup.number().positive('Must be positive').required('Required'),
  description: Yup.string().min(3, 'Too short').required('Required'),
  category: Yup.string().required('Required'),
  date: Yup.string().required('Required'),
});

export default function AddEntryPage() {
  const { user } = useApp();
  const router = useRouter();
  const { data: sites = [] } = useSites();
  const { data: laborers = [] } = useLaborers(user?.site_id || undefined);
  const addExpenseMutation = useAddExpense();

  if (user?.role !== 'MANAGER') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-zinc-500 mt-2">Only managers can add entries.</p>
      </div>
    );
  }

  const userSite = sites.find(s => s.id === user.site_id);
  const siteLaborers = laborers;

  const formik = useFormik({
    initialValues: {
      type: 'EXPENSE',
      amount: '',
      description: '',
      category: 'Materials',
      date: new Date().toISOString().split('T')[0],
      laborerId: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!user.site_id) {
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
          type: values.type as 'EXPENSE' | 'INCOME',
          laborer_id: values.laborerId || null,
        });
        
        toast.success(`${values.type === 'INCOME' ? 'Income' : 'Expense'} added successfully`);
        router.push('/');
      } catch (error) {
        toast.error('Failed to add entry');
        console.error(error);
      }
    },
  });

  const expenseCategories = ['Materials', 'Labor', 'Fuel', 'Equipment', 'Maintenance', 'Transport', 'Tools', 'Other'];
  const incomeCategories = ['Client Payment', 'Advance', 'Final Payment', 'Milestone Payment', 'Other'];
  const categories = formik.values.type === 'EXPENSE' ? expenseCategories : incomeCategories;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New Entry</h2>
        {userSite && <p className="text-sm text-zinc-500 mt-1">{userSite.name}</p>}
      </div>

      <Card className="border-zinc-200 shadow-sm bg-white">
        <CardContent className="p-5">
          <form onSubmit={formik.handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-bold">Transaction Type</Label>
              <Select 
                onValueChange={(val) => {
                  formik.setFieldValue('type', val);
                  formik.setFieldValue('category', val === 'EXPENSE' ? 'Materials' : 'Client Payment');
                }} 
                defaultValue={formik.values.type}
              >
                <SelectTrigger className="w-full bg-zinc-50 border-zinc-200 h-12">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">💸 Expense (Money Out)</SelectItem>
                  <SelectItem value="INCOME">💰 Income (Money In)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-bold">Amount ($)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="bg-zinc-50 border-zinc-200 h-12 text-lg"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.amount}
              />
              {formik.touched.amount && formik.errors.amount && (
                <p className="text-xs text-red-500 font-medium">{formik.errors.amount as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-bold">Category</Label>
              <Select 
                onValueChange={(val) => formik.setFieldValue('category', val)} 
                value={formik.values.category}
              >
                <SelectTrigger className="w-full bg-zinc-50 border-zinc-200 h-12">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formik.values.type === 'EXPENSE' && formik.values.category === 'Labor' && siteLaborers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="laborerId" className="text-sm font-bold">Laborer (Optional)</Label>
                <Select 
                  onValueChange={(val) => formik.setFieldValue('laborerId', val)} 
                  value={formik.values.laborerId}
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
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.description}
              />
              {formik.touched.description && formik.errors.description && (
                <p className="text-xs text-red-500 font-medium">{formik.errors.description as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-bold">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                className="bg-zinc-50 border-zinc-200 h-12"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.date}
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
                disabled={formik.isSubmitting || addExpenseMutation.isPending}
              >
                {addExpenseMutation.isPending ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
