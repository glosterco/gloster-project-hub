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
import RFIDetail from "./pages/RFIDetail";
import AdicionalDetail from "./pages/AdicionalDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* RUTAS PÚBLICAS - fuera de RouteProtection */}
            <Route path="/email-access" element={<EmailAccess />} />
            <Route path="/project-access/:id" element={<ProjectAccess />} />
            <Route path="/submission/:id/preview" element={<SubmissionPreview />} />
            <Route path="/contractor-access/:paymentId" element={<ContractorAccess />} />
            <Route path="/rfi/:id" element={<RFIDetail />} />
            <Route path="/adicional/:id" element={<AdicionalDetail />} />
            <Route path="/home" element={<MKT />} />
            <Route path="/rrss" element={<RRSS />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            
            {/* RUTAS PROTEGIDAS - dentro de RouteProtection */}
            <Route path="/role-selection" element={<RouteProtection><RoleSelection /></RouteProtection>} />
            <Route path="/dashboard" element={<RouteProtection><Dashboard /></RouteProtection>} />
            <Route path="/dashboard-mandante" element={<RouteProtection><DashboardMandante /></RouteProtection>} />
            <Route path="/project/:id" element={<RouteProtection><ProjectDetail /></RouteProtection>} />
            <Route path="/project-mandante/:id" element={<RouteProtection><ProjectDetailMandante /></RouteProtection>} />
            <Route path="/payment/:id" element={<RouteProtection><PaymentDetail /></RouteProtection>} />
            <Route path="/submission/:id" element={<RouteProtection><SubmissionView /></RouteProtection>} />
            <Route path="/submission-view" element={<RouteProtection><SubmissionView /></RouteProtection>} />
            <Route path="/submission-preview" element={<RouteProtection><SubmissionPreview /></RouteProtection>} />
            <Route path="/email/:id" element={<RouteProtection><EmailPreview /></RouteProtection>} />
            <Route path="/data-viewer" element={<RouteProtection><DataViewer /></RouteProtection>} />
            <Route path="/executive-summary" element={<RouteProtection><ExecutiveSummary /></RouteProtection>} />
            <Route path="/executive-summary-mandante" element={<RouteProtection><ExecutiveSummaryMandante /></RouteProtection>} />
            <Route path="/licitaciones" element={<RouteProtection><Licitaciones /></RouteProtection>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
