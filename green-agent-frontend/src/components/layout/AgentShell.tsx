import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, Command as CommandIcon, Home, ListChecks, FileText, Briefcase, Calendar as Cal, MessagesSquare, User, BarChart3, LogOut, MapPin } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import CommandPalette from "@/components/CommandPalette";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { label: "Dashboard", to: "/dashboard", icon: Home },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Leads", to: "/leads", icon: ListChecks },
  { label: "Quotes", to: "/quotes", icon: FileText },
  { label: "Projects", to: "/projects", icon: Briefcase },
  { label: "Calendar", to: "/calendar", icon: Cal },
  { label: "Messages", to: "/messages", icon: MessagesSquare },
];

export default function AgentShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const userInitials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'A';

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r">
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link to="/dashboard" className="font-bold text-lg">Agent Portal</Link>
          <Badge variant="outline" className="text-xs">
            <MapPin className="w-3 h-3 mr-1" />
            Ghana
          </Badge>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium smooth-transition ${isActive(item.to) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}>
                <Icon className="w-4 h-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t space-y-1">
          <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50">
            <User className="w-4 h-4" /> Profile
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 border-b flex items-center justify-between px-4 gap-2">
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/dashboard" className="font-semibold">Agent Portal</Link>
            <Badge variant="outline" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              Ghana
            </Badge>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" title="Command (Ctrl/Cmd+K)"><CommandIcon className="w-5 h-5" /></Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" title="Notifications"><Bell className="w-5 h-5" /></Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <div className="text-sm font-semibold mb-2">Notifications</div>
                <div className="space-y-2 text-sm">
                  <div className="p-2 rounded-md bg-muted/30">Quote QUO-551 sent • Mar 9</div>
                  <div className="p-2 rounded-md bg-muted/30">New request REQ-1024 in review</div>
                  <div className="p-2 rounded-md bg-muted/30">Project PRJ-88 update posted</div>
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm">{user?.name || 'Agent'}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{user?.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                    </div>
                  </div>
                  {user?.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {user.location}
                    </div>
                  )}
                  {user?.verified_agent && (
                    <Badge variant="secondary" className="text-xs">Verified Agent</Badge>
                  )}
                  <div className="pt-2 border-t space-y-1">
                    <Link to="/profile" className="block px-2 py-1.5 text-sm rounded hover:bg-accent">
                      Profile Settings
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent text-destructive"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <CommandPalette />
      </div>
    </div>
  );
}
