'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useApp } from '@/lib/context';
import { useManagers } from '@/lib/query/hooks';
import { Building2, LogIn, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useApp();
  const { data: managers = [] } = useManagers();
  
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get all users who can login (ADMIN and MANAGER roles)
  const loginUsers = managers.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const selectedUser = loginUsers.find(u => u.id === userId);
      
      if (!selectedUser) {
        setError('Please select a valid user');
        setLoading(false);
        return;
      }

      // Set user in context
      setUser(selectedUser);
      
      // Redirect to home
      router.push('/');
    } catch {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-zinc-50 to-zinc-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-zinc-200">
        <CardHeader className="space-y-3 pb-6">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Legendary Builders
          </CardTitle>
          <p className="text-sm text-zinc-500 text-center">
            Sign in to manage your construction sites
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="user">Select User</Label>
              <select
                id="user"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                required
              >
                <option value="">Choose a user...</option>
                {loginUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg flex items-center justify-center gap-2"
              disabled={loading || !userId}
            >
              <LogIn className="h-5 w-5" />
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-200">
            <p className="text-xs text-zinc-500 text-center">
              Demo users available for testing
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
