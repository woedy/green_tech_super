import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Leaf, Bell, Command as CommandIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUser, clearUser } from "@/lib/demoAuth";
import CommandPalette from "@/components/CommandPalette";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authUser, setAuthUser] = useState(getUser());
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Projects", path: "/projects" },
    { name: "Properties", path: "/properties" },
    { name: "Contact", path: "/contact" },
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
                <Button variant="ghost" size="icon" title="Command (Ctrl/Cmd+K)">
                  <CommandIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth/login">Sign In</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/contact">Get Quote</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/properties">View Properties</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" title="Command (Ctrl/Cmd+K)">
                  <CommandIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/account">Dashboard</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/agent">Agent Portal</Link>
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative" title="Notifications">
                      <Bell className="h-5 w-5" />
                    </Button>
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
                      <Link to="/account">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account/requests">Requests</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account/quotes">Quotes</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account/projects">Projects</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account/appointments">Appointments</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account/messages">Messages</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account/favorites">Favorites</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account/documents">Documents</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account/payments">Payments</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/account/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account/notifications">Notifications</Link>
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
                        Get Quote
                      </Link>
                    </Button>
                    <Button variant="hero" className="w-full" asChild>
                      <Link to="/properties" onClick={() => setIsOpen(false)}>
                        View Properties
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/account" onClick={() => setIsOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/account/favorites" onClick={() => setIsOpen(false)}>
                        Favorites
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/account/requests" onClick={() => setIsOpen(false)}>
                        Requests
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/account/quotes" onClick={() => setIsOpen(false)}>
                        Quotes
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/account/projects" onClick={() => setIsOpen(false)}>
                        Projects
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/account/appointments" onClick={() => setIsOpen(false)}>
                        Appointments
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/account/messages" onClick={() => setIsOpen(false)}>
                        Messages
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/account/favorites" onClick={() => setIsOpen(false)}>
                        Favorites
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/account/documents" onClick={() => setIsOpen(false)}>
                        Documents
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/account/payments" onClick={() => setIsOpen(false)}>
                        Payments
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/account/profile" onClick={() => setIsOpen(false)}>
                        Profile
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/account/notifications" onClick={() => setIsOpen(false)}>
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
      <CommandPalette />
    </nav>
  );
};

export default Navbar;
