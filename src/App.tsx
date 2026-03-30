import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import ForRecruiters from "./pages/ForRecruiters";
import ForTalents from "./pages/ForTalents";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import GetStarted from "./pages/GetStarted";
import TalentSignup from "./pages/signup/TalentSignup";
import RecruiterSignup from "./pages/signup/RecruiterSignup";
import TalentOverview from "./pages/talent/TalentOverview";
import TalentApplications from "./pages/talent/TalentApplications";
import TalentOffers from "./pages/talent/TalentOffers";
import TalentProfile from "./pages/talent/TalentProfile";
import TalentServices from "./pages/talent/TalentServices";
import TalentSupportTickets from "./pages/talent/TalentSupportTickets";
import RecruiterOverview from "./pages/recruiter/RecruiterOverview";
import RecruiterJobs from "./pages/recruiter/RecruiterJobs";
import RecruiterApplicants from "./pages/recruiter/RecruiterApplicants";
import RecruiterInterviewers from "./pages/recruiter/RecruiterInterviewers";
import RecruiterInterviews from "./pages/recruiter/RecruiterInterviews";
import RecruiterPipeline from "./pages/recruiter/RecruiterPipeline";
import RecruiterTickets from "./pages/recruiter/RecruiterTickets";
import RecruiterLogin from "./pages/recruiter/RecruiterLogin";
import NotFound from "./pages/NotFound";
import CompanyProfile from "@/pages/recruiterAdmin/CompanyProfile";
import RecruiterProfile from "./pages/recruiter/RecruiterProfile";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import TechnicalInterviewLogin from "./pages/technicalInterview/TechnicalInterviewLogin";
import TechnicalInterviewOverview from "./pages/technicalInterview/TechnicalInterviewOverview";
import TechnicalInterviewInterviews from "./pages/technicalInterview/TechnicalInterviewInterviews";
import TechnicalInterviewProfile from "./pages/technicalInterview/TechnicalInterviewProfile";
import LeadershipInterviewLogin from "./pages/leadershipInterview/LeadershipInterviewLogin";
import LeadershipInterviewOverview from "./pages/leadershipInterview/LeadershipInterviewOverview";
import LeadershipInterviewInterviews from "./pages/leadershipInterview/LeadershipInterviewInterviews";
// (removed LeadershipInterviewReview import)
import LeadershipInterviewProfile from "./pages/leadershipInterview/LeadershipInterviewProfile";
// (removed LeadershipInterviewSettings import)
import TAInterviews from "./pages/talent/interviews/TAInterviews";
import ITInterviews from "./pages/talent/interviews/ITInterviews";
import LeadershipInterviews from "./pages/talent/interviews/LeadershipInterviews";
import Services from "./pages/Services";
import ServiceDetails from "./pages/ServiceDetails";
import OwnerLogin from "./pages/owner/OwnerLogin";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerUsers from "./pages/owner/OwnerUsers";
import OwnerStatistics from "./pages/owner/OwnerStatistics";
import OwnerSettings from "./pages/owner/OwnerSettings";
import OwnerAddRecruiter from "./pages/owner/OwnerAddRecruiter";
import OwnerSubscriptions from "./pages/owner/OwnerSubscriptions";
import RecruiterAdminOverview from "./pages/recruiterAdmin/RecruiterAdminOverview";
import RecruiterAdminUsers from "./pages/recruiterAdmin/RecruiterAdminUsers";
import RecruiterAdminPayment from "./pages/recruiterAdmin/RecruiterAdminPayment";
import RecruiterAdminTickets from "./pages/recruiterAdmin/RecruiterAdminTickets";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

