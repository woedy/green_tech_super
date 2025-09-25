import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ChartBar, Home, Layers, Map, Megaphone, Package, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { useBuildRequestFeed } from '../hooks/useBuildRequestFeed';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: Home },
  { to: '/admin/plans', label: 'Plans', icon: Layers },
  { to: '/admin/properties', label: 'Properties', icon: Package },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/regions', label: 'Regions', icon: Map },
  { to: '/admin/notifications', label: 'Notifications', icon: Megaphone },
  { to: '/admin/analytics', label: 'Analytics', icon: ChartBar },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [leadCount, setLeadCount] = useState(0);

  useBuildRequestFeed(() => setLeadCount((count) => count + 1));
  const logout = () => {
    localStorage.removeItem('adminAuthed');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r bg-card">
        <div className="h-14 flex items-center px-4 text-lg font-semibold">Green Admin</div>
        <Separator />
        <nav className="p-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                  isActive ? 'bg-accent text-accent-foreground' : ''
                }`
              }
              end={to === '/admin'}
              onClick={() => {
                if (label === 'Dashboard') {
                  setLeadCount(0);
                }
              }}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </span>
              {label === 'Dashboard' && leadCount > 0 && (
                <span className="ml-auto text-xs rounded-full bg-primary text-primary-foreground px-2 py-0.5">
                  {leadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto p-3">
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="h-14 border-b flex items-center justify-between px-4">
          <div className="font-medium">Admin Portal</div>
        </header>
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
