import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import AdminLayout from "./admin/layout/AdminLayout";
import AdminLogin from "./admin/pages/Login";
import AdminDashboard from "./admin/pages/Dashboard";
import AdminPlans from "./admin/pages/Plans";
import AdminProperties from "./admin/pages/Properties";
import AdminUsers from "./admin/pages/Users";
import AdminRegions from "./admin/pages/Regions";
import AdminNotifications from "./admin/pages/Notifications";
import AdminAnalytics from "./admin/pages/Analytics";
import SiteContent from "./admin/pages/SiteContent";
import { SiteDocumentForm, SiteDocumentDetail } from "./admin/pages/SiteContentDetail";
import { PlanForm, PlanDetail } from "./admin/pages/PlanDetail";
import { PropertyForm, PropertyDetail } from "./admin/pages/PropertyDetail";
import { UserForm, UserDetail } from "./admin/pages/UserDetail";
import { RegionForm, RegionDetail } from "./admin/pages/RegionDetail";
import { TemplateForm, TemplateDetail } from "./admin/pages/TemplateDetail";

const queryClient = new QueryClient();

function RequireAdmin() {
  const authed = typeof window !== 'undefined' && localStorage.getItem('adminAuthed') === 'true';
  const location = useLocation();
  if (!authed) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route element={<RequireAdmin />}> 
            <Route element={<AdminLayout />}> 
              <Route path="/" element={<Navigate to="/admin" replace />} />
              <Route path="/admin" element={<AdminDashboard />} />

              <Route path="/admin/plans" element={<AdminPlans />} />
              <Route path="/admin/plans/new" element={<PlanForm />} />
              <Route path="/admin/plans/:id" element={<PlanDetail />} />
              <Route path="/admin/plans/:id/edit" element={<PlanForm />} />

              <Route path="/admin/properties" element={<AdminProperties />} />
              <Route path="/admin/properties/new" element={<PropertyForm />} />
              <Route path="/admin/properties/:id" element={<PropertyDetail />} />
              <Route path="/admin/properties/:id/edit" element={<PropertyForm />} />

              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/users/new" element={<UserForm />} />
              <Route path="/admin/users/:id" element={<UserDetail />} />
              <Route path="/admin/users/:id/edit" element={<UserForm />} />

              <Route path="/admin/regions" element={<AdminRegions />} />
              <Route path="/admin/regions/new" element={<RegionForm />} />
              <Route path="/admin/regions/:id" element={<RegionDetail />} />
              <Route path="/admin/regions/:id/edit" element={<RegionForm />} />

              <Route path="/admin/notifications" element={<AdminNotifications />} />
              <Route path="/admin/notifications/new" element={<TemplateForm />} />
              <Route path="/admin/notifications/:id" element={<TemplateDetail />} />
              <Route path="/admin/notifications/:id/edit" element={<TemplateForm />} />

              <Route path="/admin/content" element={<SiteContent />} />
              <Route path="/admin/content/new" element={<SiteDocumentForm />} />
              <Route path="/admin/content/:id" element={<SiteDocumentDetail />} />
              <Route path="/admin/content/:id/edit" element={<SiteDocumentForm />} />

              <Route path="/admin/analytics" element={<AdminAnalytics />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
