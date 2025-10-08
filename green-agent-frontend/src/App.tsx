import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Auth
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Agent Portal
import AgentDashboard from "./pages/agent/Dashboard";
import AgentAnalytics from "./pages/agent/Analytics";
import Leads from "./pages/agent/Leads";
import LeadDetail from "./pages/agent/LeadDetail";
import Calendar from "./pages/agent/Calendar";

// Reuse existing account components for quotes/projects/messages/profile
import Quotes from "./pages/agent/Quotes";
import QuoteDetail from "./pages/account/QuoteDetail";
import Projects from "./pages/agent/Projects";
import ProjectDetail from "./pages/agent/ProjectDetail";
import Messages from "./pages/account/Messages";
import MessageThread from "./pages/agent/MessageThread";
import Profile from "./pages/account/Profile";
import NotificationSettings from "./pages/account/NotificationSettings";
import QuoteBuilder from "./pages/agent/QuoteBuilder";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Root → Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Auth - Public routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/forgot" element={<ForgotPassword />} />

          {/* Agent surfaces - Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AgentAnalytics /></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
          <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
          <Route path="/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
          <Route path="/quotes/new" element={<ProtectedRoute><QuoteBuilder /></ProtectedRoute>} />
          <Route path="/quotes/:id" element={<ProtectedRoute><QuoteDetail /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/:id" element={<ProtectedRoute><MessageThread /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
