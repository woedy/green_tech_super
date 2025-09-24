import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Leaf, Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUser, clearUser } from "@/lib/demoAuth";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authUser, setAuthUser] = useState(getUser());
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Leads", path: "/leads" },
    { name: "Quotes", path: "/quotes" },
    { name: "Projects", path: "/projects" },
    { name: "Calendar", path: "/calendar" },
    { name: "Messages", path: "/messages" },
  ];

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "gta_auth") setAuthUser(getUser());
    };
    window.addEventListener("storage", onStorage);
    // Also poll once on mount in case of same-tab updates
    setAuthUser(getUser());
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const onSignOut = () => {
    clearUser();
    setAuthUser(null);
    navigate("/");
  };

  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 hero-gradient rounded-lg">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">
                Green Tech
              </span>
              <span className="text-xs text-muted-foreground -mt-1">
                Africa
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium smooth-transition ${
                  isActive(item.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {!authUser ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth/login">Sign In</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/contact">Contact</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                        {authUser.name?.[0]?.toUpperCase() || authUser.email[0].toUpperCase()}
                      </div>
                      <span className="hidden md:inline-block">{authUser.name || authUser.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/leads">Requests</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/quotes">Quotes</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/projects">Projects</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/calendar">Appointments</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/messages">Messages</Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/notifications">Notifications</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onSignOut}>Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t border-border">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`block px-3 py-2 text-base font-medium smooth-transition ${
                    isActive(item.path)
                      ? "text-primary bg-accent"
                      : "text-muted-foreground hover:text-primary hover:bg-accent"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 pb-2 space-y-2">
                {!authUser ? (
                  <>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/auth/login" onClick={() => setIsOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/contact" onClick={() => setIsOpen(false)}>
                        Contact
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/leads" onClick={() => setIsOpen(false)}>
                        Requests
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/quotes" onClick={() => setIsOpen(false)}>
                        Quotes
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/projects" onClick={() => setIsOpen(false)}>
                        Projects
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/calendar" onClick={() => setIsOpen(false)}>
                        Appointments
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/messages" onClick={() => setIsOpen(false)}>
                        Messages
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/profile" onClick={() => setIsOpen(false)}>
                        Profile
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/notifications" onClick={() => setIsOpen(false)}>
                        Notifications
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => { setIsOpen(false); onSignOut(); }}>
                      Sign out
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

