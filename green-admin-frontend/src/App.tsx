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
import AdminRegister from "./admin/pages/Register";
import AdminVerifyEmail from "./admin/pages/VerifyEmail";
import AdminProjects from "./admin/pages/Projects";
import ProjectDetail from "./admin/pages/ProjectDetail";
import ProjectForm from "./admin/pages/ProjectForm";
import SiteContent from "./admin/pages/SiteContent";
import { SiteDocumentForm, SiteDocumentDetail } from "./admin/pages/SiteContentDetail";
import { PlanForm, PlanDetail } from "./admin/pages/PlanDetail";
import { PropertyDetail } from "./admin/pages/PropertyDetail";
import PropertyNew from "./admin/pages/PropertyNew";
import { UserForm, UserDetail } from "./admin/pages/UserDetail";
import { RegionForm, RegionDetail } from "./admin/pages/RegionDetail";
import { TemplateForm, TemplateDetail } from "./admin/pages/TemplateDetail";
import Requests from "./admin/pages/Requests";
import BuildRequestDetail from "./admin/pages/BuildRequestDetail";
import ConstructionRequestDetail from "./admin/pages/ConstructionRequestDetail";
import PropertyTransactions from "./admin/pages/PropertyTransactions";
import PropertyTransactionDetail from "./admin/pages/PropertyTransactionDetail";
import { useAuth } from "./admin/hooks/useAuth";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

function RequireAdmin() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
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
        <ScrollToTop />
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/auth/login" element={<AdminLogin />} />
          <Route path="/register" element={<AdminRegister />} />
          <Route path="/auth/register" element={<AdminRegister />} />
          <Route path="/verify-email" element={<AdminVerifyEmail />} />
          <Route path="/auth/verify-email" element={<AdminVerifyEmail />} />

          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Navigate to="/admin" replace />} />
              <Route path="/admin" element={<AdminDashboard />} />

              <Route path="/admin/plans" element={<AdminPlans />} />
              <Route path="/admin/plans/new" element={<PlanForm />} />
              <Route path="/admin/plans/:id" element={<PlanDetail />} />
              <Route path="/admin/plans/:id/edit" element={<PlanForm />} />

              <Route path="/admin/properties" element={<AdminProperties />} />
              <Route path="/admin/properties/new" element={<PropertyNew />} />
              <Route path="/admin/properties/:id" element={<PropertyDetail />} />
              <Route path="/admin/properties/:id/edit" element={<PropertyNew />} />

              <Route path="/admin/projects" element={<AdminProjects />} />
              <Route path="/admin/projects/new" element={<ProjectForm />} />
              <Route path="/admin/projects/:id" element={<ProjectDetail />} />
              <Route path="/admin/projects/:id/edit" element={<ProjectForm />} />

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

              <Route path="/admin/requests" element={<Requests />} />
              <Route path="/admin/requests/build/:id" element={<BuildRequestDetail />} />
              <Route path="/admin/requests/construction/:id" element={<ConstructionRequestDetail />} />

              <Route path="/admin/property-transactions" element={<PropertyTransactions />} />
              <Route path="/admin/property-transactions/:id" element={<PropertyTransactionDetail />} />

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
