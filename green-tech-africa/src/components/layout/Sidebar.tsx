import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  ClipboardList,
  FileSpreadsheet,
  Calendar,
  MessageSquare,
  Heart,
  FileText,
  CreditCard,
  User,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  Home,
  FileCheck,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

const Sidebar = ({ isCollapsed, onToggleCollapse }: SidebarProps) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const menuItems = [
    { name: "Dashboard", path: "/account", icon: LayoutDashboard, exact: true },
    { name: "Requests", path: "/account/requests", icon: ClipboardList },
    { name: "Quotes", path: "/account/quotes", icon: FileSpreadsheet },
    { name: "My Properties", path: "/account/my-properties", icon: Home },
    { name: "My Projects", path: "/account/my-projects", icon: Building2 },
    { name: "Property Requests", path: "/account/property-transactions", icon: FileCheck },
    { name: "Appointments", path: "/account/appointments", icon: Calendar },
    { name: "Messages", path: "/account/messages", icon: MessageSquare },
    { name: "Favorites", path: "/account/favorites", icon: Heart },
    { name: "Documents", path: "/account/documents", icon: FileText },
    { name: "Payments", path: "/account/payments", icon: CreditCard },
  ];

  const settingsItems = [
    { name: "Profile", path: "/account/profile", icon: User },
    { name: "Notifications", path: "/account/notifications", icon: Bell },
  ];

  const isActive = (path: string, exact = false) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const userInitial = (
    user?.first_name?.[0]?.toUpperCase() ||
    user?.last_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "?"
  );

  return (
    <aside
      className={`fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] border-r border-border/70 bg-background/95 backdrop-blur md:block transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-72"
      }`}
    >
      <div className="absolute -right-3 top-6 z-50">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-full bg-background shadow-md"
          onClick={() => onToggleCollapse(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <div className="flex h-full flex-col">
        <div className="border-b border-border/70 p-3">
          <div className={`rounded-xl border border-border/70 bg-card p-3 ${isCollapsed ? "items-center" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                {userInitial}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {user?.first_name ? `${user.first_name} ${user.last_name ?? ""}`.trim() : user?.email}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <Link
                to="/account/requests/new"
                className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/15"
              >
                <Sparkles className="h-3.5 w-3.5" /> Start New Request
              </Link>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.name : undefined}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="my-4 border-t border-border/70" />

          {!isCollapsed && (
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Account Settings</p>
          )}
          <nav className="space-y-1.5">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-border/70 p-3">
          <Button
            variant="ghost"
            className={`w-full text-destructive hover:bg-destructive/10 hover:text-destructive ${isCollapsed ? "justify-center" : "justify-start"}`}
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
