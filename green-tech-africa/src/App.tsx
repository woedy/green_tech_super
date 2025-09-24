import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import Projects from "./pages/Projects";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyEmail from "./pages/auth/VerifyEmail";
import AccountDashboard from "./pages/account/Dashboard";
import Requests from "./pages/account/Requests";
import RequestDetail from "./pages/account/RequestDetail";
import Plans from "./pages/plans/Plans";
import PlanDetail from "./pages/plans/PlanDetail";
import RequestBuild from "./pages/plans/RequestBuild";
import Quotes from "./pages/account/Quotes";
import QuoteDetail from "./pages/account/QuoteDetail";
import Messages from "./pages/account/Messages";
import MessageThread from "./pages/account/MessageThread";
import Appointments from "./pages/account/Appointments";
import AccountProjects from "./pages/account/Projects";
import ProjectDetail from "./pages/account/ProjectDetail";
import Favorites from "./pages/account/Favorites";
import Profile from "./pages/account/Profile";
import NotificationSettings from "./pages/account/NotificationSettings";
import Documents from "./pages/account/Documents";
import Payments from "./pages/account/Payments";
import SavedSearches from "./pages/account/SavedSearches";
import PropertyInquiry from "./pages/PropertyInquiry";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import { toast } from "sonner";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const message = (error as any)?.message || "Something went wrong";
      toast.error(message);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      const message = (error as any)?.message || "Something went wrong";
      toast.error(message);
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/properties/:id/inquire" element={<PropertyInquiry />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          {/* Auth */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot" element={<ForgotPassword />} />
          <Route path="/auth/verify" element={<VerifyEmail />} />
          {/* Plans and Request to Build */}
          <Route path="/plans" element={<Plans />} />
          <Route path="/plans/:slug" element={<PlanDetail />} />
          <Route path="/plans/:slug/request" element={<RequestBuild />} />
          {/* Customer Dashboard */}
          <Route path="/account" element={<ProtectedRoute><AccountDashboard /></ProtectedRoute>} />
          <Route path="/account/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
          <Route path="/account/requests/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
          <Route path="/account/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
          <Route path="/account/quotes/:id" element={<ProtectedRoute><QuoteDetail /></ProtectedRoute>} />
          <Route path="/account/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/account/messages/:id" element={<ProtectedRoute><MessageThread /></ProtectedRoute>} />
          <Route path="/account/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
          <Route path="/account/projects" element={<ProtectedRoute><AccountProjects /></ProtectedRoute>} />
          <Route path="/account/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          <Route path="/account/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/account/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/account/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
          <Route path="/account/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
          <Route path="/account/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/account/saved-searches" element={<ProtectedRoute><SavedSearches /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
