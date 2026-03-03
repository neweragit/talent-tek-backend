import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import ForEmployers from "./pages/ForEmployers";
import ForTalents from "./pages/ForTalents";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import GetStarted from "./pages/GetStarted";
import TalentSignup from "./pages/signup/TalentSignup";
import EmployerSignup from "./pages/signup/EmployerSignup";
import TalentOverview from "./pages/talent/TalentOverview";
import TalentApplications from "./pages/talent/TalentApplications";
import TalentProfile from "./pages/talent/TalentProfile";
import TalentSupportTickets from "./pages/talent/TalentSupportTickets";
import EmployerOverview from "./pages/employer/EmployerOverview";
import EmployerJobs from "./pages/employer/EmployerJobs";
import EmployerInterviewers from "./pages/employer/EmployerInterviewers";
import EmployerInterviews from "./pages/employer/EmployerInterviews";
import EmployerTalentAcquisitionInterviews from "./pages/employer/EmployerTalentAcquisitionInterviews";
import EmployerTickets from "./pages/employer/EmployerTickets";
import NotFound from "./pages/NotFound";
import CompanyProfile from "@/pages/employerAdmin/CompanyProfile";
import EmployerSettings from "./pages/employer/EmployerSettings";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import TalentOnboarding from "./pages/talent/TalentOnboarding";
import TalentOffers from "./pages/talent/TalentOffers";
import TAInterviews from "./pages/talent/interviews/TAInterviews";
import ITInterviews from "./pages/talent/interviews/ITInterviews";
import LeadershipInterviews from "./pages/talent/interviews/LeadershipInterviews";
import TechnicalInterviewLogin from "./pages/technicalInterview/TechnicalInterviewLogin";
import TechnicalInterviewOverview from "./pages/technicalInterview/TechnicalInterviewOverview";
import TechnicalInterviewInterviews from "./pages/technicalInterview/TechnicalInterviewInterviews";
import TechnicalInterviewProfile from "./pages/technicalInterview/TechnicalInterviewProfile";
import LeadershipInterviewLogin from "./pages/leadershipInterview/LeadershipInterviewLogin";
import LeadershipInterviewOverview from "./pages/leadershipInterview/LeadershipInterviewOverview";
import LeadershipInterviewInterviews from "./pages/leadershipInterview/LeadershipInterviewInterviews";
import LeadershipInterviewProfile from "./pages/leadershipInterview/LeadershipInterviewProfile";
import TalentAcquisitionLogin from "./pages/talentAcquisition/TalentAcquisitionLogin";
import TalentAcquisitionOverview from "./pages/talentAcquisition/TalentAcquisitionOverview";
import TalentAcquisitionInterviews from "./pages/talentAcquisition/TalentAcquisitionInterviews";
import TalentAcquisitionProfile from "./pages/talentAcquisition/TalentAcquisitionProfile";
import TalentServices from "./pages/talent/TalentServices";
import Services from "./pages/Services";
import ServiceDetails from "./pages/ServiceDetails";
import OwnerLogin from "./pages/owner/OwnerLogin";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerUsers from "./pages/owner/OwnerUsers";
import OwnerStatistics from "./pages/owner/OwnerStatistics";
import OwnerSettings from "./pages/owner/OwnerSettings";
import OwnerAddEmployer from "./pages/owner/OwnerAddEmployer";
import OwnerSubscriptions from "./pages/owner/OwnerSubscriptions";
import OwnerTickets from "./pages/owner/OwnerTickets";
import EmployerAdminOverview from "./pages/employerAdmin/EmployerAdminOverview";
import EmployerAdminUsers from "./pages/employerAdmin/EmployerAdminUsers";
import EmployerAdminTickets from "./pages/employerAdmin/EmployerAdminTickets";
import EmployerAdminPayment from "./pages/employerAdmin/EmployerAdminPayment";
import EmployerAdminSettings from "./pages/employerAdmin/EmployerAdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/for-employers" element={<ForEmployers />} />
            <Route path="/for-talents" element={<ForTalents />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetails />} />
            <Route path="/signup/talent" element={<TalentSignup />} />
            <Route path="/signup/employer" element={<EmployerSignup />} />
            
            {/* Talent Routes */}
            <Route path="/talent/onboarding" element={<ProtectedRoute allowedRoles={['talent']}><TalentOnboarding /></ProtectedRoute>} />
            <Route path="/talent/overview" element={<ProtectedRoute allowedRoles={['talent']}><TalentOverview /></ProtectedRoute>} />
            <Route path="/talent/interviews/ta" element={<ProtectedRoute allowedRoles={['talent']}><TAInterviews /></ProtectedRoute>} />
            <Route path="/talent/interviews/it" element={<ProtectedRoute allowedRoles={['talent']}><ITInterviews /></ProtectedRoute>} />
            <Route path="/talent/interviews/leadership" element={<ProtectedRoute allowedRoles={['talent']}><LeadershipInterviews /></ProtectedRoute>} />
            <Route path="/talent/applications" element={<ProtectedRoute allowedRoles={['talent']}><TalentApplications /></ProtectedRoute>} />
            <Route path="/talent/offers" element={<ProtectedRoute allowedRoles={['talent']}><TalentOffers /></ProtectedRoute>} />
            <Route path="/talent/jobs" element={<ProtectedRoute allowedRoles={['talent']}><TalentApplications /></ProtectedRoute>} />
            <Route path="/talent/profile" element={<ProtectedRoute allowedRoles={['talent']}><TalentProfile /></ProtectedRoute>} />
            <Route path="/talent/messages" element={<ProtectedRoute allowedRoles={['talent']}><TalentSupportTickets /></ProtectedRoute>} />
            <Route path="/talent/support-tickets" element={<ProtectedRoute allowedRoles={['talent']}><TalentSupportTickets /></ProtectedRoute>} />
            <Route path="/talent/services" element={<ProtectedRoute allowedRoles={['talent']}><TalentServices /></ProtectedRoute>} />
            
            {/* Employer Routes */}
            <Route path="/employer/overview" element={<ProtectedRoute allowedRoles={['employer', 'admin', 'superadmin']}><EmployerOverview /></ProtectedRoute>} />
            <Route path="/employer/jobs" element={<ProtectedRoute allowedRoles={['employer', 'admin', 'superadmin']}><EmployerJobs /></ProtectedRoute>} />
            <Route path="/employer/interviewers" element={<ProtectedRoute allowedRoles={['employer', 'admin', 'superadmin']}><EmployerInterviewers /></ProtectedRoute>} />
            <Route path="/employer/pipeline" element={<ProtectedRoute allowedRoles={['employer', 'admin', 'superadmin']}><EmployerInterviews /></ProtectedRoute>} />
            <Route path="/employer/interviews" element={<ProtectedRoute allowedRoles={['employer', 'admin', 'superadmin']}><EmployerInterviews /></ProtectedRoute>} />
            <Route path="/employer/talent-acquisition-interviews" element={<ProtectedRoute allowedRoles={['employer', 'admin', 'superadmin']}><EmployerTalentAcquisitionInterviews /></ProtectedRoute>} />
            <Route path="/employer/tickets" element={<ProtectedRoute allowedRoles={['employer', 'admin', 'superadmin']}><EmployerTickets /></ProtectedRoute>} />
            <Route path="/employer/settings" element={<ProtectedRoute allowedRoles={['employer', 'admin', 'superadmin']}><EmployerSettings /></ProtectedRoute>} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetails />} />

            {/* Company Profile Route */}
            <Route path="/company-profile" element={<ProtectedRoute allowedRoles={['admin', 'superadmin', 'employer']}><CompanyProfile /></ProtectedRoute>} />
            
            {/* Technical Interviewer Routes */}
            <Route path="/technical-interviewer/login" element={<TechnicalInterviewLogin />} />
            <Route path="/technical-interviewer/overview" element={<ProtectedRoute allowedRoles={['interviewer']}><TechnicalInterviewOverview /></ProtectedRoute>} />
            <Route path="/technical-interviewer/interviews" element={<ProtectedRoute allowedRoles={['interviewer']}><TechnicalInterviewInterviews /></ProtectedRoute>} />
            <Route path="/technical-interviewer/profile" element={<ProtectedRoute allowedRoles={['interviewer']}><TechnicalInterviewProfile /></ProtectedRoute>} />
            
            {/* Leadership Interviewer Routes */}
            <Route path="/leadership-interviewer/login" element={<LeadershipInterviewLogin />} />
            <Route path="/leadership-interviewer/overview" element={<ProtectedRoute allowedRoles={['interviewer']}><LeadershipInterviewOverview /></ProtectedRoute>} />
            <Route path="/leadership-interviewer/interviews" element={<ProtectedRoute allowedRoles={['interviewer']}><LeadershipInterviewInterviews /></ProtectedRoute>} />
            <Route path="/leadership-interviewer/profile" element={<ProtectedRoute allowedRoles={['interviewer']}><LeadershipInterviewProfile /></ProtectedRoute>} />
            
            {/* Talent Acquisition Interviewer Routes */}
            <Route path="/talent-acquisition/login" element={<TalentAcquisitionLogin />} />
            <Route path="/talent-acquisition/overview" element={<ProtectedRoute allowedRoles={['interviewer']}><TalentAcquisitionOverview /></ProtectedRoute>} />
            <Route path="/talent-acquisition/interviews" element={<ProtectedRoute allowedRoles={['interviewer']}><TalentAcquisitionInterviews /></ProtectedRoute>} />
            <Route path="/talent-acquisition/profile" element={<ProtectedRoute allowedRoles={['interviewer']}><TalentAcquisitionProfile /></ProtectedRoute>} />
            
            {/* Owner Routes */}
            <Route path="/owner/login" element={<OwnerLogin />} />
            <Route path="/owner/dashboard" element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/owner/users" element={<ProtectedRoute allowedRoles={['owner']}><OwnerUsers /></ProtectedRoute>} />
            <Route path="/owner/users/add-employer" element={<ProtectedRoute allowedRoles={['owner']}><OwnerAddEmployer /></ProtectedRoute>} />
            <Route path="/owner/employers" element={<ProtectedRoute allowedRoles={['owner']}><OwnerUsers /></ProtectedRoute>} />
            <Route path="/owner/talents" element={<ProtectedRoute allowedRoles={['owner']}><OwnerUsers /></ProtectedRoute>} />
            <Route path="/owner/interviewers" element={<ProtectedRoute allowedRoles={['owner']}><OwnerUsers /></ProtectedRoute>} />
            <Route path="/owner/tickets" element={<ProtectedRoute allowedRoles={['owner']}><OwnerTickets /></ProtectedRoute>} />
            <Route path="/owner/subscriptions" element={<ProtectedRoute allowedRoles={['owner']}><OwnerSubscriptions /></ProtectedRoute>} />
            <Route path="/owner/statistics" element={<ProtectedRoute allowedRoles={['owner']}><OwnerStatistics /></ProtectedRoute>} />
            <Route path="/owner/settings" element={<ProtectedRoute allowedRoles={['owner']}><OwnerSettings /></ProtectedRoute>} />
            
            {/* Employer Admin Routes */}
            <Route path="/employer-admin/overview" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><EmployerAdminOverview /></ProtectedRoute>} />
            <Route path="/employer-admin/users" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><EmployerAdminUsers /></ProtectedRoute>} />
            <Route path="/employer-admin/tickets" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><EmployerAdminTickets /></ProtectedRoute>} />
            <Route path="/employer-admin/company-profile" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><CompanyProfile /></ProtectedRoute>} />
            <Route path="/employer-admin/payment" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><EmployerAdminPayment /></ProtectedRoute>} />
            <Route path="/employer-admin/settings" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><EmployerAdminSettings /></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
