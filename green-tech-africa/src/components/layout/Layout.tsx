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
    <div className="min-h-screen flex flex-col">
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
            isAuthenticated 
              ? sidebarCollapsed 
                ? "md:ml-16" 
                : "md:ml-64"
              : ""
          }`}
        >
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
