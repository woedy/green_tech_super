import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Leaf, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const publicNavItems = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Projects", path: "/projects" },
    { name: "Properties", path: "/properties" },
    { name: "Financial Tools", path: "/financial-tools" },
    { name: "Contact", path: "/contact" },
  ];

  const authNavItems = [
    { name: "Dashboard", path: "/account" },
    { name: "Plans", path: "/plans" },
    { name: "Properties", path: "/account/properties" },
    { name: "Projects", path: "/account/projects" },
  ];

  const navItems = isAuthenticated ? authNavItems : publicNavItems;

  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  const handleSignOut = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl hero-gradient shadow-soft">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold text-foreground md:text-lg">Green Tech</span>
              <span className="-mt-0.5 text-xs text-muted-foreground">Africa</span>
            </div>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-background/70 p-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`rounded-full px-4 py-2 text-sm font-medium smooth-transition ${
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth/login">Sign In</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/contact">Get Quote</Link>
                </Button>
                <Button variant="hero" size="sm" asChild className="shadow-soft">
                  <Link to="/properties">
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    Explore Listings
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 rounded-full px-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {(
                          user?.first_name?.[0]?.toUpperCase() ||
                          user?.last_name?.[0]?.toUpperCase() ||
                          user?.email?.[0]?.toUpperCase() ||
                          "?"
                        )}
                      </div>
                      <span className="hidden text-sm font-medium lg:inline-block">
                        {user?.first_name ? `${user.first_name} ${user.last_name ?? ""}`.trim() : user?.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link to="/account">Dashboard</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/account/requests">My Requests</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/account/quotes">My Quotes</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/account/appointments">Appointments</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/account/favorites">Favorites</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link to="/account/profile">Profile</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/account/notifications">Notifications</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="pb-3 md:hidden">
            <div className="space-y-1 rounded-xl border border-border/70 bg-background p-2 shadow-soft">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium smooth-transition ${
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="space-y-2 border-t border-border px-1 pt-3">
                {!isAuthenticated ? (
                  <>
                    <Button variant="ghost" className="w-full" asChild>
                      <Link to="/auth/login" onClick={() => setIsOpen(false)}>Sign In</Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/contact" onClick={() => setIsOpen(false)}>Get Quote</Link>
                    </Button>
                    <Button variant="hero" className="w-full" asChild>
                      <Link to="/properties" onClick={() => setIsOpen(false)}>Explore Listings</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/account/profile" onClick={() => setIsOpen(false)}>Profile</Link>
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleSignOut}>Sign out</Button>
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
