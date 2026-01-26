import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ChartBar, FileText, Home, Layers, Map, Megaphone, Package, Users, LogOut, Globe, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useBuildRequestFeed } from '../hooks/useBuildRequestFeed';
import { useAuth } from '../hooks/useAuth';

const navSections = [
  {
    title: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: Home },
      { to: '/admin/analytics', label: 'Analytics', icon: ChartBar },
    ]
  },
  {
    title: 'Content Management',
    items: [
      { to: '/admin/plans', label: 'Plans', icon: Layers },
      { to: '/admin/properties', label: 'Properties', icon: Package },
      { to: '/admin/content', label: 'Content', icon: FileText },
    ]
  },
  {
    title: 'User Management',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/notifications', label: 'Notifications', icon: Megaphone },
    ]
  },
  {
    title: 'System Configuration',
    items: [
      { to: '/admin/regions', label: 'Ghana Regions', icon: Map },
    ]
  }
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const [leadCount, setLeadCount] = useState(0);

  useBuildRequestFeed(() => setLeadCount((count) => count + 1));

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r bg-card">
        <div className="h-14 flex items-center px-4">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            <span className="text-lg font-semibold">Green Admin</span>
          </div>
        </div>
        <Separator />
        
        {/* Ghana Market Context */}
        <div className="p-3 bg-green-50 dark:bg-green-950 border-b">
          <div className="flex items-center gap-2 text-sm">
            <Map className="h-4 w-4 text-green-600" />
            <span className="font-medium">Ghana Market</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            4 regions • 128 properties • GHS currency
          </div>
        </div>

        <nav className="p-2 space-y-4 flex-1">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map(({ to, label, icon: Icon }) => (
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
                      <Badge variant="default" className="text-xs">
                        {leadCount}
                      </Badge>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t">
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>
      
      <main className="flex-1 min-w-0">
        <header className="h-14 border-b flex items-center justify-between px-4 bg-card">
          <div className="flex items-center gap-4">
            <div className="font-medium">Admin Portal</div>
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Full Access
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>Ghana Market Focus</span>
          </div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
