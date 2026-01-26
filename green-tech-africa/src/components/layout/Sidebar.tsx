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
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

const Sidebar = ({ isCollapsed, onToggleCollapse }: SidebarProps) => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return null;
  }

  const menuItems = [
    {
      name: "Dashboard",
      path: "/account",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Requests",
      path: "/account/requests",
      icon: ClipboardList,
    },
    {
      name: "Quotes",
      path: "/account/quotes",
      icon: FileSpreadsheet,
    },
    {
      name: "Projects",
      path: "/account/projects",
      icon: ClipboardList,
    },
    {
      name: "Appointments",
      path: "/account/appointments",
      icon: Calendar,
    },
    {
      name: "Messages",
      path: "/account/messages",
      icon: MessageSquare,
    },
    {
      name: "Favorites",
      path: "/account/favorites",
      icon: Heart,
    },
    {
      name: "Documents",
      path: "/account/documents",
      icon: FileText,
    },
    {
      name: "Payments",
      path: "/account/payments",
      icon: CreditCard,
    },
  ];

  const settingsItems = [
    {
      name: "Profile",
      path: "/account/profile",
      icon: User,
    },
    {
      name: "Notifications",
      path: "/account/notifications",
      icon: Bell,
    },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = () => {
    logout();
  };

  return (
    <div
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background border-r border-border z-40 transition-all duration-300 hidden md:block ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Toggle Button */}
      <div className="absolute -right-3 top-6 z-50">
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 rounded-full bg-background border shadow-md"
          onClick={() => onToggleCollapse(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

      <div className="flex flex-col h-full">
        {/* User Info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {(
                user?.first_name?.[0]?.toUpperCase() ||
                user?.last_name?.[0]?.toUpperCase() ||
                user?.email?.[0]?.toUpperCase() ||
                "?"
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {user?.first_name
                    ? `${user.first_name} ${user.last_name ?? ""}`.trim()
                    : user?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {/* Main Menu */}
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path, item.exact);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Settings Section */}
            <div className="pt-4">
              {!isCollapsed && (
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Settings
                </p>
              )}
              <div className="space-y-1">
                {settingsItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Sign Out */}
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            className={`w-full justify-start gap-3 text-muted-foreground hover:text-foreground ${
              isCollapsed ? "px-3" : ""
            }`}
            onClick={handleSignOut}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;