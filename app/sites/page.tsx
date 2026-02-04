'use client';

import { useApp } from '@/lib/context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, TrendingUp, MapPin, Plus, UserCog, UserPlus } from 'lucide-react';
import { useSites, useManagers, useExpenses, useLaborers, useAddSite, useUpdateSite, useAddManager } from '@/lib/query/hooks';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SitesPage() {
  const { user } = useApp();
  const { data: sites = [] } = useSites();
  const { data: managers = [] } = useManagers();
  const { data: expenses = [] } = useExpenses();
  const { data: laborers = [] } = useLaborers();
  
  const addSite = useAddSite();
  const updateSite = useUpdateSite();
  const addManager = useAddManager();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isAddManagerDialogOpen, setIsAddManagerDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [newManagerName, setNewManagerName] = useState('');
  
  const [newSite, setNewSite] = useState<{
    name: string;
    location: string;
    manager_id: string;
    status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  }>({
    name: '',
    location: '',
    manager_id: '',
    status: 'ACTIVE'
  });
  
  const [assignManager, setAssignManager] = useState('');
  
  const handleAddSite = async () => {
    if (!newSite.name || !newSite.location || !newSite.manager_id) {
      toast.error('Please fill all fields');
      return;
    }
    
    try {
      await addSite.mutateAsync(newSite);
      toast.success('Site created successfully');
      setIsAddDialogOpen(false);
      setNewSite({ name: '', location: '', manager_id: '', status: 'ACTIVE' });
    } catch (error) {
      toast.error('Failed to create site');
      console.error(error);
    }
  };
  
  const handleAssignManager = async () => {
    if (!selectedSite || !assignManager) {
      toast.error('Please select a manager');
      return;
    }
    
    try {
      await updateSite.mutateAsync({ id: selectedSite, manager_id: assignManager });
      toast.success('Manager assigned successfully');
      setIsAssignDialogOpen(false);
      setSelectedSite(null);
      setAssignManager('');
    } catch (error) {
      toast.error('Failed to assign manager');
      console.error(error);
    }
  };

  const handleAddManager = async () => {
    if (!newManagerName.trim()) {
      toast.error('Please enter manager name');
      return;
    }
    
    try {
      const newManager = await addManager.mutateAsync({ name: newManagerName.trim() });
      toast.success('Manager added successfully');
      setNewSite({ ...newSite, manager_id: newManager.id });
      setIsAddManagerDialogOpen(false);
      setNewManagerName('');
    } catch (error) {
      toast.error('Failed to add manager');
      console.error(error);
    }
  };

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
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Sites</h2>
          <p className="text-sm text-zinc-500 mt-1">Manage construction sites and assignments</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Site
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Site</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  placeholder="Downtown Plaza"
                  value={newSite.name}
                  onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="site-location">Location</Label>
                <Input
                  id="site-location"
                  placeholder="Main Street, Downtown"
                  value={newSite.location}
                  onChange={(e) => setNewSite({ ...newSite, location: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="site-manager">Assign Manager</Label>
                  <Dialog open={isAddManagerDialogOpen} onOpenChange={setIsAddManagerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                        <UserPlus className="h-3 w-3" />
                        Add New
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Manager</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-manager-name">Manager Name</Label>
                          <Input
                            id="new-manager-name"
                            placeholder="John Doe"
                            value={newManagerName}
                            onChange={(e) => setNewManagerName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddManager();
                              }
                            }}
                          />
                        </div>
                        
                        <Button onClick={handleAddManager} className="w-full" disabled={addManager.isPending}>
                          {addManager.isPending ? 'Adding...' : 'Add Manager'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select value={newSite.manager_id} onValueChange={(value) => setNewSite({ ...newSite, manager_id: value })}>
                  <SelectTrigger id="site-manager">
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.filter(m => m.role === 'MANAGER').map(manager => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="site-status">Status</Label>
                <Select value={newSite.status} onValueChange={(value: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED') => setNewSite({ ...newSite, status: value })}>
                  <SelectTrigger id="site-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleAddSite} className="w-full" disabled={addSite.isPending}>
                {addSite.isPending ? 'Creating...' : 'Create Site'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {sites.map(site => {
          const manager = managers.find(m => m.id === site.manager_id);
          const siteExpenses = expenses.filter(e => e.site_id === site.id);
          const siteIncome = siteExpenses.filter(e => e.type === 'INCOME').reduce((acc, curr) => acc + Number(curr.amount), 0);
          const siteExpense = siteExpenses.filter(e => e.type === 'EXPENSE').reduce((acc, curr) => acc + Number(curr.amount), 0);
          const siteLaborers = laborers.filter(l => l.site_id === site.id);
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
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSite(site.id);
                        setAssignManager(site.manager_id);
                        setIsAssignDialogOpen(true);
                      }}
                    >
                      <UserCog className="h-4 w-4" />
                    </Button>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                      site.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      site.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {site.status}
                    </span>
                  </div>
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
                    <p className="text-lg font-bold text-emerald-600">₹{siteIncome}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Expense</p>
                    <p className="text-lg font-bold text-rose-600">₹{siteExpense}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Profit
                    </p>
                    <p className={`text-lg font-bold ${profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                      ₹{Math.abs(profit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Manager</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="assign-manager">Select Manager</Label>
              <Select value={assignManager} onValueChange={setAssignManager}>
                <SelectTrigger id="assign-manager">
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.filter(m => m.role === 'MANAGER').map(manager => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleAssignManager} className="w-full" disabled={updateSite.isPending}>
              {updateSite.isPending ? 'Assigning...' : 'Assign Manager'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