import GlobalChatbot from "@/components/GlobalChatbot";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/for-company" element={<ForRecruiters />} />
              <Route path="/for-talents" element={<ForTalents />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/get-started" element={<GetStarted />} />
              <Route path="/services" element={<Services />} />
              <Route path="/services/:id" element={<ServiceDetails />} />
              <Route path="/signup/talent" element={<TalentSignup />} />
              <Route path="/signup/company" element={<RecruiterSignup />} />
              <Route path="/signup/employer" element={<Navigate to="/signup/company" replace />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              
              {/* Talent Routes - Protected */}
              <Route
                path="/talent/overview"
                element={
                  <ProtectedRoute allowedRoles={['talent']}>
                    <TalentOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/talent/interviews/ta"
                element={
                  <ProtectedRoute allowedRoles={['talent']}>
                    <TAInterviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/talent/interviews/it"
                element={
                  <ProtectedRoute allowedRoles={['talent']}>
                    <ITInterviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/talent/interviews/leadership"
                element={
                  <ProtectedRoute allowedRoles={['talent']}>
                    <LeadershipInterviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/talent/applications"
                element={
                  <ProtectedRoute allowedRoles={['talent']}>
                    <TalentApplications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/talent/offers"
                element={
                  <ProtectedRoute allowedRoles={['talent']}>
                    <TalentOffers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/talent/profile"
                element={
                  <ProtectedRoute allowedRoles={['talent']}>
                    <TalentProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/talent/support-tickets"
                element={
                  <ProtectedRoute allowedRoles={['talent']}>
                    <TalentSupportTickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/talent/services"
                element={
                  <ProtectedRoute allowedRoles={['talent']}>
                    <TalentServices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/talent/job/:id"
                element={
                  <ProtectedRoute allowedRoles={['talent']}>
                    <JobDetails />
                  </ProtectedRoute>
                }
              />

              {/* Recruiter Routes - Protected */}
              <Route path="/recruiter/login" element={<RecruiterLogin />} />
              <Route
                path="/recruiter/overview"
                element={
                  <ProtectedRoute allowedRoles={["recruiter"]}>
                    <RecruiterOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/jobs"
                element={
                  <ProtectedRoute allowedRoles={["recruiter"]}>
                    <RecruiterJobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/applicants"
                element={
                  <ProtectedRoute allowedRoles={["recruiter"]}>
                    <RecruiterApplicants />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/interviewers"
                element={
                  <ProtectedRoute allowedRoles={["recruiter"]}>
                    <RecruiterInterviewers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/pipeline"
                element={
                  <ProtectedRoute allowedRoles={["recruiter"]}>
                    <RecruiterPipeline />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/interviews"
                element={
                  <ProtectedRoute allowedRoles={["recruiter"]}>
                    <RecruiterInterviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/tickets"
                element={
                  <ProtectedRoute allowedRoles={["recruiter"]}>
                    <RecruiterTickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/profile"
                element={
                  <ProtectedRoute allowedRoles={["recruiter"]}>
                    <RecruiterProfile />
                  </ProtectedRoute>
                }
              />
              <Route path="/recruiter" element={<Navigate to="/recruiter/overview" replace />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetails />} />
              <Route path="/job/:id" element={<JobDetails />} />

              {/* Technical Interviewer Routes - Protected */}
              <Route path="/technical-interviewer/login" element={<TechnicalInterviewLogin />} />
              <Route
                path="/technical-interviewer/overview"
                element={
                  <ProtectedRoute allowedRoles={["technical-interviewer"]}>
                    <TechnicalInterviewOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/technical-interviewer/interviews"
                element={
                  <ProtectedRoute allowedRoles={["technical-interviewer"]}>
                    <TechnicalInterviewInterviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/technical-interviewer/profile"
                element={
                  <ProtectedRoute allowedRoles={["technical-interviewer"]}>
                    <TechnicalInterviewProfile />
                  </ProtectedRoute>
                }
              />
              
              {/* Leadership Interviewer Routes - Protected */}
              <Route path="/leadership-interviewer/login" element={<LeadershipInterviewLogin />} />
              <Route
                path="/leadership-interviewer/overview"
                element={
                  <ProtectedRoute allowedRoles={["leadership-interviewer"]}>
                    <LeadershipInterviewOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leadership-interviewer/interviews"
                element={
                  <ProtectedRoute allowedRoles={["leadership-interviewer"]}>
                    <LeadershipInterviewInterviews />
                  </ProtectedRoute>
                }
              />

















              <Route
                path="/leadership-interviewer/profile"
                element={
                  <ProtectedRoute allowedRoles={["leadership-interviewer"]}>
                    <LeadershipInterviewProfile />
                  </ProtectedRoute>
                }
              />

















              
              {/* Owner Routes - Protected */}
              <Route path="/owner/login" element={<OwnerLogin />} />
              <Route
                path="/owner/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["owner", "superadmin"]}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/users"
                element={
                  <ProtectedRoute allowedRoles={["owner", "superadmin"]}>
                    <OwnerUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/users/add-recruiter"
                element={
                  <ProtectedRoute allowedRoles={["owner", "superadmin"]}>
                    <OwnerAddRecruiter />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/recruiters"
                element={
                  <ProtectedRoute allowedRoles={["owner", "superadmin"]}>
                    <OwnerUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/talents"
                element={
                  <ProtectedRoute allowedRoles={["owner", "superadmin"]}>
                    <OwnerUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/interviewers"
                element={
                  <ProtectedRoute allowedRoles={["owner", "superadmin"]}>
                    <OwnerUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/subscriptions"
                element={
                  <ProtectedRoute allowedRoles={["owner", "superadmin"]}>
                    <OwnerSubscriptions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/statistics"
                element={
                  <ProtectedRoute allowedRoles={["owner", "superadmin"]}>
                    <OwnerStatistics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/settings"
                element={
                  <ProtectedRoute allowedRoles={["owner", "superadmin"]}>
                    <OwnerSettings />
                  </ProtectedRoute>
                }
              />
              
              {/* Recruiter Admin Routes - Protected */}
              <Route
                path="/recruiter-admin/overview"
                element={
                  <ProtectedRoute allowedRoles={["recruiter", "superadmin"]}>
                    <RecruiterAdminOverview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter-admin/users"
                element={
                  <ProtectedRoute allowedRoles={["recruiter", "superadmin"]}>
                    <RecruiterAdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter-admin/company-profile"
                element={
                  <ProtectedRoute allowedRoles={["recruiter", "superadmin"]}>
                    <CompanyProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter-admin/payment"
                element={
                  <ProtectedRoute allowedRoles={["recruiter", "superadmin"]}>
                    <RecruiterAdminPayment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter-admin/tickets"
                element={
                  <ProtectedRoute allowedRoles={["recruiter", "superadmin"]}>
                    <RecruiterAdminTickets />
                  </ProtectedRoute>
                }
              />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <GlobalChatbot />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
