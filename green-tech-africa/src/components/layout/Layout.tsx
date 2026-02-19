import { ReactNode, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1">
        {isAuthenticated && (
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={setSidebarCollapsed}
          />
        )}
        <main
          className={`flex-grow transition-all duration-300 ${
            isAuthenticated ? (sidebarCollapsed ? "md:ml-16" : "md:ml-64") : ""
          }`}
        >
          {!isAuthenticated && <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,theme(colors.primary/10),transparent_45%),radial-gradient(circle_at_bottom_left,theme(colors.accent/40),transparent_35%)]" />}
          {children}
        </main>
      </div>
      {!isAuthenticated && <Footer />}
    </div>
  );
};

export default Layout;
