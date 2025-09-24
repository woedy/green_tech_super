import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, Command as CommandIcon, Home, ListChecks, FileText, Briefcase, Calendar as Cal, MessagesSquare, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import CommandPalette from "@/components/CommandPalette";

const nav = [
  { label: "Dashboard", to: "/dashboard", icon: Home },
  { label: "Leads", to: "/leads", icon: ListChecks },
  { label: "Quotes", to: "/quotes", icon: FileText },
  { label: "Projects", to: "/projects", icon: Briefcase },
  { label: "Calendar", to: "/calendar", icon: Cal },
  { label: "Messages", to: "/messages", icon: MessagesSquare },
];

export default function AgentShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r">
        <div className="h-16 flex items-center px-4 border-b">
          <Link to="/dashboard" className="font-bold">Agent Portal</Link>
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
        <div className="p-2 border-t">
          <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50">
            <User className="w-4 h-4" /> Profile
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 border-b flex items-center justify-between px-4 gap-2">
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/dashboard" className="font-semibold">Agent Portal</Link>
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
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <CommandPalette />
      </div>
    </div>
  );
}
