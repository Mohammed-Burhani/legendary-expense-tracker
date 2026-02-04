'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { useManagers } from '@/lib/query/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function AdminPage() {
  const { user } = useApp();
  const { data: users = [], refetch } = useManagers();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'LABORER'>('MANAGER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Only admins can access this page
  if (user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            name,
            role,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Failed to create auth user');
        setLoading(false);
        return;
      }

      // Always create the user profile manually (don't rely on trigger)
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          auth_id: authData.user.id,
          email,
          name,
          role,
        });

      if (insertError) {
        console.error('Profile creation failed:', insertError);
        setError(`Failed to create user profile: ${insertError.message}`);
        setLoading(false);
        return;
      }

      setSuccess(`User ${name} created successfully!`);
      setEmail('');
      setPassword('');
      setName('');
      setRole('MANAGER');
      
      // Refresh user list
      refetch();
    } catch (err) {
      console.error('Error creating user:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Panel
        </h1>
        <p className="text-zinc-600 mt-2">Manage users and system settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create User Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MANAGER' | 'LABORER')}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  required
                >
                  <option value="LABORER">Laborer</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User List */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-zinc-600">{u.email || 'No email'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      u.role === 'ADMIN' 
                        ? 'bg-red-100 text-red-700'
                        : u.role === 'MANAGER'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-zinc-100 text-zinc-700'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
