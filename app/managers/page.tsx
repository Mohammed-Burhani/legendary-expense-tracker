'use client';

import { useApp } from '@/lib/context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCog, Building2, Plus, Users, Eye, EyeOff } from 'lucide-react';
import { useManagers, useSites, useLaborers } from '@/lib/query/hooks';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ManagersPage() {
  const { user } = useApp();
  const { data: managers = [], refetch } = useManagers();
  const { data: sites = [] } = useSites();
  const { data: laborers = [] } = useLaborers();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [newManagerPassword, setNewManagerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const handleAddManager = async () => {
    if (!newManagerName.trim()) {
      toast.error('Please enter manager name');
      return;
    }
    if (!newManagerEmail.trim()) {
      toast.error('Please enter manager email');
      return;
    }
    if (!newManagerPassword.trim() || newManagerPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Call API route to create manager using admin client
      const response = await fetch('/api/managers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newManagerName.trim(),
          email: newManagerEmail.trim(),
          password: newManagerPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create manager');
        setIsCreating(false);
        return;
      }

      toast.success(data.message || `Manager ${newManagerName} created successfully!`);
      setIsAddDialogOpen(false);
      setNewManagerName('');
      setNewManagerEmail('');
      setNewManagerPassword('');
      
      // Refresh manager list
      refetch();
    } catch (error) {
      toast.error('Failed to add manager');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-zinc-500 mt-2">Only admins can manage managers.</p>
      </div>
    );
  }

  const managersList = managers.filter(m => m.role === 'MANAGER');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Managers</h2>
          <p className="text-sm text-zinc-500 mt-1">Manage site managers and assignments</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Manager
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Manager</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="manager-name">Full Name</Label>
                <Input
                  id="manager-name"
                  placeholder="John Doe"
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manager-email">Email</Label>
                <Input
                  id="manager-email"
                  type="email"
                  placeholder="manager@example.com"
                  value={newManagerEmail}
                  onChange={(e) => setNewManagerEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manager-password">Password</Label>
                <div className="relative">
                  <Input
                    id="manager-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    value={newManagerPassword}
                    onChange={(e) => setNewManagerPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-zinc-500">Manager will use this email and password to login</p>
              </div>
              
              <Button onClick={handleAddManager} className="w-full" disabled={isCreating}>
                {isCreating ? 'Creating Manager...' : 'Create Manager'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {managersList.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-zinc-200">
            <UserCog className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-400 font-medium">No managers yet</p>
            <p className="text-zinc-300 text-xs mt-1">Add your first manager to get started</p>
          </div>
        ) : (
          managersList.map(manager => {
            const managedSites = sites.filter(s => s.manager_id === manager.id);
            const managedLaborers = laborers.filter(l => l.manager_id === manager.id);
            const assignedSite = sites.find(s => s.id === manager.site_id);

            return (
              <Card key={manager.id} className="border-zinc-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserCog className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900 text-lg">{manager.name}</h3>
                        {manager.email && (
                          <p className="text-xs text-zinc-500">{manager.email}</p>
                        )}
                        <p className="text-xs text-zinc-500">Manager</p>
                      </div>
                    </div>
                  </div>

                  {assignedSite && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs font-bold text-blue-900">Assigned Site</p>
                          <p className="text-sm font-medium text-blue-700">{assignedSite.name}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Sites Managed
                      </p>
                      <p className="text-lg font-bold text-zinc-900">{managedSites.length}</p>
                      {managedSites.length > 0 && (
                        <p className="text-xs text-zinc-500 mt-1">
                          {managedSites.map(s => s.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Laborers
                      </p>
                      <p className="text-lg font-bold text-zinc-900">{managedLaborers.length}</p>
                      {managedLaborers.length > 0 && (
                        <p className="text-xs text-zinc-500 mt-1">Under supervision</p>
                      )}
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
