import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
import AgentShell from "./components/layout/AgentShell";
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

          {/* Auth */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/forgot" element={<ForgotPassword />} />

          {/* Agent surfaces */}
          <Route path="/dashboard" element={<AgentDashboard />} />
          <Route path="/analytics" element={<AgentAnalytics />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/quotes/new" element={<QuoteBuilder />} />
          <Route path="/quotes/:id" element={<QuoteDetail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<MessageThread />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<NotificationSettings />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
