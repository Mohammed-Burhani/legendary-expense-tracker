'use client';

import { useApp } from '@/lib/context';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, ShieldCheck, Building2, LogOut } from 'lucide-react';
import { useSites } from '@/lib/query/hooks';

export const Navbar = () => {
  const { user, logout } = useApp();
  const { data: sites = [] } = useSites();
  const userSite = sites.find(s => s.id === user?.site_id);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Legendary Builders</h1>
        <div className="flex items-center gap-2 mt-0.5">
          {user && (
            <>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {user.role}
              </span>
              {userSite && (
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {userSite.name}
                </span>
              )}
            </>
          )}
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full bg-zinc-100 hover:bg-zinc-200">
            {user?.role === 'ADMIN' ? <ShieldCheck className="h-5 w-5 text-zinc-700" /> : <User className="h-5 w-5 text-zinc-700" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.role}</p>
              {user?.email && (
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
