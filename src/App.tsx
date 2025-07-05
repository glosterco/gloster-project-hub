
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import DatabaseChangeMonitor from "@/components/DatabaseChangeMonitor";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import PaymentDetail from "./pages/PaymentDetail";
import SubmissionView from "./pages/SubmissionView";
import SubmissionPreview from "./pages/SubmissionPreview";
import EmailAccess from "./pages/EmailAccess";
import EmailPreview from "./pages/EmailPreview";
import DataViewer from "./pages/DataViewer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <DatabaseChangeMonitor />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/payment/:id" element={<PaymentDetail />} />
            <Route path="/submission/:id" element={<SubmissionView />} />
            <Route path="/submission/:id/preview" element={<SubmissionPreview />} />
            <Route path="/submission-view" element={<SubmissionView />} />
            <Route path="/submission-preview" element={<SubmissionPreview />} />
            <Route path="/email-access" element={<EmailAccess />} />
            <Route path="/email/:id" element={<EmailPreview />} />
            <Route path="/data-viewer" element={<DataViewer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
