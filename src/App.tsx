import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { RouteProtection } from "@/components/RouteProtection";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DashboardMandante from "./pages/DashboardMandante";
import RoleSelection from "./pages/RoleSelection";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectDetailMandante from "./pages/ProjectDetailMandante";
import ProjectAccess from "./pages/ProjectAccess";
import PaymentDetail from "./pages/PaymentDetail";
import SubmissionView from "./pages/SubmissionView";
import SubmissionPreview from "./pages/SubmissionPreview";
import EmailAccess from "./pages/EmailAccess";
import EmailPreview from "./pages/EmailPreview";
import DataViewer from "./pages/DataViewer";
import ContractorAccess from "./pages/ContractorAccess";
import Pricing from "./pages/Pricing";
import ExecutiveSummary from "./pages/ExecutiveSummary";
import ExecutiveSummaryMandante from "./pages/ExecutiveSummaryMandante";
import Licitaciones from "./pages/Licitaciones";
import MKT from "./pages/MKT";
import RRSS from "./pages/RRSS";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <RouteProtection>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/register" element={<Register />} />
              <Route path="/role-selection" element={<RoleSelection />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard-mandante" element={<DashboardMandante />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/project-mandante/:id" element={<ProjectDetailMandante />} />
              <Route path="/project-access/:id" element={<ProjectAccess />} />
              <Route path="/submission/:id" element={<SubmissionView />} />
              <Route path="/submission/:id/preview" element={<SubmissionPreview />} />
              <Route path="/submission-view" element={<SubmissionView />} />
              <Route path="/submission-preview" element={<SubmissionPreview />} />
              <Route path="/email-access" element={<EmailAccess />} />
              <Route path="/email/:id" element={<EmailPreview />} />
              <Route path="/data-viewer" element={<DataViewer />} />
              <Route path="/contractor-access/:paymentId" element={<ContractorAccess />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/executive-summary" element={<ExecutiveSummary />} />
              <Route path="/executive-summary-mandante" element={<ExecutiveSummaryMandante />} />
              <Route path="/licitaciones" element={<Licitaciones />} />
              <Route path="/home" element={<MKT />} />
              <Route path="/rrss" element={<RRSS />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </RouteProtection>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
