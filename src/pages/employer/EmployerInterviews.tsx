import EmployerLayout from "@/components/layouts/EmployerLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { BarChart3, Filter, ChevronDown, User, Mail, MapPin, CheckCircle, AlertCircle, XCircle, Archive, Phone, Briefcase, Download, Linkedin, Github, Globe, Star, Calendar, Clock, Video, Code, Palette, PenTool, TrendingUp, FileText, Languages, Music, Smartphone, Camera, Megaphone, DollarSign } from "lucide-react";
// Removed drag drop - using buttons for safety


// Mock scheduled interviews storage (in real app, this would be in database)
const scheduledInterviews = [];

// Mock data for all jobs with their candidates
const allJobsData = {
  "1": {
    all: [
      { 
        id: 1, 
        name: "Abderraouf Abla", 
        email: "abderraouf.education@gmail.com",
        phone: "0699097459",
        location: "Algiers",
        company: "Full stack",
        appliedDate: "10/10/2025",
        matchScore: 25,
        status: "Pending Review",
        stage: null,
        services: [
          {
            id: 1,
            title: "Full-Stack Web Development",
            description: "Custom web applications using React, Node.js, and modern technologies. From concept to deployment.",
            category: "Development",
            startingPrice: 150,
            deliveryTime: "7 days",
            rating: 4.9,
            reviews: 127,
            tags: ["React", "Node.js", "MongoDB", "AWS"],
            icon: "Code"
          },
          {
            id: 2,
            title: "Mobile App Development",
            description: "Native and cross-platform mobile applications for iOS and Android with modern UI/UX.",
            category: "Development",
            startingPrice: 200,
            deliveryTime: "14 days",
            rating: 4.8,
            reviews: 89,
            tags: ["React Native", "Flutter", "iOS", "Android"],
            icon: "Smartphone"
          }
        ]
      },
    ],
    pipeline: {
      toContact: [],
      talentAcquisition: [],
      technical: [],
      leadership: [],
      offer: [],
      rejectedOffers: [],
      hired: [],
    },
    maybe: [],
    Rejected: [],
  },
  "2": {
    all: [],
    pipeline: {
      toContact: [],
      talentAcquisition: [],
      technical: [],
      leadership: [],
      offer: [],
      rejectedOffers: [],
      hired: [],
    },
    maybe: [],
    Rejected: [],
  },
  "3": {
    all: [
      { 
        id: 2, 
        name: "Sara Bensalem", 
        email: "sara.bensalem@email.com",
        phone: "0666112233",
        location: "Algiers",
        company: "Tech Solutions",
        appliedDate: "11/11/2025",
        matchScore: 78,
        status: "Pending Review",
        stage: null,
        services: [
          {
            id: 3,
            title: "Brand Identity & Logo Design",
            description: "Complete brand identity package including logo, color palette, typography, and brand guidelines.",
            category: "Design",
            startingPrice: 89,
            deliveryTime: "5 days",
            rating: 4.8,
            reviews: 89,
            tags: ["Logo Design", "Branding", "Illustrator", "Figma"],
            icon: "Palette"
          },
          {
            id: 4,
            title: "UI/UX Design for Web & Mobile",
            description: "Modern, user-friendly interface designs with prototypes and design systems included.",
            category: "Design",
            startingPrice: 120,
            deliveryTime: "10 days",
            rating: 4.9,
            reviews: 73,
            tags: ["UI/UX", "Figma", "Prototyping", "Responsive"],
            icon: "Palette"
          }
        ]
      },
      { 
        id: 3, 
        name: "Omar Khelifi", 
        email: "omar.khelifi@email.com",
        phone: "0777998877",
        location: "Oran",
        company: "Digital Agency",
        appliedDate: "11/12/2025",
        matchScore: 65,
        status: "Pending Review",
        stage: null
      },
    ],
    pipeline: {
      toContact: [],
      talentAcquisition: [],
      technical: [],
      leadership: [],
      offer: [],
      rejectedOffers: [],
      hired: [],
    },
    maybe: [],
    Rejected: [],
  },
};

const jobs = [
  { id: "1", title: "Mobile iOS Engineer", status: "Published", applicationsCount: 1 },
  { id: "2", title: "Mobile Android Engineer", status: "Archived", applicationsCount: 0 },
  { id: "3", title: "Full Stack Engineer", status: "Published", applicationsCount: 2 },
];

const BigTitle = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }} className="text-2xl font-bold">
    {children}
  </span>
);

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

export default function EmployerInterviews() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentEmployer, setCurrentEmployer] = useState(null);
  const [currentTeamMember, setCurrentTeamMember] = useState(null);
  const [interviewers, setInterviewers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("pipeline"); // "pipeline" or "table"
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobsData, setJobsData] = useState({});
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [screeningDialogOpen, setScreeningDialogOpen] = useState(false);
  const [viewingCandidate, setViewingCandidate] = useState(null); // For detailed view
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewingCandidate, setReviewingCandidate] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(3);
  const [viewReviewCandidate, setViewReviewCandidate] = useState(null);
  const [candidateDetailDialog, setCandidateDetailDialog] = useState(false);
  const [detailCandidate, setDetailCandidate] = useState(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [schedulingCandidate, setSchedulingCandidate] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedHours, setSelectedHours] = useState("10");
  const [selectedMinutes, setSelectedMinutes] = useState("00");
  const [interviewLink, setInterviewLink] = useState("");
  const [interviewHistory, setInterviewHistory] = useState({});
  const [selectedInterviewer, setSelectedInterviewer] = useState("");
  const [interviewType, setInterviewType] = useState(""); // talentAcquisition, technical, leadership
  const [generateOfferDialog, setGenerateOfferDialog] = useState(false);
  const [offerCandidate, setOfferCandidate] = useState(null);
  const [offerDetails, setOfferDetails] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    position: "",
    salary: "",
    startDate: "",
    benefits: "",
    workLocation: "",
  });
  const [offerGenerated, setOfferGenerated] = useState(false);
  const [offerJobMeta, setOfferJobMeta] = useState({ employmentType: "", workplace: "" });
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [selectedCandidateServices, setSelectedCandidateServices] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(60); // Default 60 minutes
  const [isSchedulingInterview, setIsSchedulingInterview] = useState(false);
  const [isMovingCandidate, setIsMovingCandidate] = useState(false);

  // Close viewing candidate panel when switching tabs
  useEffect(() => {
    setViewingCandidate(null);
  }, [activeTab]);

  // Load employer and jobs data
  useEffect(() => {
    const loadEmployerAndJobs = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Get current employer data via team membership
        const { data: teamMember, error: teamError } = await supabase
          .from('employer_team_members')
          .select(`
            id,
            employer_id,
            role,
            first_name,
            last_name,
            employers (
              id,
              company_name,
              industry,
              logo_url
            )
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        if (teamError) {
          console.error('Error loading team membership:', teamError);
          throw teamError;
        }

        if (!teamMember) {
          toast({
            title: "Access Denied",
            description: "You are not associated with any employer account.",
            variant: "destructive",
          });
          return;
        }

        const employer = Array.isArray(teamMember.employers) 
          ? teamMember.employers[0] 
          : teamMember.employers;
        
        console.log('🏢 Current Employer:', employer);
        console.log('👤 User ID:', user.id);
        console.log('🔑 Employer ID for jobs filter:', employer.id);
        console.log('👥 Current Team Member:', teamMember);
        
        setCurrentEmployer(employer);
        setCurrentTeamMember({
          id: teamMember.id,
          name: `${teamMember.first_name || ''} ${teamMember.last_name || ''}`.trim() || 'Team Member',
          role: teamMember.role,
          firstName: teamMember.first_name,
          lastName: teamMember.last_name
        });

        // Load interviewers for this employer
        const { data: interviewersData, error: interviewersError } = await supabase
          .from('interviewers')
          .select('id, full_name, email, role, expertise, interview_type, status')
          .eq('employer_id', employer.id)
          .eq('status', 'active')
          .order('full_name', { ascending: true });

        if (interviewersError) {
          console.error('Error loading interviewers:', interviewersError);
        } else {
          console.log('👥 Interviewers loaded:', interviewersData);
          // Transform to match expected format
          const transformedInterviewers = (interviewersData || []).map(interviewer => ({
            id: interviewer.id, // UUID from database
            name: interviewer.full_name,
            role: interviewer.role,
            email: interviewer.email,
            expertise: interviewer.expertise,
            interviewType: interviewer.interview_type
          }));
          console.log('🔄 Transformed interviewers:', transformedInterviewers);
          setInterviewers(transformedInterviewers);
        }

        // Load jobs for this employer (include unpublished, exclude only archived)
        const { data: jobPostings, error: jobsError } = await supabase
          .from('jobs')
          .select(`
            id,
            title,
            status,
            description,
            location,
            employment_type,
            workplace,
            experience_level,
            skills_required,
            created_at,
            updated_at
          `)
          .eq('employer_id', employer.id)
          .in('status', ['draft', 'published', 'unpublished'])
          .order('created_at', { ascending: false });

        if (jobsError) {
          console.error('Error loading jobs:', jobsError);
          throw jobsError;
        }

        console.log('📋 Jobs loaded:', jobPostings);
        console.log('📊 Number of jobs:', jobPostings?.length || 0);

        if (!jobPostings || jobPostings.length === 0) {
          setJobs([]);
          setJobsData({});
          setSelectedJob(null);
          toast({
            title: "No Jobs Found",
            description: "Create your first job posting to start receiving applications.",
          });
          return;
        }

        // Load applications for each job
        const jobsWithApplications = await Promise.all(
          jobPostings.map(async (job) => {
            const { data: applications, error: appsError } = await supabase
              .from('applications')
              .select(`
                id,
                talent_id,
                status,
                stage,
                match_score,
                cover_letter,
                resume_url,
                applied_at,
                talents (
                  id,
                  user_id,
                  full_name,
                  phone_number,
                  city,
                  skills,
                  years_of_experience,
                  portfolio_url
                ),
                interviews(
                  id,
                  status,
                  scheduled_date,
                  interview_type,
                  interviewer_id,
                  team_member_id,
                  interviewers(full_name, role),
                  employer_team_members(id, first_name, last_name, role),
                  interview_reviews(rating, review_text, created_at)
                ),
                offers (
                  id,
                  position,
                  salary,
                  start_date,
                  work_location,
                  status,
                  created_at
                )
              `)
              .eq('job_id', job.id)
              .order('applied_at', { ascending: false });

            if (appsError) {
              console.error('Error loading applications for job:', job.id, appsError);
              return {
                ...job,
                applicationsCount: 0,
                applications: []
              };
            }

            console.log('📧 Applications for job', job.title, ':', applications?.length || 0);

            // Transform applications to match the expected format
            const transformedApps = await Promise.all((applications || []).map(async (app) => {
              const talent = Array.isArray(app.talents) ? app.talents[0] : app.talents;
              
              // Get user email from users table
              let userEmail = '';
              if (talent?.user_id) {
                const { data: userData } = await supabase
                  .from('users')
                  .select('email')
                  .eq('id', talent.user_id)
                  .single();
                userEmail = userData?.email || '';
              }

              // Extract interview reviews data from interviews
              let talentAcquisitionReview = null;
              let talentAcquisitionRating = null;
              let talentAcquisitionReviewedAt = null;
              let technicalReview = null;
              let technicalRating = null;
              let technicalReviewedAt = null;
              let leadershipReview = null;
              let leadershipRating = null;
              let leadershipReviewedAt = null;
              let interview_reviews = null;

              // Find the most recent offer, if any
              const offer = app.offers && app.offers.length > 0 ? app.offers[0] : null;

              let applicationStage = app.stage;
              let applicationStatus = app.status;

              if (offer) {
                if (offer.status === 'accepted') {
                  applicationStage = 'hired';
                  applicationStatus = 'hired';
                } else if (offer.status === 'refused') {
                  applicationStage = 'rejected-offer';
                  applicationStatus = 'rejected';
                }
              }

              const statusDisplay = applicationStatus
                ? applicationStatus === 'pending'
                  ? 'Pending Review'
                  : (applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1))
                      .replace(/-(.)/g, (_, char) => ` ${char.toUpperCase()}`)
                : 'Unknown';


              if (app.interviews && Array.isArray(app.interviews)) {
                // Find talent acquisition interview and its review
                const taInterview = app.interviews.find(interview => 
                  interview.interview_type === 'talent-acquisition' && 
                  interview.interview_reviews && 
                  (Array.isArray(interview.interview_reviews) ? interview.interview_reviews.length > 0 : 
                   (typeof interview.interview_reviews === 'object' && (interview.interview_reviews as any).rating))
                );
                if (taInterview?.interview_reviews) {
                  const taReview = Array.isArray(taInterview.interview_reviews) ? 
                    taInterview.interview_reviews[0] : taInterview.interview_reviews;
                  if (taReview && typeof taReview === 'object' && 'rating' in taReview && 'review_text' in taReview) {
                    const review = taReview as any;
                    talentAcquisitionReview = review.review_text;
                    talentAcquisitionRating = review.rating;
                    talentAcquisitionReviewedAt = new Date(review.created_at).toLocaleDateString();
                  }
                }

                // Find technical interview and its review
                const techInterview = app.interviews.find(interview => 
                  interview.interview_type === 'technical' && 
                  interview.interview_reviews && 
                  (Array.isArray(interview.interview_reviews) ? interview.interview_reviews.length > 0 : 
                   (typeof interview.interview_reviews === 'object' && (interview.interview_reviews as any).rating))
                );
                if (techInterview?.interview_reviews) {
                  const techReview = Array.isArray(techInterview.interview_reviews) ? 
                    techInterview.interview_reviews[0] : techInterview.interview_reviews;
                  if (techReview && typeof techReview === 'object' && 'rating' in techReview && 'review_text' in techReview) {
                    const review = techReview as any;
                    technicalReview = review.review_text;
                    technicalRating = review.rating;
                    technicalReviewedAt = new Date(review.created_at).toLocaleDateString();
                  }
                }

                // Find leadership interview and its review
                const leadershipInterview = app.interviews.find(interview => 
                  interview.interview_type === 'leadership' && 
                  interview.interview_reviews && 
                  (Array.isArray(interview.interview_reviews) ? interview.interview_reviews.length > 0 : 
                   (typeof interview.interview_reviews === 'object' && (interview.interview_reviews as any).rating))
                );
                if (leadershipInterview?.interview_reviews) {
                  const leaderReview = Array.isArray(leadershipInterview.interview_reviews) ? 
                    leadershipInterview.interview_reviews[0] : leadershipInterview.interview_reviews;
                  if (leaderReview && typeof leaderReview === 'object' && 'rating' in leaderReview && 'review_text' in leaderReview) {
                    const review = leaderReview as any;
                    leadershipReview = review.review_text;
                    leadershipRating = review.rating;
                    leadershipReviewedAt = new Date(review.created_at).toLocaleDateString();
                  }
                }

                // Set the most recent interview_reviews for backward compatibility
                if (taInterview?.interview_reviews) {
                  interview_reviews = taInterview.interview_reviews;
                } else if (techInterview?.interview_reviews) {
                  interview_reviews = techInterview.interview_reviews;
                } else if (leadershipInterview?.interview_reviews) {
                  interview_reviews = leadershipInterview.interview_reviews;
                }
              }

              return {
                id: app.id,
                name: talent?.full_name || 'Unknown',
                email: userEmail,
                phone: talent?.phone_number || '',
                location: talent?.city || '',
                company: talent?.years_of_experience ? `${talent.years_of_experience} years experience` : 'N/A',
                appliedDate: new Date(app.applied_at).toLocaleDateString(),
                matchScore: app.match_score || Math.floor(Math.random() * 40) + 60,
                status: applicationStatus, // Keep original lowercase status for routing
                statusDisplay,
                stage: applicationStage,
                coverLetter: app.cover_letter,
                resumeUrl: app.resume_url,
                skills: talent?.skills || [],
                portfolioUrl: talent?.portfolio_url,
                services: [],
                // Interview review data
                talentAcquisitionReview,
                talentAcquisitionRating,
                talentAcquisitionReviewedAt,
                technicalReview,
                technicalRating,
                technicalReviewedAt,
                leadershipReview,
                leadershipRating,
                leadershipReviewedAt,
                interview_reviews, // For backward compatibility
                offer: offer ? {
                  id: offer.id,
                  position: offer.position,
                  salary: offer.salary,
                  status: offer.status,
                  workLocation: offer.work_location,
                  work_location: offer.work_location,
                  sentAt: offer.created_at
                } : null
              };
            }));

            // Count only pending applications
            const activeApplicationsCount = transformedApps.filter(app => 
              app.status === 'pending'
            ).length;

            return {
              id: job.id.toString(),
              title: job.title,
              status: job.status === 'published' ? 'Published' : job.status === 'unpublished' ? 'Unpublished' : job.status === 'draft' ? 'Draft' : 'Archived',
              employment_type: job.employment_type,
              workplace: job.workplace,
              applicationsCount: activeApplicationsCount,
              applications: transformedApps
            };
          })
        );

        // Transform jobs data into the format expected by the component
        const transformedJobsData = {};
        jobsWithApplications.forEach(job => {
          // Organize applications by their stage
          const pipeline = {
            toContact: [],
            talentAcquisition: [],
            technical: [],
            leadership: [],
            offer: [],
            rejectedOffers: [],
            hired: [],
          };
          
          const pendingApps = [];
          
          const maybeApps = [];
          const rejectedApps = [];
          const archivedApps = [];
          
          job.applications.forEach(app => {
            // Map database stage names to component stage names (only for hiring pipeline)
            const stageMap = {
              'to-contact': 'toContact',
              'talent-acquisition': 'talentAcquisition',
              'technical': 'technical',
              'leadership': 'leadership',
              'offer': 'offer',
              'rejected-offer': 'rejectedOffers',
              'hired': 'hired'
            };
            
            // Route based on STAGE first (pipeline takes priority)
            // Once in pipeline (has a stage), ALWAYS stays in pipeline
            if (app.stage && stageMap[app.stage]) {
              // In "Hiring Pipeline" tab with a valid stage
              // Stages: to-contact, talent-acquisition, technical, leadership, offer, rejected-offer, hired
              const mappedStage = stageMap[app.stage];
              pipeline[mappedStage].push({ ...app, stage: mappedStage });
            } else if (app.status === 'maybe') {
              // In "Maybe" tab - stage should be NULL
              maybeApps.push({ ...app, stage: 'maybe' });
            } else if (app.status === 'rejected') {
              // In "Rejected" tab - stage should be NULL
              rejectedApps.push({ ...app, stage: 'rejected' });
            } else if (app.status === 'archived') {
              // In "Archived" tab - stage should be NULL
              archivedApps.push({ ...app, stage: 'archived' });
            } else {
              // status === 'pending' and stage === NULL = "All Applications" tab
              // This is the initial state before screening
              pendingApps.push(app);
            }
          });
          
          transformedJobsData[job.id] = {
            all: pendingApps,
            pipeline,
            maybe: maybeApps,
            Rejected: rejectedApps,
            archived: archivedApps
          };
        });

        setJobs(jobsWithApplications);
        setJobsData(transformedJobsData);
        
        // Select first job by default
        if (jobsWithApplications.length > 0) {
          setSelectedJob(jobsWithApplications[0]);
        }

      } catch (error) {
        console.error('Error loading employer data:', error);
        toast({
          title: "Error",
          description: "Failed to load job applications. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadEmployerAndJobs();
    }
  }, [user, authLoading, toast]);

  // Keep offer dialog job metadata in sync with database
  useEffect(() => {
    let isCancelled = false;

    const fetchOfferJobMeta = async () => {
      if (!offerCandidate?.id) {
        if (!isCancelled) {
          setOfferJobMeta({ employmentType: "", workplace: "" });
          setOfferDetails(prev => ({ ...prev, workLocation: "" }));
        }
        return;
      }

      if (!isCancelled) {
        setOfferJobMeta({ employmentType: "", workplace: "" });
        setOfferDetails(prev => ({ ...prev, workLocation: "" }));
      }

      const { data, error } = await supabase
        .from('applications')
        .select(`
          jobs (
            title,
            employment_type,
            workplace
          )
        `)
        .eq('id', offerCandidate.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading job metadata for offer:', error);
        if (!isCancelled) {
          setOfferJobMeta({ employmentType: "", workplace: "" });
        }
        return;
      }

      const jobRecord = Array.isArray(data?.jobs) ? data?.jobs[0] : data?.jobs;

      if (!isCancelled) {
        setOfferJobMeta({
          employmentType: jobRecord?.employment_type || "",
          workplace: jobRecord?.workplace || "",
        });
        setOfferDetails(prev => ({
          ...prev,
          position: jobRecord?.title || prev.position,
          workLocation: jobRecord?.workplace || "",
        }));
      }
    };

    fetchOfferJobMeta();

    return () => {
      isCancelled = true;
    };
  }, [offerCandidate?.id]);

  const currentJobData = selectedJob && jobsData[selectedJob.id] ? jobsData[selectedJob.id] : { all: [], pipeline: { toContact: [], talentAcquisition: [], technical: [], leadership: [], offer: [], rejectedOffers: [], hired: [] }, maybe: [], Rejected: [] };
  const candidates = currentJobData.pipeline;

  const formatOfferSentAt = (isoString?: string | null) => {
    if (!isoString) return "";
    const parsed = new Date(isoString);
    if (Number.isNaN(parsed.getTime())) {
      return isoString;
    }
    return parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  };

  // Sync pipeline stages with jobsData
  const pipelineStages = [
    { id: "toContact", label: "To Contact", candidates: candidates.toContact, color: "bg-blue-50 border-blue-200", textColor: "text-blue-700" },
    { id: "talentAcquisition", label: "Talent Acquisition Interview", candidates: candidates.talentAcquisition, color: "bg-purple-50 border-purple-200", textColor: "text-purple-700" },
    { id: "technical", label: "Technical Interview", candidates: candidates.technical, color: "bg-yellow-50 border-yellow-200", textColor: "text-yellow-700" },
    { id: "leadership", label: "Leadership Interview", candidates: candidates.leadership, color: "bg-orange-50 border-orange-200", textColor: "text-orange-700" },
    { id: "offer", label: "Offer", candidates: candidates.offer, color: "bg-pink-50 border-pink-200", textColor: "text-pink-700" },
    { id: "rejectedOffers", label: "Rejected Offers", candidates: candidates.rejectedOffers || [], color: "bg-red-50 border-red-200", textColor: "text-red-700" },
    { id: "hired", label: "Hired", candidates: candidates.hired, color: "bg-green-50 border-green-200", textColor: "text-green-700" },
  ];

  const handleScreenCandidate = async (candidate, decision) => {
    setIsMovingCandidate(true);
    const updatedJobsData = { ...jobsData };
    const currentJob = updatedJobsData[selectedJob.id];

    // Map UI decision to database stage and status
    // stage is ONLY for hiring pipeline, NULL for other tabs
    const stageMapping = {
      'toContact': 'to-contact',
      'talentAcquisition': 'talent-acquisition',
      'technical': 'technical',
      'leadership': 'leadership',
      'offer': 'offer',
      'hired': 'hired',
      'maybe': null,          // NULL - not in pipeline
      'rejected': null,       // NULL - not in pipeline
      'archive': null         // NULL - not in pipeline
    };

    const statusMapping = {
      'toContact': 'in-progress',        // In hiring pipeline
      'talentAcquisition': 'in-progress', // In hiring pipeline
      'technical': 'in-progress',         // In hiring pipeline
      'leadership': 'in-progress',        // In hiring pipeline
      'offer': 'offered',              // Offer extended
      'hired': 'hired',                // Successfully hired
      'maybe': 'maybe',                // In "Maybe" tab
      'rejected': 'rejected',          // In "Rejected" tab
      'archive': 'archived'            // In "Archived" tab
    };

    const dbStage = stageMapping[decision];
    const dbStatus = statusMapping[decision];

    // Update in database
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          stage: dbStage,
          status: dbStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', candidate.id);

      if (error) throw error;

      // Remove from ALL possible locations to prevent duplicates
      // Remove from "All Applications" list
      const allIndex = currentJob.all.findIndex(c => c.id === candidate.id);
      if (allIndex !== -1) {
        currentJob.all.splice(allIndex, 1);
      }
      
      // Remove from current pipeline stage if exists
      const currentStage = candidate.stage;
      if (currentStage && currentJob.pipeline[currentStage]) {
        const stageIndex = currentJob.pipeline[currentStage].findIndex(c => c.id === candidate.id);
        if (stageIndex !== -1) {
          currentJob.pipeline[currentStage].splice(stageIndex, 1);
        }
      }
      
      // Remove from maybe tab if exists
      if (currentJob.maybe) {
        const maybeIndex = currentJob.maybe.findIndex(c => c.id === candidate.id);
        if (maybeIndex !== -1) {
          currentJob.maybe.splice(maybeIndex, 1);
        }
      }
      
      // Remove from rejected tab if exists
      if (currentJob.Rejected) {
        const rejectedIndex = currentJob.Rejected.findIndex(c => c.id === candidate.id);
        if (rejectedIndex !== -1) {
          currentJob.Rejected.splice(rejectedIndex, 1);
        }
      }

      // Update local state
      // Add to appropriate pipeline stage or tab (only once)
      if (decision === 'toContact') {
        currentJob.pipeline.toContact.push({ ...candidate, stage: 'toContact' });
      } else if (decision === 'talentAcquisition') {
        currentJob.pipeline.talentAcquisition.push({ ...candidate, stage: 'talentAcquisition' });
      } else if (decision === 'technical') {
        currentJob.pipeline.technical.push({ ...candidate, stage: 'technical' });
      } else if (decision === 'leadership') {
        currentJob.pipeline.leadership.push({ ...candidate, stage: 'leadership' });
      } else if (decision === 'offer') {
        currentJob.pipeline.offer.push({ ...candidate, stage: 'offer' });
      } else if (decision === 'hired') {
        currentJob.pipeline.hired.push({ ...candidate, stage: 'hired' });
      } else if (decision === 'maybe') {
        if (!currentJob.maybe) currentJob.maybe = [];
        currentJob.maybe.push({ ...candidate, stage: 'maybe' });
      } else if (decision === 'rejected') {
        if (!currentJob.Rejected) currentJob.Rejected = [];
        currentJob.Rejected.push({ ...candidate, stage: 'rejected' });
      } else if (decision === 'archive') {
        // Add to archive list
        if (!currentJob.archived) currentJob.archived = [];
        currentJob.archived.push({ ...candidate, stage: 'archived' });
      }

      setJobsData(updatedJobsData);
      setScreeningDialogOpen(false);
      setSelectedCandidate(null);
      setViewingCandidate(null); // Close the details panel

      toast({
        title: "Success",
        description: "Candidate moved successfully.",
      });
    } catch (error) {
      console.error('Error updating candidate stage:', error);
      toast({
        title: "Error",
        description: "Failed to move candidate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMovingCandidate(false);
    }
  };

  const checkInterviewConflict = (date, time, interviewerId, isTeamMember = false) => {
    if (!date || !time) return false;
    
    const dateStr = date.toISOString().split('T')[0];
    const conflict = scheduledInterviews.find(
      interview => 
        interview.date === dateStr && 
        interview.time === time && 
        (
          (isTeamMember && interview.teamMemberId === interviewerId) ||
          (!isTeamMember && interview.interviewerId === interviewerId)
        )
    );
    
    return conflict;
  };

  const handleScheduleInterview = async () => {
    if (!selectedDate || !selectedTime) {
      alert("Please fill all fields");
      return;
    }

    setIsSchedulingInterview(true);

    // Check for conflicts based on interview type
    if (interviewType === 'talentAcquisition') {
      // For talent acquisition, check current team member conflicts
      const conflict = checkInterviewConflict(selectedDate, selectedTime, currentTeamMember?.id, true);
      if (conflict) {
        alert(`Conflict detected! You already have an interview scheduled at this time.`);
        setIsSchedulingInterview(false);
        return;
      }
    } else if (selectedInterviewer && selectedInterviewer !== "self" && selectedInterviewer !== "current-user") {
      // For technical/leadership with external interviewers, check interviewer conflicts
      const conflict = checkInterviewConflict(selectedDate, selectedTime, selectedInterviewer, false);
      if (conflict) {
        alert(`Conflict detected! ${interviewers.find(i => i.id === selectedInterviewer)?.name || 'Interviewer'} already has an interview scheduled at this time.`);
        setIsSchedulingInterview(false);
        return;
      }
    }

    // Default meeting link
    const defaultMeetLink = "https://meet.google.com/new";
    setInterviewLink(defaultMeetLink);

    const updatedJobsData = { ...jobsData };
    const currentJob = updatedJobsData[selectedJob.id];
    const currentStage = schedulingCandidate.stage;

    // Get the LATEST candidate data from jobsData (in case reviews were added)
    const latestCandidate = currentJob.pipeline[currentStage].find(c => c.id === schedulingCandidate.id) || schedulingCandidate;

    // For talent acquisition interviews, always use current team member
    // For technical/leadership, use selected interviewer
    let actualInterviewer = null;
    let actualInterviewerId = null;
    
    if (interviewType === 'talentAcquisition') {
      // Always use current team member for talent acquisition
      actualInterviewer = {
        id: currentTeamMember?.id || 'team-member',
        name: currentTeamMember?.name || 'Team Member',
        role: currentTeamMember?.role || 'Team Member',
        email: ''
      };
      actualInterviewerId = null; // Keep as null since we're not using interviewers table for team members
    } else {
      // Use selected interviewer for technical/leadership
      actualInterviewer = selectedInterviewer === "self" 
        ? { id: "self", name: "You", role: "Employer", email: "" }
        : (interviewers.find(i => i.id === selectedInterviewer) || { id: selectedInterviewer, name: "Unknown", role: "Interviewer", email: "" });
      actualInterviewerId = (selectedInterviewer !== "self" && actualInterviewer.id !== "self") 
        ? actualInterviewer.id  // UUID from database
        : null;  // NULL if employer conducts interview
    }

    // Remove from ALL possible locations to prevent duplicates
    // Remove from current pipeline stage
    if (currentStage && currentJob.pipeline[currentStage]) {
      const stageIndex = currentJob.pipeline[currentStage].findIndex(c => c.id === schedulingCandidate.id);
      if (stageIndex !== -1) {
        currentJob.pipeline[currentStage].splice(stageIndex, 1);
      }
    }
    
    // Remove from all applications
    const allIndex = currentJob.all.findIndex(c => c.id === schedulingCandidate.id);
    if (allIndex !== -1) {
      currentJob.all.splice(allIndex, 1);
    }
    
    // Remove from maybe
    if (currentJob.maybe) {
      const maybeIndex = currentJob.maybe.findIndex(c => c.id === schedulingCandidate.id);
      if (maybeIndex !== -1) {
        currentJob.maybe.splice(maybeIndex, 1);
      }
    }
    
    // Remove from rejected
    if (currentJob.Rejected) {
      const rejectedIndex = currentJob.Rejected.findIndex(c => c.id === schedulingCandidate.id);
      if (rejectedIndex !== -1) {
        currentJob.Rejected.splice(rejectedIndex, 1);
      }
    }

    // Add interview details and move to next stage
    const nextStage = interviewType;
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    // Map UI stage to database stage
    const stageMapping = {
      'toContact': 'to-contact',
      'talentAcquisition': 'talent-acquisition',
      'technical': 'technical',
      'leadership': 'leadership',
      'offer': 'offer',
      'rejectedOffers': 'rejected-offer',
      'hired': 'hired'
    };

    const dbStage = stageMapping[nextStage];

    // Map interview type to database format
    const interviewTypeMapping = {
      'talentAcquisition': 'talent-acquisition',
      'technical': 'technical',
      'leadership': 'leadership'
    };

    try {
      // Update application stage in database
      const { error: appError } = await supabase
        .from('applications')
        .update({ 
          stage: dbStage,
          status: 'interview-scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', schedulingCandidate.id);

      if (appError) throw appError;

      // Create scheduled datetime (combine date and time)
      const scheduledDateTime = new Date(`${dateStr}T${selectedTime}:00`);

      // Create interview record in database
      // For talent acquisition: use team_member_id
      // For technical/leadership: use interviewer_id
      let interviewInsertData: any;
      
      if (interviewType === 'talentAcquisition') {
        interviewInsertData = {
          application_id: schedulingCandidate.id,
          team_member_id: currentTeamMember?.id,
          interview_type: interviewTypeMapping[nextStage],
          status: 'scheduled',
          scheduled_date: scheduledDateTime.toISOString(),
          duration_minutes: selectedDuration,
          meet_link: defaultMeetLink
        };
      } else {
        interviewInsertData = {
          application_id: schedulingCandidate.id,
          interviewer_id: actualInterviewerId,
          interview_type: interviewTypeMapping[nextStage],
          status: 'scheduled',
          scheduled_date: scheduledDateTime.toISOString(),
          duration_minutes: selectedDuration,
          meet_link: defaultMeetLink
        };
      }

      const { data: interviewData, error: interviewError } = await supabase
        .from('interviews')
        .insert(interviewInsertData)
        .select()
        .single();

      if (interviewError) {
        console.error('Error creating interview:', interviewError);
        throw interviewError;
      }

      console.log('✅ Interview created in database:', interviewData);

      // Add interview history (local state)
      const candidateKey = `${selectedJob.id}_${schedulingCandidate.id}`;
      if (!interviewHistory[candidateKey]) {
        interviewHistory[candidateKey] = [];
      }
      interviewHistory[candidateKey].push({
        stage: currentStage,
        date: dateStr,
        time: selectedTime,
        interviewer: actualInterviewer,
        link: defaultMeetLink,
        status: 'scheduled',
        review: null
      });
      setInterviewHistory({...interviewHistory});
      
      // Update local state
      currentJob.pipeline[nextStage].push({ 
        ...latestCandidate,
        stage: nextStage,
        interview: {
          id: interviewData.id,
          date: dateStr,
          time: selectedTime,
          interviewer: actualInterviewer,
          scheduled: true,
          link: defaultMeetLink
        }
      });

      console.log(`📦 Candidate moved to ${nextStage}:`, {
        name: latestCandidate.name,
        stage: nextStage,
        interviewId: interviewData.id,
        hasTA: !!latestCandidate.talentAcquisitionReview,
        hasTech: !!latestCandidate.technicalReview,
        hasLeader: !!latestCandidate.leadershipReview,
        fullData: currentJob.pipeline[nextStage][currentJob.pipeline[nextStage].length - 1]
      });

      // Add to scheduled interviews tracking
      if (interviewType === 'talentAcquisition') {
        // Track talent acquisition interviews by team member
        scheduledInterviews.push({
          candidateId: schedulingCandidate.id,
          candidateName: schedulingCandidate.name,
          date: dateStr,
          time: selectedTime,
          teamMemberId: currentTeamMember?.id,
          interviewerName: actualInterviewer.name || 'Team Member',
          type: nextStage
        });
      } else if (selectedInterviewer !== "self" && actualInterviewer) {
        // Track technical/leadership interviews by external interviewer
        scheduledInterviews.push({
          candidateId: schedulingCandidate.id,
          candidateName: schedulingCandidate.name,
          date: dateStr,
          time: selectedTime,
          interviewerId: actualInterviewer.id,
          interviewerName: actualInterviewer.name || 'Unknown',
          type: nextStage
        });
      }

      setJobsData(updatedJobsData);
      setScheduleDialogOpen(false);
      setSchedulingCandidate(null);
      setSelectedDate(null);
      setSelectedTime("");
      setSelectedHours("10");
      setSelectedMinutes("00");
      setSelectedInterviewer("");
      setInterviewType("");
      setSelectedDuration(60); // Reset duration

      toast({
        title: "Success",
        description: "Interview scheduled successfully.",
      });

    } catch (error) {
      console.error('Error scheduling interview:', error);
      toast({
        title: "Error",
        description: "Failed to schedule interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSchedulingInterview(false);
    }
  };

  const handleMoveToNextStage = (candidate) => {
    setIsMovingCandidate(true);
    const currentStage = candidate.stage;

    // Define next stage based on current stage
    const stageFlow = {
      'toContact': 'talentAcquisition',
      'talentAcquisition': 'technical',
      'technical': 'leadership',
      'leadership': 'offer',
      'offer': 'hired'
    };

    const nextStage = stageFlow[currentStage];

    // Special handling for moving TO offer stage (generate offer first)
    if (nextStage === 'offer') {
      setOfferCandidate(candidate);
      setOfferDetails({
        candidateName: candidate?.name || '',
        candidateEmail: candidate?.email || '',
        candidatePhone: candidate?.phone || '',
        position: selectedJob.title || "Software Engineer",
        salary: "",
        startDate: "",
        benefits: "",
        workLocation: '',
      });
      setOfferGenerated(false);
      setGenerateOfferDialog(true);
      setCandidateDetailDialog(false);
      setIsMovingCandidate(false); // Reset loading for offer dialog
      return;
    }

    // Stages that require interview scheduling
    if (nextStage === 'talentAcquisition' || nextStage === 'technical' || nextStage === 'leadership') {
      setSchedulingCandidate(candidate);
      setInterviewType(nextStage);
      
      if (nextStage === 'talentAcquisition') {
        // Auto-assign talent acquisition to current user, no interviewer selection needed
        setSelectedInterviewer("current-user"); // Special value for current team member
      } else {
        // Show interviewer selection for technical/leadership stages
        if ((currentStage === 'talentAcquisition' && nextStage === 'technical') ||
            (currentStage === 'technical' && nextStage === 'leadership')) {
          setSelectedInterviewer(""); // Need to select interviewer
        } else {
          setSelectedInterviewer("self"); // We are the interviewer
        }
      }
      
      setScheduleDialogOpen(true);
      setCandidateDetailDialog(false);
      setIsMovingCandidate(false); // Reset loading for schedule dialog
    } else {
      // Direct move for other stages (like hired)
      const updatedJobsData = { ...jobsData };
      const currentJob = updatedJobsData[selectedJob.id];

      // Map UI stage to database stage
      const stageMapping = {
        'toContact': 'to-contact',
        'talentAcquisition': 'talent-acquisition',
        'technical': 'technical',
        'leadership': 'leadership',
        'offer': 'offer',
        'rejectedOffers': 'rejected-offer',
        'hired': 'hired'
      };

      const dbStage = stageMapping[nextStage];

      // Update in database
      supabase
        .from('applications')
        .update({ 
          stage: dbStage,
          status: nextStage === 'hired' ? 'hired' : 'in-progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', candidate.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating candidate stage:', error);
            toast({
              title: "Error",
              description: "Failed to move candidate. Please try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Success",
              description: "Candidate moved successfully.",
            });
          }
          setIsMovingCandidate(false); // Reset loading after database operation
        });

      // Remove from ALL possible locations to prevent duplicates
      // Remove from current pipeline stage
      if (currentStage && currentJob.pipeline[currentStage]) {
        const stageIndex = currentJob.pipeline[currentStage].findIndex(c => c.id === candidate.id);
        if (stageIndex !== -1) {
          currentJob.pipeline[currentStage].splice(stageIndex, 1);
        }
      }
      
      // Remove from all applications
      const allIndex = currentJob.all.findIndex(c => c.id === candidate.id);
      if (allIndex !== -1) {
        currentJob.all.splice(allIndex, 1);
      }
      
      // Remove from maybe
      if (currentJob.maybe) {
        const maybeIndex = currentJob.maybe.findIndex(c => c.id === candidate.id);
        if (maybeIndex !== -1) {
          currentJob.maybe.splice(maybeIndex, 1);
        }
      }
      
      // Remove from rejected
      if (currentJob.Rejected) {
        const rejectedIndex = currentJob.Rejected.findIndex(c => c.id === candidate.id);
        if (rejectedIndex !== -1) {
          currentJob.Rejected.splice(rejectedIndex, 1);
        }
      }

      if (nextStage) {
        currentJob.pipeline[nextStage].push({ ...candidate, stage: nextStage });
      }

      setJobsData(updatedJobsData);
      setCandidateDetailDialog(false);
      setDetailCandidate(null);
    }
  };

  const handleRejectAndArchive = async (candidate) => {
    const updatedJobsData = { ...jobsData };
    const currentJob = updatedJobsData[selectedJob.id];
    const currentStage = candidate.stage;

    try {
      // Update in database to rejected stage
      const { error } = await supabase
        .from('applications')
        .update({ 
          stage: 'rejected',
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', candidate.id);

      if (error) throw error;

      // Remove from ALL possible locations to prevent duplicates
      // Remove from current pipeline stage
      if (currentStage && currentJob.pipeline[currentStage]) {
        const stageIndex = currentJob.pipeline[currentStage].findIndex(c => c.id === candidate.id);
        if (stageIndex !== -1) {
          currentJob.pipeline[currentStage].splice(stageIndex, 1);
        }
      }
      
      // Remove from all applications
      const allIndex = currentJob.all.findIndex(c => c.id === candidate.id);
      if (allIndex !== -1) {
        currentJob.all.splice(allIndex, 1);
      }
      
      // Remove from maybe
      if (currentJob.maybe) {
        const maybeIndex = currentJob.maybe.findIndex(c => c.id === candidate.id);
        if (maybeIndex !== -1) {
          currentJob.maybe.splice(maybeIndex, 1);
        }
      }

      // Add to rejected
      if (!currentJob.Rejected) currentJob.Rejected = [];
      currentJob.Rejected.push({ ...candidate, stage: 'rejected' });

      setJobsData(updatedJobsData);
      setCandidateDetailDialog(false);
      setDetailCandidate(null);

      toast({
        title: "Success",
        description: "Candidate rejected successfully.",
      });
    } catch (error) {
      console.error('Error rejecting candidate:', error);
      toast({
        title: "Error",
        description: "Failed to reject candidate. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateOffer = () => {
    if (!offerDetails.salary || !offerDetails.startDate) {
      alert("Please fill in salary and start date");
      return;
    }
    setOfferGenerated(true);
  };

  const handleSendOffer = async () => {
    if (!offerGenerated) {
      toast({
        title: "Not Generated",
        description: "Please generate the offer first by filling in the details and clicking 'Generate Offer'.",
        variant: "destructive",
      });
      return;
    }

    if (!offerCandidate) {
      toast({
        title: "Error",
        description: "No candidate selected for the offer.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Insert the new offer into the 'offers' table
      const { data: newOffer, error: offerError } = await supabase
        .from('offers')
        .insert({
          application_id: offerCandidate.id, // The candidate's application ID
          position: offerDetails.position,
          salary: offerDetails.salary,
          start_date: offerDetails.startDate,
          work_location: offerJobMeta.workplace || offerDetails.workLocation || selectedJob?.workplace || null,
          benefits_perks: offerDetails.benefits,
          status: 'pending', // Initial status
        })
        .select()
        .single();

      if (offerError) {
        console.error('Error creating offer:', offerError);
        throw offerError;
      }

      // 2. Update the application's stage to 'offer'
      const { error: appError } = await supabase
        .from('applications')
        .update({
          stage: 'offer',
          status: 'offered',
          updated_at: new Date().toISOString(),
        })
        .eq('id', offerCandidate.id);

      if (appError) {
        console.error('Error updating application stage:', appError);
        throw appError;
      }

      // 3. Update local state to reflect the changes
      const updatedJobsData = { ...jobsData };
      const currentJob = updatedJobsData[selectedJob.id];
      const currentStage = offerCandidate.stage;

      // Get the LATEST candidate data from jobsData
      const latestCandidate = currentJob.pipeline[currentStage]?.find(c => c.id === offerCandidate.id) || offerCandidate;

      // Remove candidate from their previous stage in the local state
      if (currentStage && currentJob.pipeline[currentStage]) {
        const stageIndex = currentJob.pipeline[currentStage].findIndex(c => c.id === offerCandidate.id);
        if (stageIndex !== -1) {
          currentJob.pipeline[currentStage].splice(stageIndex, 1);
        }
      }

      // Add candidate to the 'offer' stage with the new offer data from the database
      currentJob.pipeline.offer.push({
        ...latestCandidate,
        stage: 'offer',
        offer: { // This now mirrors the structure from the DB
          id: newOffer.id,
          position: newOffer.position,
          salary: newOffer.salary,
          start_date: newOffer.start_date,
          work_location: newOffer.work_location,
          workLocation: newOffer.work_location,
          status: newOffer.status,
          sentAt: newOffer.created_at,
        },
      });

      setJobsData(updatedJobsData);
      setGenerateOfferDialog(false);
      setOfferCandidate(null);
      setOfferDetails({
        candidateName: '',
        candidateEmail: '',
        candidatePhone: '',
        position: '',
        salary: '',
        startDate: '',
        benefits: '',
        workLocation: '',
      });
      setOfferJobMeta({ employmentType: '', workplace: '' });
      setOfferGenerated(false);

      toast({
        title: "Success",
        description: "Offer has been sent and saved.",
      });

    } catch (error) {
      toast({
        title: "Error Sending Offer",
        description: "There was a problem saving the offer. Please try again.",
        variant: "destructive",
      });
      console.error('Failed to send offer:', error);
    }
  };

  const handleSubmitReview = () => {
    if (!reviewingCandidate || !reviewText.trim()) return;

    const updatedJobsData = { ...jobsData };
    const currentJob = updatedJobsData[selectedJob.id];
    
    // Find and update the candidate in their stage
    const stage = reviewingCandidate.stage;
    const candidateIndex = currentJob.pipeline[stage].findIndex(c => c.id === reviewingCandidate.id);
    
    if (candidateIndex !== -1) {
      // Store review with stage-specific key so it persists when moving
      const reviewKey = stage === 'talentAcquisition' ? 'talentAcquisitionReview' : stage === 'technical' ? 'technicalReview' : 'leadershipReview';
      const ratingKey = stage === 'talentAcquisition' ? 'talentAcquisitionRating' : stage === 'technical' ? 'technicalRating' : 'leadershipRating';
      const reviewedAtKey = stage === 'talentAcquisition' ? 'talentAcquisitionReviewedAt' : stage === 'technical' ? 'technicalReviewedAt' : 'leadershipReviewedAt';
      
      currentJob.pipeline[stage][candidateIndex] = {
        ...currentJob.pipeline[stage][candidateIndex],
        [reviewKey]: reviewText,
        [ratingKey]: reviewRating,
        [reviewedAtKey]: new Date().toLocaleDateString(),
        // Keep legacy fields for backward compatibility
        review: reviewText,
        rating: reviewRating,
        reviewedAt: new Date().toLocaleDateString()
      };

      console.log(`✅ Review saved for ${reviewingCandidate.name} in ${stage} stage:`, {
        reviewKey,
        reviewText,
        candidateData: currentJob.pipeline[stage][candidateIndex]
      });
    }

    // Also add review to interview history
    const candidateKey = `${selectedJob.id}_${reviewingCandidate.id}`;
    if (interviewHistory[candidateKey]) {
      // Find the interview record for this stage and add the review
      const interviewIndex = interviewHistory[candidateKey].findIndex(i => i.stage === stage);
      if (interviewIndex !== -1) {
        interviewHistory[candidateKey][interviewIndex].review = reviewText;
        interviewHistory[candidateKey][interviewIndex].rating = reviewRating;
        interviewHistory[candidateKey][interviewIndex].status = 'completed';
      }
    }
    setInterviewHistory({...interviewHistory});

    setJobsData(updatedJobsData);
    setReviewDialogOpen(false);
    setReviewingCandidate(null);
    setReviewText("");
    setReviewRating(3);
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const updatedJobsData = { ...jobsData };
    const currentJob = updatedJobsData[selectedJob.id];

    // Get source and destination stage names
    const sourceStageId = source.droppableId;
    const destStageId = destination.droppableId;

    // Get the candidate being moved
    const [movedCandidate] = currentJob.pipeline[sourceStageId].splice(source.index, 1);
    
    // Map UI stage to database stage
    const stageMapping = {
      'toContact': 'to-contact',
      'talentAcquisition': 'talent-acquisition',
      'technical': 'technical',
      'leadership': 'leadership',
      'offer': 'offer',
      'rejectedOffers': 'rejected-offer',
      'hired': 'hired'
    };

    const dbStage = stageMapping[destStageId];

    // Determine status based on destination stage
    let status = 'in-progress'; // Default for pipeline stages
    if (destStageId === 'hired') status = 'hired';
    else if (destStageId === 'offer') status = 'offered';
    else if (destStageId === 'rejectedOffers') status = 'rejected';

    // Update in database
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          stage: dbStage,
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', movedCandidate.id);

      if (error) throw error;

      // Update the candidate's stage
      movedCandidate.stage = destStageId;
      
      // Add to destination stage
      currentJob.pipeline[destStageId].splice(destination.index, 0, movedCandidate);

      setJobsData(updatedJobsData);

      toast({
        title: "Success",
        description: "Candidate moved successfully.",
      });
    } catch (error) {
      console.error('Error updating candidate stage:', error);
      // Revert the change on error
      currentJob.pipeline[sourceStageId].splice(source.index, 0, movedCandidate);
      setJobsData(updatedJobsData);
      
      toast({
        title: "Error",
        description: "Failed to move candidate. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleArchiveCandidate = async (candidate) => {
    setIsMovingCandidate(true);
    const updatedJobsData = { ...jobsData };
    const currentJob = updatedJobsData[selectedJob.id];
    const currentStage = candidate.stage;

    try {
      // Update in database
      // stage = NULL when in "Archived" tab
      const { error } = await supabase
        .from('applications')
        .update({ 
          stage: null,
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', candidate.id);

      if (error) throw error;

      // Remove from ALL possible locations to prevent duplicates
      // Remove from current pipeline stage
      if (currentStage && currentJob.pipeline[currentStage]) {
        const stageIndex = currentJob.pipeline[currentStage].findIndex(c => c.id === candidate.id);
        if (stageIndex !== -1) {
          currentJob.pipeline[currentStage].splice(stageIndex, 1);
        }
      }
      
      // Remove from all applications
      const allIndex = currentJob.all.findIndex(c => c.id === candidate.id);
      if (allIndex !== -1) {
        currentJob.all.splice(allIndex, 1);
      }
      
      // Remove from maybe
      if (currentJob.maybe) {
        const maybeIndex = currentJob.maybe.findIndex(c => c.id === candidate.id);
        if (maybeIndex !== -1) {
          currentJob.maybe.splice(maybeIndex, 1);
        }
      }
      
      // Remove from rejected
      if (currentJob.Rejected) {
        const rejectedIndex = currentJob.Rejected.findIndex(c => c.id === candidate.id);
        if (rejectedIndex !== -1) {
          currentJob.Rejected.splice(rejectedIndex, 1);
        }
      }

      // Add to archived
      if (!currentJob.archived) currentJob.archived = [];
      currentJob.archived.push({ ...candidate, stage: 'archived' });

      setJobsData(updatedJobsData);
      setCandidateDetailDialog(false);
      setDetailCandidate(null);

      toast({
        title: "Success",
        description: "Candidate archived successfully.",
      });
    } catch (error) {
      console.error('Error archiving candidate:', error);
      toast({
        title: "Error",
        description: "Failed to archive candidate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMovingCandidate(false);
    }
  };

  if (loading || authLoading) {
    return (
      <EmployerLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading job applications...</div>
        </div>
      </EmployerLayout>
    );
  }

  if (!currentEmployer) {
    return (
      <EmployerLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center text-gray-600">
            <p>No employer profile found</p>
            <p className="text-sm">Please contact your administrator</p>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  if (!selectedJob && jobs.length === 0) {
    return (
      <EmployerLayout>
        <div className="max-w-7xl mx-auto py-8 px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Job Applications</h1>
          <div className="bg-white rounded-lg border p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Briefcase className="w-16 h-16 text-gray-300" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Jobs Posted Yet</h3>
                <p className="text-gray-600 mb-4">Create your first job posting to start receiving applications.</p>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Create Job Posting
                </Button>
              </div>
            </div>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <style>{scrollbarStyles}</style>
      <div className="max-w-7xl mx-auto py-8 px-6 relative">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Job Applications
            {currentEmployer && (
              <span className="text-lg font-normal text-gray-600 ml-3">
                - {currentEmployer.company_name}
              </span>
            )}
          </h1>
          
          {/* AI Scoring Banner */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-primary mt-0.5" />
            <p className="text-gray-700">
              AI scoring is enabled for your company. Applications will be automatically scored.
            </p>
          </div>

          {/* Job Selector and Filters */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <Select
              value={selectedJob?.id}
              onValueChange={(val) => {
                const job = jobs.find((j) => j.id === val);
                if (job) setSelectedJob(job);
              }}
            >
              <SelectTrigger className="flex items-center gap-3 bg-white border rounded-lg px-4 py-2.5 flex-1 max-w-md">
                <div className="flex items-center gap-3 flex-1">
                  <span className="font-semibold text-gray-900">{selectedJob?.title || 'Select a job'}</span>
                  {selectedJob && (
                    <Badge
                      className={`${
                        selectedJob.status === "Published"
                          ? "bg-green-100 text-green-800"
                          : selectedJob.status === "Closed"
                          ? "bg-gray-100 text-gray-800"
                          : selectedJob.status === "Draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      } border-none`}
                    >
                      {selectedJob.status}
                    </Badge>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    <div className="flex items-center gap-3">
                      <span>{job.title}</span>
                      <Badge variant="outline" className="text-xs">
                        <User className="w-3 h-3 mr-1" />
                        {job.applicationsCount} applications
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[500px] max-h-[80vh] overflow-y-auto">
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Employment Type Filter */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Employment Type</h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Full-Time
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Part-Time
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Contract
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Internship
                          </label>
                        </div>
                      </div>

                      {/* Workplace Type Filter */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Workplace</h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            On-site
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Hybrid
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Remote
                          </label>
                        </div>
                      </div>

                      {/* Experience Level Filter */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Experience Level</h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            0-1 years
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            1-3 years
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            3-5 years
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            5+ years
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Job Level Filter */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Job Level</h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Entry Level
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Junior
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Mid Level
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Senior
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Lead
                          </label>
                        </div>
                      </div>

                      {/* Education Level Filter */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Education Level</h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            High School
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Associate Degree
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Bachelor's Degree
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Master's Degree
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            PhD
                          </label>
                        </div>
                      </div>

                      {/* Contract Type Filter */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Contract Type</h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Permanent
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Temporary
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" className="rounded" />
                            Freelance
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-2 border-t mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      Reset
                    </Button>
                    <Button size="sm" className="flex-1 bg-gradient-primary">
                      Apply
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border-b w-full justify-start rounded-none h-auto p-0 mb-6">
            <TabsTrigger
              value="all"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-6 py-3 transition-all text-gray-700"
            >
              All Applications{" "}
              <span className="ml-2 text-gray-500">({currentJobData.all.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="pipeline"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-6 py-3 transition-all text-gray-700"
            >
              Hiring Pipeline{" "}
              <span className="ml-2 text-gray-500">({Object.values(candidates).flat().length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="maybe"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-6 py-3 transition-all text-gray-700"
            >
              Maybe{" "}
              <span className="ml-2 text-gray-500">({currentJobData.maybe ? currentJobData.maybe.length : 0})</span>
            </TabsTrigger>
            <TabsTrigger
              value="rejected"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-6 py-3 transition-all text-gray-700"
            >
              Rejected{" "}
              <span className="ml-2 text-gray-500">({currentJobData.Rejected ? currentJobData.Rejected.length : 0})</span>
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-6 py-3 transition-all text-gray-700"
            >
              Archived{" "}
              <span className="ml-2 text-gray-500">({currentJobData.archived ? currentJobData.archived.length : 0})</span>
            </TabsTrigger>
          </TabsList>

          {/* All Applications Tab */}
          <TabsContent value="all" className="mt-0">
            {currentJobData.all.length === 0 ? (
              <div className="bg-white rounded-lg border p-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Applications</h3>
                    <p className="text-gray-500">
                      No applications found for the selected job. Share your job posting to attract more candidates.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`grid gap-6 transition-all duration-300 ${viewingCandidate ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Candidates List - Scrollable */}
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                  {currentJobData.all.map((candidate) => (
                    <div 
                      key={candidate.id} 
                      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${viewingCandidate?.id === candidate.id ? 'border-primary shadow-md' : ''}`}
                      onClick={() => setViewingCandidate(candidate)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                            <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                              {candidate.statusDisplay}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {candidate.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {candidate.location}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Applied:</span>
                              {candidate.appliedDate}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-medium">Match Score</span>
                            <span className="text-lg font-bold text-red-500">{candidate.matchScore}%</span>
                          </div>
                          {candidate.services && candidate.services.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCandidateServices(candidate);
                                  setServicesDialogOpen(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg border border-orange-200 transition-colors"
                              >
                                <Briefcase className="w-4 h-4" />
                                <span className="text-sm font-medium">View Services ({candidate.services.length})</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Candidate Details Panel - Fixed Position Sidebar - Only show when candidate is selected */}
                {viewingCandidate && (
                  <div className="bg-white border rounded-lg p-6 sticky top-6 h-[calc(100vh-200px)] overflow-y-auto shadow-lg custom-scrollbar">
                    <div className="space-y-6">
                      {/* Header */}
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <h2 className="text-xl font-bold text-primary">{viewingCandidate.name}'s application</h2>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-primary border-primary">
                              Pipeline: {viewingCandidate.stage ? pipelineStages.find(s => s.id === viewingCandidate.stage)?.label : 'Pending'}
                            </Badge>
                            <button
                              onClick={() => setViewingCandidate(null)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                              title="Close"
                            >
                              <XCircle className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                            </button>
                          </div>
                        </div>

                        {/* Move to Pipeline Button */}
                        <Button 
                          onClick={() => setScreeningDialogOpen(true)}
                          className="w-full bg-gradient-primary text-white mb-6"
                        >
                          Move to...
                        </Button>

                        {/* AI Candidate Scoring */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-gray-900">AI Candidate Scoring</h3>
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-red-500" />
                                <span className="font-semibold text-gray-900">Match Score</span>
                              </div>
                              <span className="text-2xl font-bold text-red-500">{viewingCandidate.matchScore}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Details */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Contact Details</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Phone className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Phone</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.phone}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Mail className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Email</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.email}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Professional Information */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Professional Information</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-gray-500">Current Company</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.company}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Personal & Education */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Personal & Education</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Location</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.location}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Professional Links */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Professional Links</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <Linkedin className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-900">LinkedIn</span>
                              </div>
                              <span className="text-sm text-gray-500">Not provided</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <Github className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-900">GitHub</span>
                              </div>
                              <span className="text-sm text-gray-500">Not provided</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-900">Portfolio</span>
                              </div>
                              <span className="text-sm text-gray-500">Not provided</span>
                            </div>
                          </div>
                        </div>

                        {/* Interview History */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Interview History
                          </h3>
                          {(() => {
                            const candidateKey = `${selectedJob.id}_${viewingCandidate.id}`;
                            const history = interviewHistory[candidateKey] || [];
                            return history.length > 0 ? (
                              <div className="space-y-2">
                                {history.map((interview, idx) => {
                                  const stageName = interview.stage === 'talentAcquisition' ? 'Talent Acquisition' : interview.stage === 'technical' ? 'Technical' : 'Leadership';
                                  const reviewTitle = interview.stage === 'talentAcquisition' ? 'TA Review' : interview.stage === 'technical' ? 'Technical Interviewer Review' : 'Leadership Review';
                                  const bgColor = interview.stage === 'technical' ? 'bg-purple-50 border-purple-200' : interview.stage === 'leadership' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200';
                                  const textColor = interview.stage === 'technical' ? 'text-purple-900' : interview.stage === 'leadership' ? 'text-orange-900' : 'text-blue-900';
                                  
                                  return (
                                    <div key={idx} className={`${bgColor} border rounded-lg p-3 text-sm`}>
                                      <div className="flex items-start justify-between mb-2">
                                        <span className={`font-semibold ${textColor}`}>
                                          {stageName} Interview
                                        </span>
                                        <Badge className={interview.review ? 'bg-green-100 text-green-700 text-xs' : 'bg-blue-100 text-blue-700 text-xs'}>
                                          {interview.review ? '✓ Reviewed' : interview.status}
                                        </Badge>
                                      </div>
                                      <div className="text-gray-700 space-y-1 text-xs">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {new Date(interview.date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {interview.time}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          Interviewer: {interview.interviewer?.name || 'N/A'}
                                        </div>
                                        {interview.review && (
                                          <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                                            <p className={`font-medium ${textColor} mb-1`}>{reviewTitle}:</p>
                                            {interview.rating && (
                                              <div className="flex items-center gap-1 mb-1">
                                                {[...Array(5)].map((_, i) => (
                                                  <span key={i} className={`text-xs ${i < interview.rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
                                                ))}
                                              </div>
                                            )}
                                            <p className="text-gray-700 italic">{interview.review}</p>
                                          </div>
                                        )}
                                        {interview.link && (
                                          <div className="mt-2 text-xs flex gap-1 flex-col">
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(interview.link);
                                                alert("Interview link copied!");
                                              }}
                                              className="text-blue-600 hover:underline flex items-center gap-1 text-left"
                                            >
                                              <Globe className="w-3 h-3" />
                                              Copy Link
                                            </button>
                                            <a href={interview.link} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline flex items-center gap-1 font-semibold">
                                              <Video className="w-3 h-3" />
                                              Join Interview
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">No interviews scheduled yet</p>
                            );
                          })()}
                        </div>

                        {/* Services Section */}
                        {viewingCandidate.services && viewingCandidate.services.length > 0 && (
                          <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Briefcase className="w-5 h-5 text-orange-500" />
                              Services Offered ({viewingCandidate.services.length})
                            </h3>
                            <Button 
                              onClick={() => {
                                setSelectedCandidateServices(viewingCandidate);
                                setServicesDialogOpen(true);
                              }}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              View All Services
                            </Button>
                          </div>
                        )}

                        {/* Resume / CV */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Resume</h3>
                          {viewingCandidate?.resumeUrl ? (
                            <Button 
                              variant="outline" 
                              className="w-full flex items-center justify-center gap-2"
                              onClick={() => window.open(viewingCandidate.resumeUrl, '_blank')}
                            >
                              <Globe className="w-4 h-4" />
                              View CV
                            </Button>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No resume uploaded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Screening Dialog */}
          <Dialog open={screeningDialogOpen} onOpenChange={setScreeningDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  <BigTitle>Move {viewingCandidate?.name} to...</BigTitle>
                </DialogTitle>
                <DialogDescription>
                  Select the new status for this candidate
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                <button
                  onClick={() => handleScreenCandidate(viewingCandidate, 'toContact')}
                  disabled={isMovingCandidate}
                  className="w-full flex items-start gap-3 p-4 rounded-lg border hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMovingCandidate ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mt-0.5" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">To Contact</div>
                    <div className="text-sm text-gray-500">Move to hiring pipeline</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScreenCandidate(viewingCandidate, 'maybe')}
                  disabled={isMovingCandidate}
                  className="w-full flex items-start gap-3 p-4 rounded-lg border hover:bg-yellow-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMovingCandidate ? (
                    <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">Maybe</div>
                    <div className="text-sm text-gray-500">Keep for consideration</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScreenCandidate(viewingCandidate, 'rejected')}
                  disabled={isMovingCandidate}
                  className="w-full flex items-start gap-3 p-4 rounded-lg border hover:bg-red-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMovingCandidate ? (
                    <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">Rejected</div>
                    <div className="text-sm text-gray-500">Candidate refused or was rejected</div>
                  </div>
                </button>
                <button
                  onClick={() => handleScreenCandidate(viewingCandidate, 'archive')}
                  disabled={isMovingCandidate}
                  className="w-full flex items-start gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMovingCandidate ? (
                    <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mt-0.5" />
                  ) : (
                    <Archive className="w-5 h-5 text-gray-600 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-gray-900">Archive</div>
                    <div className="text-sm text-gray-500">Remove from active view</div>
                  </div>
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Hiring Pipeline Tab */}
          <TabsContent value="pipeline" className="mt-0">
            {Object.values(candidates).flat().length === 0 ? (
              <div className="bg-white rounded-lg border p-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Candidates in Pipeline</h3>
                    <p className="text-gray-500">
                      Screen candidates from the "All Applications" tab to add them to the hiring pipeline.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Pipeline Selector and View Toggle */}
                <div className="flex items-center gap-4">
                  <Select defaultValue="default">
                    <SelectTrigger className="w-64 bg-white">
                      <SelectValue placeholder="Select pipeline..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Select pipeline...</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setViewMode("pipeline")}
                      className={viewMode === "pipeline" ? "bg-primary text-white" : "bg-gray-200 text-gray-700"}
                    >
                      Pipeline View
                    </Button>
                    <Button
                      onClick={() => setViewMode("table")}
                      className={viewMode === "table" ? "bg-primary text-white" : "bg-gray-200 text-gray-700"}
                    >
                      Table View
                    </Button>
                  </div>
                </div>

                {/* Kanban Board - Pipeline View */}
                {viewMode === "pipeline" && (
                <DragDropContext onDragEnd={onDragEnd}>
                <div className="w-full pb-4 overflow-x-auto">
                  <div className="flex gap-8 mb-4">
                    {pipelineStages.slice(0, 4).map((stage) => (
                      <Droppable droppableId={stage.id} key={stage.id}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps}>
                            <div key={stage.id} className={`rounded-lg border min-h-[600px] max-h-[600px] overflow-y-auto custom-scrollbar ${stage.color} px-4 py-4`} style={{ width: '400px' }}>
                              <div className="p-3 border-b">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-semibold text-gray-900 text-sm">{stage.label}</h3>
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {stage.candidates.length}
                                  </span>
                                </div>
                              </div>
                              <div className="p-3">
                                {stage.candidates.length === 0 ? (
                                  <p className="text-sm text-gray-400 italic text-center py-6">
                                    No candidates in this stage
                                  </p>
                                ) : (
                                  <ul className="space-y-2">
                                    {stage.candidates.map((c, index) => (
                                      <Draggable draggableId={String(c.id)} index={index} key={c.id}>
                                        {(provided) => (
                                          <li 
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            key={c.id}
                                          >
                                            {(stage.id === 'technical' || stage.id === 'leadership') ? (
                                              /* Technical and Leadership stages - Smaller cards with review info */
                                              <div 
                                                className="bg-white rounded-lg shadow-sm p-2 space-y-2 hover:shadow-md transition-shadow cursor-pointer border"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setDetailCandidate(c);
                                                  setCandidateDetailDialog(true);
                                                }}
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                                                      <User className="w-3 h-3 text-primary" />
                                                    </div>
                                                    <h4 className="font-semibold text-xs text-gray-900 truncate">
                                                      {c.name}
                                                    </h4>
                                                  </div>
                                                  {/* Show review status badge */}
                                                  {(() => {
                                                    const hasReview = (candidate) => {
                                                      if (stage.id === 'talentAcquisition' && candidate.talentAcquisitionReview) {
                                                        return candidate.talentAcquisitionReview.toString().trim() !== '';
                                                      }
                                                      if (stage.id === 'technical' && candidate.technicalReview) {
                                                        return candidate.technicalReview.toString().trim() !== '';
                                                      }
                                                      if (stage.id === 'leadership' && candidate.leadershipReview) {
                                                        return candidate.leadershipReview.toString().trim() !== '';
                                                      }
                                                      if (candidate.interview_reviews && typeof candidate.interview_reviews === 'object' && !Array.isArray(candidate.interview_reviews)) {
                                                        return candidate.interview_reviews.rating && candidate.interview_reviews.review_text && candidate.interview_reviews.review_text.toString().trim() !== '';
                                                      }
                                                      if (candidate.interview_reviews && Array.isArray(candidate.interview_reviews) && candidate.interview_reviews.length > 0) {
                                                        const review = candidate.interview_reviews[0];
                                                        return review.rating && review.review_text && review.review_text.toString().trim() !== '';
                                                      }
                                                      if (candidate.rating && candidate.review_text) {
                                                        return candidate.review_text.toString().trim() !== '';
                                                      }
                                                      return false;
                                                    };
                                                    
                                                    if (hasReview(c)) {
                                                      return (
                                                        <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50 px-1 py-0">
                                                          ✓
                                                        </Badge>
                                                      );
                                                    }
                                                    return null;
                                                  })()}
                                                </div>
                                                
                                                <div className="text-xs text-gray-500 truncate">{c.email}</div>

                                                {/* Interview Status */}
                                                {c.interview?.scheduled && (
                                                  <div className="text-xs">
                                                    {(() => {
                                                      const interviewDate = new Date(c.interview.date + ' ' + c.interview.time);
                                                      const now = new Date();
                                                      const isPast = interviewDate < now;
                                                      const isToday = interviewDate.toDateString() === now.toDateString();
                                                      const isReviewed = c.review;
                                                      
                                                      return (
                                                        <Badge 
                                                          variant="outline" 
                                                          className={`text-xs ${
                                                            isReviewed
                                                              ? 'bg-green-50 text-green-700 border-green-300'
                                                              : isPast 
                                                                ? 'bg-red-50 text-red-700 border-red-300' 
                                                                : isToday 
                                                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                                                                  : 'bg-blue-50 text-blue-700 border-blue-300'
                                                          }`}
                                                        >
                                                          {isReviewed ? '✓ Done' : isPast ? '⚠ Late' : isToday ? '📅 Today' : '📅 Scheduled'}
                                                        </Badge>
                                                      );
                                                    })()}
                                                  </div>
                                                )}

                                                {/* Show review if completed */}
                                                {c.review ? (
                                                  <div className={`rounded p-2 text-xs border ${stage.id === 'technical' ? 'bg-purple-50 border-purple-200' : 'bg-orange-50 border-orange-200'}`}>
                                                    <p className={`font-semibold text-xs mb-1 ${stage.id === 'technical' ? 'text-purple-900' : 'text-orange-900'}`}>
                                                      {stage.id === 'technical' ? 'Technical Interviewer Review:' : 'Leadership Review:'}
                                                    </p>
                                                    <div className="flex items-center gap-1 mb-1">
                                                      {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={`${i < c.rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
                                                      ))}
                                                    </div>
                                                    <p className="text-gray-700 line-clamp-2">{c.review}</p>
                                                  </div>
                                                ) : (
                                                  <div className={`rounded p-2 text-xs border ${stage.id === 'technical' ? 'bg-purple-50 border-purple-200' : 'bg-orange-50 border-orange-200'}`}>
                                                    <p className={`font-semibold text-xs ${stage.id === 'technical' ? 'text-purple-900' : 'text-orange-900'}`}>
                                                      {stage.id === 'technical' ? 'Technical Interviewer Review:' : 'Leadership Review:'}
                                                    </p>
                                                    <p className="text-gray-600 italic mt-1">No review yet</p>
                                                  </div>
                                                )}

                                                {/* Show scheduled info */}
                                                {c.interview?.scheduled && (
                                                  <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs">
                                                    <div className="text-gray-700">
                                                      <div>{new Date(c.interview.date).toLocaleDateString()}</div>
                                                      <div>{c.interview.time}</div>
                                                      <div className="truncate">With: {c.interview.interviewer.name}</div>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              /* All other stages - Enhanced cards with status and actions */
                                              <div 
                                                className="bg-white rounded-lg shadow-md p-3 space-y-2 hover:shadow-lg transition-shadow cursor-pointer"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setDetailCandidate(c);
                                                  setCandidateDetailDialog(true);
                                                }}
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                                      <User className="w-3 h-3 text-primary" />
                                                    </div>
                                                    <h4 className="font-semibold text-sm text-gray-900 truncate">
                                                      {c.name}
                                                    </h4>
                                                  </div>
                                                  {((stage.id === 'talentAcquisition' && c.talentAcquisitionReview) || (stage.id === 'leadership' && c.leadershipReview)) && (
                                                    <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50 px-1.5 py-0">
                                                      ✓
                                                    </Badge>
                                                  )}
                                                </div>
                                                

                                                <div className="text-xs text-gray-500 truncate">{c.email}</div>

                                                {/* Show Meet Link and Join/Status */}
                                                {c.interview?.link && (
                                                  <div className="mt-2 flex flex-col gap-1">
                                                    <span className="text-xs text-gray-700 flex items-center gap-1">
                                                      <Video className="w-3 h-3" />
                                                      Meet Link:
                                                      <a href={c.interview.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-1">Open</a>
                                                    </span>
                                                    {(() => {
                                                      const interviewDate = new Date(c.interview.date + ' ' + c.interview.time);
                                                      const now = new Date();
                                                      const isPast = interviewDate < now;
                                                      const isToday = interviewDate.toDateString() === now.toDateString();
                                                      const isDone = c.review;
                                                      if (isDone) {
                                                        return <button className="bg-gray-200 text-gray-500 rounded px-2 py-1 text-xs cursor-not-allowed" disabled>Completed</button>;
                                                      } else if (isPast) {
                                                        return <button className="bg-red-100 text-red-700 rounded px-2 py-1 text-xs cursor-not-allowed" disabled>Late</button>;
                                                      } else {
                                                        return <a href={c.interview.link} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white rounded px-2 py-1 text-xs hover:bg-green-700">Join</a>;
                                                      }
                                                    })()}
                                                  </div>
                                                )}

                                                {/* Show scheduled interview info */}
                                                {c.interview?.scheduled && (
                                                  <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs mt-2">
                                                    <div className="flex items-center gap-1 text-blue-700 mb-1">
                                                      <Calendar className="w-3 h-3" />
                                                      <span className="font-semibold">Scheduled</span>
                                                    </div>
                                                    <div className="text-gray-700">
                                                      <div>{new Date(c.interview.date).toLocaleDateString()}</div>
                                                      <div>{c.interview.time}</div>
                                                      <div className="truncate">With: {c.interview.interviewer.name}</div>
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Show offer info for Offer stage */}
                                                {stage.id === 'offer' && c.offer && (
                                                  <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                                                    <div className="flex items-center gap-1 text-green-700 mb-1">
                                                      <Briefcase className="w-3 h-3" />
                                                      <span className="font-semibold">Offer Sent</span>
                                                    </div>
                                                    <div className="text-gray-700">
                                                      <div className="truncate">{c.offer.position}</div>
                                                      <div>{c.offer.salary}</div>
                                                      <div>Status: {c.offer.status}</div>
                                                      {c.offer.sentAt && (
                                                        <div>Sent: {formatOfferSentAt(c.offer.sentAt)}</div>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Show review for Talent Acquisition */}
                                                {stage.id === 'talentAcquisition' && (() => {
                                                  // Same logic as TalentAcquisitionInterviews.tsx
                                                  const hasReview = (candidate) => {
                                                    // Check specific TA review fields first
                                                    if (candidate.talentAcquisitionReview) {
                                                      return candidate.talentAcquisitionReview.toString().trim() !== '';
                                                    }
                                                    // Check if review data is in object format (one-to-one relationship)
                                                    if (candidate.interview_reviews && typeof candidate.interview_reviews === 'object' && !Array.isArray(candidate.interview_reviews)) {
                                                      return candidate.interview_reviews.rating && candidate.interview_reviews.review_text && candidate.interview_reviews.review_text.toString().trim() !== '';
                                                    }
                                                    // Check if review data is in array format (for backward compatibility)
                                                    if (candidate.interview_reviews && Array.isArray(candidate.interview_reviews) && candidate.interview_reviews.length > 0) {
                                                      const review = candidate.interview_reviews[0];
                                                      return review.rating && review.review_text && review.review_text.toString().trim() !== '';
                                                    }
                                                    // Check if review data is flattened (from JOIN query)
                                                    if (candidate.rating && candidate.review_text) {
                                                      return candidate.review_text.toString().trim() !== '';
                                                    }
                                                    return false;
                                                  };
                                                  
                                                  const getReview = (candidate) => {
                                                    // Return specific TA review fields first
                                                    if (candidate.talentAcquisitionReview) {
                                                      return {
                                                        rating: candidate.talentAcquisitionRating || 0,
                                                        review_text: candidate.talentAcquisitionReview,
                                                        created_at: candidate.talentAcquisitionReviewedAt || new Date().toISOString()
                                                      };
                                                    }
                                                    // Return single object review data if available (one-to-one relationship)
                                                    if (candidate.interview_reviews && typeof candidate.interview_reviews === 'object' && !Array.isArray(candidate.interview_reviews)) {
                                                      return candidate.interview_reviews;
                                                    }
                                                    // Return array review data if available (for backward compatibility)
                                                    if (candidate.interview_reviews && Array.isArray(candidate.interview_reviews) && candidate.interview_reviews.length > 0) {
                                                      return candidate.interview_reviews[0];
                                                    }
                                                    // Return flattened review data if available
                                                    if (candidate.rating && candidate.review_text) {
                                                      return {
                                                        rating: candidate.rating,
                                                        review_text: candidate.review_text,
                                                        created_at: candidate.updated_at
                                                      };
                                                    }
                                                    return null;
                                                  };
                                                  
                                                  if (hasReview(c)) {
                                                    const review = getReview(c);
                                                    return (
                                                      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                                        <div className="flex items-center justify-between mb-3">
                                                          <h4 className="font-medium text-emerald-800 text-xs">✓ Evaluation Completed</h4>
                                                          <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                                            {parseFloat(review.rating).toFixed(1)} ⭐
                                                          </Badge>
                                                        </div>
                                                        <p className="text-xs text-emerald-700 mb-2">
                                                          {review.review_text}
                                                        </p>
                                                        <p className="text-xs text-emerald-600">
                                                          Submitted on {new Date(review.created_at).toLocaleDateString()}
                                                        </p>
                                                      </div>
                                                    );
                                                  }
                                                  return null;
                                                })()}

                                                {/* Show review for Technical */}
                                                {stage.id === 'technical' && (() => {
                                                  // Same logic as TalentAcquisitionInterviews.tsx
                                                  const hasReview = (candidate) => {
                                                    // Check specific technical review fields first
                                                    if (candidate.technicalReview) {
                                                      return candidate.technicalReview.toString().trim() !== '';
                                                    }
                                                    // Check if review data is in object format (one-to-one relationship)
                                                    if (candidate.interview_reviews && typeof candidate.interview_reviews === 'object' && !Array.isArray(candidate.interview_reviews)) {
                                                      return candidate.interview_reviews.rating && candidate.interview_reviews.review_text && candidate.interview_reviews.review_text.toString().trim() !== '';
                                                    }
                                                    // Check if review data is in array format (for backward compatibility)
                                                    if (candidate.interview_reviews && Array.isArray(candidate.interview_reviews) && candidate.interview_reviews.length > 0) {
                                                      const review = candidate.interview_reviews[0];
                                                      return review.rating && review.review_text && review.review_text.toString().trim() !== '';
                                                    }
                                                    // Check if review data is flattened (from JOIN query)
                                                    if (candidate.rating && candidate.review_text) {
                                                      return candidate.review_text.toString().trim() !== '';
                                                    }
                                                    return false;
                                                  };
                                                  
                                                  const getReview = (candidate) => {
                                                    // Return specific technical review fields first
                                                    if (candidate.technicalReview) {
                                                      return {
                                                        rating: candidate.technicalRating || 0,
                                                        review_text: candidate.technicalReview,
                                                        created_at: candidate.technicalReviewedAt || new Date().toISOString()
                                                      };
                                                    }
                                                    // Return single object review data if available (one-to-one relationship)
                                                    if (candidate.interview_reviews && typeof candidate.interview_reviews === 'object' && !Array.isArray(candidate.interview_reviews)) {
                                                      return candidate.interview_reviews;
                                                    }
                                                    // Return array review data if available (for backward compatibility)
                                                    if (candidate.interview_reviews && Array.isArray(candidate.interview_reviews) && candidate.interview_reviews.length > 0) {
                                                      return candidate.interview_reviews[0];
                                                    }
                                                    // Return flattened review data if available
                                                    if (candidate.rating && candidate.review_text) {
                                                      return {
                                                        rating: candidate.rating,
                                                        review_text: candidate.review_text,
                                                        created_at: candidate.updated_at
                                                      };
                                                    }
                                                    return null;
                                                  };
                                                  
                                                  if (hasReview(c)) {
                                                    const review = getReview(c);
                                                    return (
                                                      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                                        <div className="flex items-center justify-between mb-3">
                                                          <h4 className="font-medium text-emerald-800 text-xs">✓ Technical Review Done</h4>
                                                          <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                                            {parseFloat(review.rating).toFixed(1)} ⭐
                                                          </Badge>
                                                        </div>
                                                        <p className="text-xs text-emerald-700 mb-2">
                                                          {review.review_text}
                                                        </p>
                                                        <p className="text-xs text-emerald-600">
                                                          Submitted on {new Date(review.created_at).toLocaleDateString()}
                                                        </p>
                                                      </div>
                                                    );
                                                  }
                                                  return null;
                                                })()}

                                                {/* Show review for Leadership */}
                                                {stage.id === 'leadership' && (() => {
                                                  // Same logic as TalentAcquisitionInterviews.tsx
                                                  const hasReview = (candidate) => {
                                                    // Check specific leadership review fields first
                                                    if (candidate.leadershipReview) {
                                                      return candidate.leadershipReview.toString().trim() !== '';
                                                    }
                                                    // Check if review data is in object format (one-to-one relationship)
                                                    if (candidate.interview_reviews && typeof candidate.interview_reviews === 'object' && !Array.isArray(candidate.interview_reviews)) {
                                                      return candidate.interview_reviews.rating && candidate.interview_reviews.review_text && candidate.interview_reviews.review_text.toString().trim() !== '';
                                                    }
                                                    // Check if review data is in array format (for backward compatibility)
                                                    if (candidate.interview_reviews && Array.isArray(candidate.interview_reviews) && candidate.interview_reviews.length > 0) {
                                                      const review = candidate.interview_reviews[0];
                                                      return review.rating && review.review_text && review.review_text.toString().trim() !== '';
                                                    }
                                                    // Check if review data is flattened (from JOIN query)
                                                    if (candidate.rating && candidate.review_text) {
                                                      return candidate.review_text.toString().trim() !== '';
                                                    }
                                                    return false;
                                                  };
                                                  
                                                  const getReview = (candidate) => {
                                                    // Return specific leadership review fields first
                                                    if (candidate.leadershipReview) {
                                                      return {
                                                        rating: candidate.leadershipRating || 0,
                                                        review_text: candidate.leadershipReview,
                                                        created_at: candidate.leadershipReviewedAt || new Date().toISOString()
                                                      };
                                                    }
                                                    // Return single object review data if available (one-to-one relationship)
                                                    if (candidate.interview_reviews && typeof candidate.interview_reviews === 'object' && !Array.isArray(candidate.interview_reviews)) {
                                                      return candidate.interview_reviews;
                                                    }
                                                    // Return array review data if available (for backward compatibility)
                                                    if (candidate.interview_reviews && Array.isArray(candidate.interview_reviews) && candidate.interview_reviews.length > 0) {
                                                      return candidate.interview_reviews[0];
                                                    }
                                                    // Return flattened review data if available
                                                    if (candidate.rating && candidate.review_text) {
                                                      return {
                                                        rating: candidate.rating,
                                                        review_text: candidate.review_text,
                                                        created_at: candidate.updated_at
                                                      };
                                                    }
                                                    return null;
                                                  };
                                                  
                                                  if (hasReview(c)) {
                                                    const review = getReview(c);
                                                    return (
                                                      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                                        <div className="flex items-center justify-between mb-3">
                                                          <h4 className="font-medium text-emerald-800 text-xs">✓ Leadership Review Done</h4>
                                                          <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                                            {parseFloat(review.rating).toFixed(1)} ⭐
                                                          </Badge>
                                                        </div>
                                                        <p className="text-xs text-emerald-700 mb-2">
                                                          {review.review_text}
                                                        </p>
                                                        <p className="text-xs text-emerald-600">
                                                          Submitted on {new Date(review.created_at).toLocaleDateString()}
                                                        </p>
                                                      </div>
                                                    );
                                                  }
                                                  return null;
                                                })()}
                                              </div>
                                            )}
                                          </li>
                                        )}
                                      </Draggable>
                                    ))}
                                  </ul>
                                )}
                                {provided.placeholder}
                              </div>
                            </div>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    ))}
                  </div>
                  {/* Second Row - 3 Stages */}
                  <div className="flex gap-8">
                    {pipelineStages.slice(4).map((stage) => (
                      <Droppable droppableId={stage.id} key={stage.id}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps}>
                            <div key={stage.id} className={`rounded-lg border min-h-[400px] max-h-[400px] overflow-y-auto custom-scrollbar ${stage.color} px-6 py-6`} style={{ width: '480px' }}> 
                              <div className="p-4 border-b">
                                <div className="flex items-center justify-between mb-1">
                                  <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                                  <span className="text-sm bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                    {stage.candidates.length}
                                  </span>
                                </div>
                              </div>
                              <div className="p-4">
                                {stage.candidates.length === 0 ? (
                                  <p className="text-sm text-gray-400 italic text-center py-8">
                                    No candidates in this stage
                                  </p>
                                ) : (
                                  <ul className="space-y-2">
                                    {stage.candidates.map((c, index) => (
                                      <Draggable draggableId={String(c.id)} index={index} key={c.id}>
                                        {(provided) => (
                                          <li 
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                          >
                                            <div 
                                              className="bg-white rounded-lg shadow-md p-3 space-y-2 hover:shadow-lg transition-shadow cursor-pointer"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setDetailCandidate(c);
                                                setCandidateDetailDialog(true);
                                              }}
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                                    <User className="w-3 h-3 text-primary" />
                                                  </div>
                                                  <h4 className="font-semibold text-sm text-gray-900 truncate">
                                                    {c.name}
                                                  </h4>
                                                </div>
                                                {((stage.id === 'talentAcquisition' && c.talentAcquisitionReview) || (stage.id === 'leadership' && c.leadershipReview)) && (
                                                  <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50 px-1.5 py-0">
                                                    ✓
                                                  </Badge>
                                                )}
                                              </div>
                                              
                                              <div className="text-xs text-gray-500 truncate">{c.email}</div>

                                              {/* Show scheduled interview info */}
                                              {c.interview?.scheduled && (
                                                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs">
                                                  <div className="flex items-center gap-1 text-blue-700 mb-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span className="font-semibold">Scheduled</span>
                                                  </div>
                                                  <div className="text-gray-700">
                                                    <div>{new Date(c.interview.date).toLocaleDateString()}</div>
                                                    <div>{c.interview.time}</div>
                                                    <div className="truncate">With: {c.interview.interviewer.name}</div>
                                                  </div>
                                                </div>
                                              )}

                                              {/* Show offer info for Offer stage */}
                                              {stage.id === 'offer' && c.offer && (
                                                <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                                                  <div className="flex items-center gap-1 text-green-700 mb-1">
                                                    <Briefcase className="w-3 h-3" />
                                                    <span className="font-semibold">Offer Sent</span>
                                                  </div>
                                                  <div className="text-gray-700">
                                                    <div className="truncate">{c.offer.position}</div>
                                                    <div>{c.offer.salary}</div>
                                                    <div>Status: {c.offer.status}</div>
                                                    {c.offer.sentAt && (
                                                      <div>Sent: {formatOfferSentAt(c.offer.sentAt)}</div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                              {/* Show review for all interview types using same backend logic as TalentAcquisitionInterviews.tsx */}
                                              {(() => {
                                                // Same logic as TalentAcquisitionInterviews.tsx
                                                const hasReview = (candidate) => {
                                                  // Check specific review fields first based on stage
                                                  if (stage.id === 'talentAcquisition' && candidate.talentAcquisitionReview) {
                                                    return candidate.talentAcquisitionReview.toString().trim() !== '';
                                                  }
                                                  if (stage.id === 'technical' && candidate.technicalReview) {
                                                    return candidate.technicalReview.toString().trim() !== '';
                                                  }
                                                  if (stage.id === 'leadership' && candidate.leadershipReview) {
                                                    return candidate.leadershipReview.toString().trim() !== '';
                                                  }
                                                  // Check if review data is in object format (one-to-one relationship)
                                                  if (candidate.interview_reviews && typeof candidate.interview_reviews === 'object' && !Array.isArray(candidate.interview_reviews)) {
                                                    return candidate.interview_reviews.rating && candidate.interview_reviews.review_text && candidate.interview_reviews.review_text.toString().trim() !== '';
                                                  }
                                                  // Check if review data is in array format (for backward compatibility)
                                                  if (candidate.interview_reviews && Array.isArray(candidate.interview_reviews) && candidate.interview_reviews.length > 0) {
                                                    const review = candidate.interview_reviews[0];
                                                    return review.rating && review.review_text && review.review_text.toString().trim() !== '';
                                                  }
                                                  // Check if review data is flattened (from JOIN query)
                                                  if (candidate.rating && candidate.review_text) {
                                                    return candidate.review_text.toString().trim() !== '';
                                                  }
                                                  return false;
                                                };
                                                
                                                const getReview = (candidate) => {
                                                  // Return specific review fields first based on stage
                                                  if (stage.id === 'talentAcquisition' && candidate.talentAcquisitionReview) {
                                                    return {
                                                      rating: candidate.talentAcquisitionRating || 0,
                                                      review_text: candidate.talentAcquisitionReview,
                                                      created_at: candidate.talentAcquisitionReviewedAt || new Date().toISOString()
                                                    };
                                                  }
                                                  if (stage.id === 'technical' && candidate.technicalReview) {
                                                    return {
                                                      rating: candidate.technicalRating || 0,
                                                      review_text: candidate.technicalReview,
                                                      created_at: candidate.technicalReviewedAt || new Date().toISOString()
                                                    };
                                                  }
                                                  if (stage.id === 'leadership' && candidate.leadershipReview) {
                                                    return {
                                                      rating: candidate.leadershipRating || 0,
                                                      review_text: candidate.leadershipReview,
                                                      created_at: candidate.leadershipReviewedAt || new Date().toISOString()
                                                    };
                                                  }
                                                  // Return single object review data if available (one-to-one relationship)
                                                  if (candidate.interview_reviews && typeof candidate.interview_reviews === 'object' && !Array.isArray(candidate.interview_reviews)) {
                                                    return candidate.interview_reviews;
                                                  }
                                                  // Return array review data if available (for backward compatibility)
                                                  if (candidate.interview_reviews && Array.isArray(candidate.interview_reviews) && candidate.interview_reviews.length > 0) {
                                                    return candidate.interview_reviews[0];
                                                  }
                                                  // Return flattened review data if available
                                                  if (candidate.rating && candidate.review_text) {
                                                    return {
                                                      rating: candidate.rating,
                                                      review_text: candidate.review_text,
                                                      created_at: candidate.updated_at
                                                    };
                                                  }
                                                  return null;
                                                };
                                                
                                                const getStageTitle = () => {
                                                  if (stage.id === 'talentAcquisition') return '✓ Evaluation Completed';
                                                  if (stage.id === 'technical') return '✓ Technical Review Done';
                                                  if (stage.id === 'leadership') return '✓ Leadership Review Done';
                                                  return '✓ Review Completed';
                                                };
                                                
                                                if ((stage.id === 'talentAcquisition' || stage.id === 'technical' || stage.id === 'leadership') && hasReview(c)) {
                                                  const review = getReview(c);
                                                  return (
                                                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                                      <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-medium text-emerald-800 text-xs">{getStageTitle()}</h4>
                                                        <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                                                          {parseFloat(review.rating).toFixed(1)} ⭐
                                                        </Badge>
                                                      </div>
                                                      <p className="text-xs text-emerald-700 mb-1 line-clamp-2">
                                                        {review.review_text}
                                                      </p>
                                                      <p className="text-xs text-emerald-600">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                      </p>
                                                    </div>
                                                  );
                                                }
                                                return null;
                                              })()}
                                            </div>
                                          </li>
                                        )}
                                      </Draggable>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    ))}
                  </div>
                </div>
                </DragDropContext>
                )}

              {/* Table View */}
              {viewMode === "table" && (
                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse bg-white rounded-lg shadow">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-3 text-left font-semibold">Candidate</th>
                        <th className="border p-3 text-left font-semibold">Email</th>
                        <th className="border p-3 text-left font-semibold">Stage</th>
                        <th className="border p-3 text-left font-semibold">Status</th>
                        <th className="border p-3 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pipelineStages.flatMap(stage => 
                        stage.candidates.map(candidate => (
                          <tr key={candidate.id} className="hover:bg-gray-50">
                            <td className="border p-3">{candidate.name}</td>
                            <td className="border p-3">{candidate.email}</td>
                            <td className="border p-3">
                              <Badge className={`${
                                stage.id === 'toContact' ? 'bg-blue-100 text-blue-800' :
                                stage.id === 'talentAcquisition' ? 'bg-purple-100 text-purple-800' :
                                stage.id === 'technical' ? 'bg-yellow-100 text-yellow-800' :
                                stage.id === 'leadership' ? 'bg-orange-100 text-orange-800' :
                                stage.id === 'offer' ? 'bg-pink-100 text-pink-800' :
                                stage.id === 'rejectedOffers' ? 'bg-red-100 text-red-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {stage.label}
                              </Badge>
                            </td>
                            <td className="border p-3">
                              {candidate.review || candidate.technicalReview ? (
                                <Badge className="bg-green-100 text-green-800">Reviewed</Badge>
                              ) : candidate.interview?.scheduled ? (
                                <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
                              )}
                            </td>
                            <td className="border p-3">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setDetailCandidate(candidate);
                                  setCandidateDetailDialog(true);
                                }}
                                className="bg-primary text-white"
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              </div>
            )}
          </TabsContent>

          {/* Maybe Tab */}
          <TabsContent value="maybe" className="mt-0">
            {!currentJobData.maybe || currentJobData.maybe.length === 0 ? (
              <div className="bg-white rounded-lg border p-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Candidates in Maybe</h3>
                    <p className="text-gray-500">Candidates you keep for consideration will appear here.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`grid gap-6 transition-all duration-300 ${viewingCandidate ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                  {currentJobData.maybe.map((candidate) => (
                    <div 
                      key={candidate.id} 
                      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${viewingCandidate?.id === candidate.id ? 'border-primary shadow-md' : ''}`}
                      onClick={() => setViewingCandidate(candidate)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                              <p className="text-sm text-gray-600">{candidate.email}</p>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800 border-none">{candidate.statusDisplay}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {candidate.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {candidate.appliedDate}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {viewingCandidate && (
                  <div className="bg-white border rounded-lg p-6 sticky top-6 h-[calc(100vh-200px)] overflow-y-auto shadow-lg custom-scrollbar">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <h2 className="text-xl font-bold text-primary">{viewingCandidate.name}'s application</h2>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-primary border-primary">
                              Pipeline: {viewingCandidate.stage ? pipelineStages.find(s => s.id === viewingCandidate.stage)?.label : 'Pending'}
                            </Badge>
                            <button
                              onClick={() => setViewingCandidate(null)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                              title="Close"
                            >
                              <XCircle className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                            </button>
                          </div>
                        </div>

                        {/* Move to Pipeline Button */}
                        <Button 
                          onClick={() => setScreeningDialogOpen(true)}
                          className="w-full bg-gradient-primary text-white mb-6"
                        >
                          Move to...
                        </Button>

                        {/* AI Candidate Scoring */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-gray-900">AI Candidate Scoring</h3>
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-red-500" />
                                <span className="font-semibold text-gray-900">Match Score</span>
                              </div>
                              <span className="text-2xl font-bold text-red-500">{viewingCandidate.matchScore}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Details */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Contact Details</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Phone className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Phone</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.phone}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Mail className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Email</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.email}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Professional Information */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Professional Information</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-gray-500">Current Company</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.company}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Personal & Education */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Personal & Education</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Location</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.location}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Professional Links */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Professional Links</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <Linkedin className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-900">LinkedIn</span>
                              </div>
                              <span className="text-sm text-gray-500">Not provided</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <Github className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-900">GitHub</span>
                              </div>
                              <span className="text-sm text-gray-500">Not provided</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-900">Portfolio</span>
                              </div>
                              <span className="text-sm text-gray-500">Not provided</span>
                            </div>
                          </div>
                        </div>

                        {/* Interview History */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Interview History
                          </h3>
                          {(() => {
                            const candidateKey = `${selectedJob.id}_${viewingCandidate.id}`;
                            const history = interviewHistory[candidateKey] || [];
                            return history.length > 0 ? (
                              <div className="space-y-2">
                                {history.map((interview, idx) => {
                                  const stageName = interview.stage === 'talentAcquisition' ? 'Talent Acquisition' : interview.stage === 'technical' ? 'Technical' : 'Leadership';
                                  const reviewTitle = interview.stage === 'talentAcquisition' ? 'TA Review' : interview.stage === 'technical' ? 'Technical Interviewer Review' : 'Leadership Review';
                                  const bgColor = interview.stage === 'technical' ? 'bg-purple-50 border-purple-200' : interview.stage === 'leadership' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200';
                                  const textColor = interview.stage === 'technical' ? 'text-purple-900' : interview.stage === 'leadership' ? 'text-orange-900' : 'text-blue-900';
                                  
                                  return (
                                    <div key={idx} className={`${bgColor} border rounded-lg p-3 text-sm`}>
                                      <div className="flex items-start justify-between mb-2">
                                        <span className={`font-semibold ${textColor}`}>
                                          {stageName} Interview
                                        </span>
                                        <Badge className={interview.review ? 'bg-green-100 text-green-700 text-xs' : 'bg-blue-100 text-blue-700 text-xs'}>
                                          {interview.review ? '✓ Reviewed' : interview.status}
                                        </Badge>
                                      </div>
                                      <div className="text-gray-700 space-y-1 text-xs">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {new Date(interview.date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {interview.time}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          Interviewer: {interview.interviewer?.name || 'N/A'}
                                        </div>
                                        {interview.review && (
                                          <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                                            <p className={`font-medium ${textColor} mb-1`}>{reviewTitle}:</p>
                                            {interview.rating && (
                                              <div className="flex items-center gap-1 mb-1">
                                                {[...Array(5)].map((_, i) => (
                                                  <span key={i} className={`text-xs ${i < interview.rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
                                                ))}
                                              </div>
                                            )}
                                            <p className="text-gray-700 italic">{interview.review}</p>
                                          </div>
                                        )}
                                        {interview.link && (
                                          <div className="mt-2 text-xs flex gap-1 flex-col">
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(interview.link);
                                                alert("Interview link copied!");
                                              }}
                                              className="text-blue-600 hover:underline flex items-center gap-1 text-left"
                                            >
                                              <Globe className="w-3 h-3" />
                                              Copy Link
                                            </button>
                                            <a href={interview.link} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline flex items-center gap-1 font-semibold">
                                              <Video className="w-3 h-3" />
                                              Join Interview
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">No interviews scheduled yet</p>
                            );
                          })()}
                        </div>

                        {/* Services Section */}
                        {viewingCandidate.services && viewingCandidate.services.length > 0 && (
                          <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Briefcase className="w-5 h-5 text-orange-500" />
                              Services Offered ({viewingCandidate.services.length})
                            </h3>
                            <Button 
                              onClick={() => {
                                setSelectedCandidateServices(viewingCandidate);
                                setServicesDialogOpen(true);
                              }}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              View All Services
                            </Button>
                          </div>
                        )}

                        {/* Resume / CV */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Resume</h3>
                          {viewingCandidate?.resumeUrl ? (
                            <Button 
                              variant="outline" 
                              className="w-full flex items-center justify-center gap-2"
                              onClick={() => window.open(viewingCandidate.resumeUrl, '_blank')}
                            >
                              <Globe className="w-4 h-4" />
                              View CV
                            </Button>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No resume uploaded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Rejected Tab */}
          <TabsContent value="rejected" className="mt-0">
            {!currentJobData.Rejected || currentJobData.Rejected.length === 0 ? (
              <div className="bg-white rounded-lg border p-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Rejected Candidates</h3>
                    <p className="text-gray-500">Rejected candidates will appear here.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`grid gap-6 transition-all duration-300 ${viewingCandidate ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                  {currentJobData.Rejected.map((candidate) => (
                    <div 
                      key={candidate.id} 
                      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${viewingCandidate?.id === candidate.id ? 'border-primary shadow-md' : ''}`}
                      onClick={() => setViewingCandidate(candidate)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                              <p className="text-sm text-gray-600">{candidate.email}</p>
                            </div>
                            <Badge className="bg-red-100 text-red-800 border-none">{candidate.statusDisplay}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {candidate.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {candidate.appliedDate}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {viewingCandidate && (
                  <div className="bg-white border rounded-lg p-6 sticky top-6 h-[calc(100vh-200px)] overflow-y-auto shadow-lg custom-scrollbar">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <h2 className="text-xl font-bold text-primary">{viewingCandidate.name}'s application</h2>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-primary border-primary">
                              Pipeline: {viewingCandidate.stage ? pipelineStages.find(s => s.id === viewingCandidate.stage)?.label : 'Pending'}
                            </Badge>
                            <button
                              onClick={() => setViewingCandidate(null)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                              title="Close"
                            >
                              <XCircle className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                            </button>
                          </div>
                        </div>

                        {/* AI Candidate Scoring */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-gray-900">AI Candidate Scoring</h3>
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-red-500" />
                                <span className="font-semibold text-gray-900">Match Score</span>
                              </div>
                              <span className="text-2xl font-bold text-red-500">{viewingCandidate.matchScore}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Details */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Contact Details</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Phone className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Phone</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.phone}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Mail className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Email</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.email}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Professional Information */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Professional Information</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-gray-500">Current Company</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.company}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Personal & Education */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Personal & Education</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Location</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.location}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Professional Links */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Professional Links</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <Linkedin className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-900">LinkedIn</span>
                              </div>
                              <span className="text-sm text-gray-500">Not provided</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <Github className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-900">GitHub</span>
                              </div>
                              <span className="text-sm text-gray-500">Not provided</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-900">Portfolio</span>
                              </div>
                              <span className="text-sm text-gray-500">Not provided</span>
                            </div>
                          </div>
                        </div>

                        {/* Interview History */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Interview History
                          </h3>
                          {(() => {
                            const candidateKey = `${selectedJob.id}_${viewingCandidate.id}`;
                            const history = interviewHistory[candidateKey] || [];
                            return history.length > 0 ? (
                              <div className="space-y-2">
                                {history.map((interview, idx) => {
                                  const stageName = interview.stage === 'talentAcquisition' ? 'Talent Acquisition' : interview.stage === 'technical' ? 'Technical' : 'Leadership';
                                  const reviewTitle = interview.stage === 'talentAcquisition' ? 'TA Review' : interview.stage === 'technical' ? 'Technical Interviewer Review' : 'Leadership Review';
                                  const bgColor = interview.stage === 'technical' ? 'bg-purple-50 border-purple-200' : interview.stage === 'leadership' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200';
                                  const textColor = interview.stage === 'technical' ? 'text-purple-900' : interview.stage === 'leadership' ? 'text-orange-900' : 'text-blue-900';
                                  
                                  return (
                                    <div key={idx} className={`${bgColor} border rounded-lg p-3 text-sm`}>
                                      <div className="flex items-start justify-between mb-2">
                                        <span className={`font-semibold ${textColor}`}>
                                          {stageName} Interview
                                        </span>
                                        <Badge className={interview.review ? 'bg-green-100 text-green-700 text-xs' : 'bg-blue-100 text-blue-700 text-xs'}>
                                          {interview.review ? '✓ Reviewed' : interview.status}
                                        </Badge>
                                      </div>
                                      <div className="text-gray-700 space-y-1 text-xs">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {new Date(interview.date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {interview.time}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          Interviewer: {interview.interviewer?.name || 'N/A'}
                                        </div>
                                        {interview.review && (
                                          <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                                            <p className={`font-medium ${textColor} mb-1`}>{reviewTitle}:</p>
                                            {interview.rating && (
                                              <div className="flex items-center gap-1 mb-1">
                                                {[...Array(5)].map((_, i) => (
                                                  <span key={i} className={`text-xs ${i < interview.rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
                                                ))}
                                              </div>
                                            )}
                                            <p className="text-gray-700 italic">{interview.review}</p>
                                          </div>
                                        )}
                                        {interview.link && (
                                          <div className="mt-2 text-xs flex gap-1 flex-col">
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(interview.link);
                                                alert("Interview link copied!");
                                              }}
                                              className="text-blue-600 hover:underline flex items-center gap-1 text-left"
                                            >
                                              <Globe className="w-3 h-3" />
                                              Copy Link
                                            </button>
                                            <a href={interview.link} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline flex items-center gap-1 font-semibold">
                                              <Video className="w-3 h-3" />
                                              Join Interview
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">No interviews scheduled yet</p>
                            );
                          })()}
                        </div>

                        {/* Services Section */}
                        {viewingCandidate.services && viewingCandidate.services.length > 0 && (
                          <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Briefcase className="w-5 h-5 text-orange-500" />
                              Services Offered ({viewingCandidate.services.length})
                            </h3>
                            <Button 
                              onClick={() => {
                                setSelectedCandidateServices(viewingCandidate);
                                setServicesDialogOpen(true);
                              }}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              View All Services
                            </Button>
                          </div>
                        )}

                        {/* Resume / CV */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Resume</h3>
                          {viewingCandidate?.resumeUrl ? (
                            <Button 
                              variant="outline" 
                              className="w-full flex items-center justify-center gap-2"
                              onClick={() => window.open(viewingCandidate.resumeUrl, '_blank')}
                            >
                              <Globe className="w-4 h-4" />
                              View CV
                            </Button>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No resume uploaded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Archived Tab */}
          <TabsContent value="archived" className="mt-0">
            {!currentJobData.archived || currentJobData.archived.length === 0 ? (
              <div className="bg-white rounded-lg border p-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Archive className="w-8 h-8 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Archived Applications</h3>
                    <p className="text-gray-500">Archived applications will appear here.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`grid gap-6 transition-all duration-300 ${viewingCandidate ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                  {currentJobData.archived.map((candidate) => (
                    <div 
                      key={candidate.id} 
                      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${viewingCandidate?.id === candidate.id ? 'border-primary shadow-md' : ''}`}
                      onClick={() => setViewingCandidate(candidate)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Archive className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                              <p className="text-sm text-gray-600">{candidate.email}</p>
                            </div>
                            <Badge className="bg-gray-100 text-gray-800 border-none">{candidate.statusDisplay}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {candidate.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {candidate.appliedDate}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {viewingCandidate && (
                  <div className="bg-white border rounded-lg p-6 sticky top-6 h-[calc(100vh-200px)] overflow-y-auto shadow-lg custom-scrollbar">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <h2 className="text-xl font-bold text-primary">{viewingCandidate.name}'s application</h2>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-primary border-primary">
                              Pipeline: {viewingCandidate.stage ? pipelineStages.find(s => s.id === viewingCandidate.stage)?.label : 'Pending'}
                            </Badge>
                            <button
                              onClick={() => setViewingCandidate(null)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                              title="Close"
                            >
                              <XCircle className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                            </button>
                          </div>
                        </div>

                        {/* Move to Maybe Button */}
                        <Button 
                          onClick={() => handleScreenCandidate(viewingCandidate, 'maybe')}
                          className="w-full bg-gradient-primary text-white mb-6"
                        >
                          Move to Maybe
                        </Button>

                        {/* AI Candidate Scoring */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-gray-900">AI Candidate Scoring</h3>
                          </div>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-red-500" />
                                <span className="font-semibold text-gray-900">Match Score</span>
                              </div>
                              <span className="text-2xl font-bold text-red-500">{viewingCandidate.matchScore}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Details */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Contact Details</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Phone className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Phone</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.phone}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Mail className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Email</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.email}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Professional Information */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Professional Information</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-gray-500">Current Company</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.company}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Personal & Education */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Personal & Education</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Location</div>
                                <div className="font-medium text-gray-900">{viewingCandidate.location}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Professional Links */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3">Professional Links</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <Linkedin className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-900">LinkedIn</span>
                              </div>
                              <span className="text-sm text-gray-500">Not provided</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <Github className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-900">GitHub</span>
                              </div>
                              <span className="text-sm text-gray-500">Not provided</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-900">Portfolio</span>
                              </div>
                              <span className="text-sm text-gray-500">Not provided</span>
                            </div>
                          </div>
                        </div>

                        {/* Interview History */}
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Interview History
                          </h3>
                          {(() => {
                            const candidateKey = `${selectedJob.id}_${viewingCandidate.id}`;
                            const history = interviewHistory[candidateKey] || [];
                            return history.length > 0 ? (
                              <div className="space-y-2">
                                {history.map((interview, idx) => {
                                  const stageName = interview.stage === 'talentAcquisition' ? 'Talent Acquisition' : interview.stage === 'technical' ? 'Technical' : 'Leadership';
                                  const reviewTitle = interview.stage === 'talentAcquisition' ? 'TA Review' : interview.stage === 'technical' ? 'Technical Interviewer Review' : 'Leadership Review';
                                  const bgColor = interview.stage === 'technical' ? 'bg-purple-50 border-purple-200' : interview.stage === 'leadership' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200';
                                  const textColor = interview.stage === 'technical' ? 'text-purple-900' : interview.stage === 'leadership' ? 'text-orange-900' : 'text-blue-900';
                                  
                                  return (
                                    <div key={idx} className={`${bgColor} border rounded-lg p-3 text-sm`}>
                                      <div className="flex items-start justify-between mb-2">
                                        <span className={`font-semibold ${textColor}`}>
                                          {stageName} Interview
                                        </span>
                                        <Badge className={interview.review ? 'bg-green-100 text-green-700 text-xs' : 'bg-blue-100 text-blue-700 text-xs'}>
                                          {interview.review ? '✓ Reviewed' : interview.status}
                                        </Badge>
                                      </div>
                                      <div className="text-gray-700 space-y-1 text-xs">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {new Date(interview.date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {interview.time}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          Interviewer: {interview.interviewer?.name || 'N/A'}
                                        </div>
                                        {interview.review && (
                                          <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                                            <p className={`font-medium ${textColor} mb-1`}>{reviewTitle}:</p>
                                            {interview.rating && (
                                              <div className="flex items-center gap-1 mb-1">
                                                {[...Array(5)].map((_, i) => (
                                                  <span key={i} className={`text-xs ${i < interview.rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
                                                ))}
                                              </div>
                                            )}
                                            <p className="text-gray-700 italic">{interview.review}</p>
                                          </div>
                                        )}
                                        {interview.link && (
                                          <div className="mt-2 text-xs flex gap-1 flex-col">
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(interview.link);
                                                alert("Interview link copied!");
                                              }}
                                              className="text-blue-600 hover:underline flex items-center gap-1 text-left"
                                            >
                                              <Globe className="w-3 h-3" />
                                              Copy Link
                                            </button>
                                            <a href={interview.link} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline flex items-center gap-1 font-semibold">
                                              <Video className="w-3 h-3" />
                                              Join Interview
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">No interviews scheduled yet</p>
                            );
                          })()}
                        </div>

                        {/* Services Section */}
                        {viewingCandidate.services && viewingCandidate.services.length > 0 && (
                          <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Briefcase className="w-5 h-5 text-orange-500" />
                              Services Offered ({viewingCandidate.services.length})
                            </h3>
                            <Button 
                              onClick={() => {
                                setSelectedCandidateServices(viewingCandidate);
                                setServicesDialogOpen(true);
                              }}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                            >
                              View All Services
                            </Button>
                          </div>
                        )}

                        {/* Resume / CV */}
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Resume</h3>
                          {viewingCandidate?.resumeUrl ? (
                            <Button 
                              variant="outline" 
                              className="w-full flex items-center justify-center gap-2"
                              onClick={() => window.open(viewingCandidate.resumeUrl, '_blank')}
                            >
                              <Globe className="w-4 h-4" />
                              View CV
                            </Button>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No resume uploaded</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Interview Review for {reviewingCandidate?.name}</DialogTitle>
            <DialogDescription>
              Provide your rating and detailed feedback on the candidate's interview performance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewRating(rating)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        rating <= reviewRating
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {reviewRating} out of 5
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes
              </label>
              <Textarea
                placeholder="Share your thoughts on this candidate's interview performance, strengths, areas for improvement, and overall impression..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialogOpen(false);
                setReviewText("");
                setReviewRating(3);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              className="bg-primary text-white"
              disabled={!reviewText.trim()}
            >
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Review Dialog */}
      <Dialog open={!!viewReviewCandidate} onOpenChange={() => setViewReviewCandidate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Interview Review - {viewReviewCandidate?.name}</DialogTitle>
            <DialogDescription>
              View the interview review and candidate information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < (viewReviewCandidate?.rating || 0)
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({viewReviewCandidate?.rating || 0}/5)
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  Reviewed: {viewReviewCandidate?.reviewedAt}
                </span>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Review Notes:</h4>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {viewReviewCandidate?.review}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Candidate Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{viewReviewCandidate?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{viewReviewCandidate?.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{viewReviewCandidate?.location}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setViewReviewCandidate(null)}
              className="bg-primary text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Candidate Detail Dialog with Actions */}
      <Dialog open={candidateDetailDialog} onOpenChange={setCandidateDetailDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Details - {detailCandidate?.name}</DialogTitle>
            <DialogDescription>
              View candidate information, interview reviews, and available actions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Candidate Info */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{detailCandidate?.name}</h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1 text-gray-700">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{detailCandidate?.email}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-700">
                      <Phone className="w-3 h-3" />
                      <span className="truncate">{detailCandidate?.phone}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-700">
                      <Briefcase className="w-3 h-3" />
                      <span className="truncate">{detailCandidate?.company}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-gray-900 text-xs">Current Stage:</span>
              <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5">
                {pipelineStages.find(s => s.id === detailCandidate?.stage)?.label || 'Unknown'}
              </Badge>
            </div>

            {/* AI Match Score */}
            {detailCandidate?.matchScore && (
              <div className="bg-red-50 rounded-lg p-2 border border-red-200 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4 text-red-500" />
                  <span className="font-semibold text-gray-900 text-xs">AI Match Score</span>
                </div>
                <span className="text-lg font-bold text-red-500">{detailCandidate.matchScore}%</span>
              </div>
            )}

            {/* Scheduled Interview Info */}
            {detailCandidate?.interview?.scheduled && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2 text-xs flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Scheduled Interview
                </h4>
                <div className="space-y-1 text-xs text-gray-700">
                  <div><strong>Date:</strong> {new Date(detailCandidate.interview.date).toLocaleDateString()}</div>
                  <div><strong>Time:</strong> {detailCandidate.interview.time}</div>
                  <div><strong>Interviewer:</strong> {detailCandidate.interview.interviewer.name}</div>
                  <div><strong>Role:</strong> {detailCandidate.interview.interviewer.role}</div>
                  <div><strong>Email:</strong> {detailCandidate.interview.interviewer.email}</div>
                </div>
              </div>
            )}

            {/* Interview Reviews Section - Progressive display based on current stage */}
            <div className="space-y-3">
              {(() => {
                const hasReview = (candidate, reviewType) => {
                  if (!candidate) return false; // Add null check
                  
                  if (reviewType === 'talentAcquisition') {
                    if (candidate.talentAcquisitionReview) {
                      return candidate.talentAcquisitionReview.toString().trim() !== '';
                    }
                    if (candidate.review) {
                      return candidate.review.toString().trim() !== '';
                    }
                  } else if (reviewType === 'technical') {
                    if (candidate.technicalReview) {
                      return candidate.technicalReview.toString().trim() !== '';
                    }
                  } else if (reviewType === 'leadership') {
                    if (candidate.leadershipReview) {
                      return candidate.leadershipReview.toString().trim() !== '';
                    }
                  }
                  return false;
                };
                
                const getReview = (candidate, reviewType) => {
                  if (!candidate) return null; // Add null check
                  
                  if (reviewType === 'talentAcquisition') {
                    if (candidate.talentAcquisitionReview) {
                      return {
                        rating: candidate.talentAcquisitionRating || 0,
                        review_text: candidate.talentAcquisitionReview,
                        created_at: candidate.talentAcquisitionReviewedAt || new Date().toISOString()
                      };
                    }
                    if (candidate.review) {
                      return {
                        rating: candidate.rating || 0,
                        review_text: candidate.review,
                        created_at: candidate.reviewedAt || new Date().toISOString()
                      };
                    }
                  } else if (reviewType === 'technical') {
                    if (candidate.technicalReview) {
                      return {
                        rating: candidate.technicalRating || 0,
                        review_text: candidate.technicalReview,
                        created_at: candidate.technicalReviewedAt || new Date().toISOString()
                      };
                    }
                  } else if (reviewType === 'leadership') {
                    if (candidate.leadershipReview) {
                      return {
                        rating: candidate.leadershipRating || 0,
                        review_text: candidate.leadershipReview,
                        created_at: candidate.leadershipReviewedAt || new Date().toISOString()
                      };
                    }
                  }
                  return null;
                };

                const reviews = [];
                const currentStage = detailCandidate?.stage;
                
                // Progressive display based on current stage:
                // - In talentAcquisition stage: Show only TA review
                // - In technical stage: Show TA + Technical reviews  
                // - In leadership/offer/hired stages: Show TA + Technical + Leadership reviews
                
                // Always show TA review if it exists (available from technical stage onwards)
                if (hasReview(detailCandidate, 'talentAcquisition')) {
                  const review = getReview(detailCandidate, 'talentAcquisition');
                  reviews.push(
                    <div key="ta" className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-emerald-800 text-sm">✓ Talent Acquisition Review</h4>
                        <Badge className="bg-emerald-100 text-emerald-800">
                          {parseFloat(review.rating).toFixed(1)} ⭐
                        </Badge>
                      </div>
                      <p className="text-sm text-emerald-700 mb-2 whitespace-pre-wrap">
                        {review.review_text}
                      </p>
                      <p className="text-xs text-emerald-600">
                        Submitted on {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  );
                }

                // Show Technical review only from leadership stage onwards
                if ((currentStage === 'technical' || currentStage === 'leadership' || currentStage === 'offer' || currentStage === 'rejectedOffers' || currentStage === 'hired') && hasReview(detailCandidate, 'technical')) {
                  const review = getReview(detailCandidate, 'technical');
                  reviews.push(
                    <div key="tech" className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-emerald-800 text-sm">✓ Technical Review</h4>
                        <Badge className="bg-emerald-100 text-emerald-800">
                          {parseFloat(review.rating).toFixed(1)} ⭐
                        </Badge>
                      </div>
                      <p className="text-sm text-emerald-700 mb-2 whitespace-pre-wrap">
                        {review.review_text}
                      </p>
                      <p className="text-xs text-emerald-600">
                        Submitted on {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  );
                }

                // Show Leadership review only from offer stage onwards
                if ((currentStage === 'leadership' || currentStage === 'offer' || currentStage === 'rejectedOffers' || currentStage === 'hired') && hasReview(detailCandidate, 'leadership')) {
                  const review = getReview(detailCandidate, 'leadership');
                  reviews.push(
                    <div key="leadership" className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-emerald-800 text-sm">✓ Leadership Review</h4>
                        <Badge className="bg-emerald-100 text-emerald-800">
                          {parseFloat(review.rating).toFixed(1)} ⭐
                        </Badge>
                      </div>
                      <p className="text-sm text-emerald-700 mb-2 whitespace-pre-wrap">
                        {review.review_text}
                      </p>
                      <p className="text-xs text-emerald-600">
                        Submitted on {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  );
                }

                return reviews;
              })()}
            </div>

            {/* Resume / CV Section */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2 text-xs flex items-center gap-1">
                <FileText className="w-4 h-4 text-gray-600" />
                Resume / CV
              </h4>
              {detailCandidate?.resumeUrl ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 text-xs py-2"
                  onClick={() => window.open(detailCandidate.resumeUrl, '_blank')}
                >
                  <Globe className="w-3 h-3" />
                  View  CV
                </Button>
              ) : (
                <p className="text-xs text-gray-500 italic">No resume uploaded</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="font-semibold text-gray-900 mb-2 text-xs">Actions</h4>
              {/* Show Send Offer button for Leadership stage, otherwise Move to Next Stage */}
              {detailCandidate?.stage === 'leadership' ? (
                <Button
                  onClick={() => {
                    setOfferCandidate(detailCandidate);
                    setOfferDetails({
                      candidateName: detailCandidate.name,
                      candidateEmail: detailCandidate.email,
                      candidatePhone: detailCandidate.phone,
                      position: selectedJob.title || "Software Engineer",
                      salary: "",
                      startDate: "",
                      benefits: "",
                      workLocation: ''
                    });
                    setOfferGenerated(false);
                    setGenerateOfferDialog(true);
                    setCandidateDetailDialog(false);
                  }}
                  className="w-full bg-gradient-primary hover:bg-orange-600 text-white hover:text-white text-xs py-2"
                >
                  <Briefcase className="w-4 h-4 mr-1" />
                  Send Offer
                </Button>
              ) : detailCandidate?.stage === 'technical' ? (
                <>
                  <Button
                    onClick={() => handleMoveToNextStage(detailCandidate)}
                    disabled={isMovingCandidate}
                    className="w-full bg-gradient-primary hover:bg-orange-600 text-white hover:text-white text-xs py-2"
                  >
                    {isMovingCandidate ? (
                      <>
                        <div className="w-4 h-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Moving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Move to Leadership Interview
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      // Skip Leadership and go directly to Offer
                      setOfferCandidate(detailCandidate);
                      setOfferDetails({
                        candidateName: detailCandidate?.name || '',
                        candidateEmail: detailCandidate?.email || '',
                        candidatePhone: detailCandidate?.phone || '',
                        position: selectedJob.title || "Software Engineer",
                        salary: "",
                        startDate: "",
                        benefits: "",
                        workLocation: ''
                      });
                      setOfferGenerated(false);
                      setGenerateOfferDialog(true);
                      setCandidateDetailDialog(false);
                    }}
                    variant="outline"
                    className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 text-xs py-2"
                  >
                    <Briefcase className="w-4 h-4 mr-1" />
                    Skip to Offer (Optional)
                  </Button>
                </>
              ) : detailCandidate?.stage === 'offer' ? (
                <div className="text-xs text-gray-500 text-center py-2">
                  Waiting for candidate response...
                </div>
              ) : detailCandidate?.stage === 'hired' ? (
                <div className="text-xs text-green-600 text-center py-2 font-medium">
                  ✓ Candidate successfully hired
                </div>
              ) : detailCandidate?.stage === 'rejectedOffers' ? (
                <div className="text-xs text-red-600 text-center py-2 font-medium">
                  Candidate rejected offer
                </div>
              ) : (
                <Button
                  onClick={() => handleMoveToNextStage(detailCandidate)}
                  disabled={isMovingCandidate}
                  className="w-full bg-gradient-primary hover:bg-orange-600 text-white hover:text-white text-xs py-2"
                >
                  {isMovingCandidate ? (
                    <>
                      <div className="w-4 h-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Moving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Move to Next Stage
                    </>
                  )}
                </Button>
              )}
              {/* Archive Button - Hide for To Contact, Rejected Offers, and Hired stages */}
              {detailCandidate?.stage !== 'toContact' && detailCandidate?.stage !== 'rejectedOffers' && detailCandidate?.stage !== 'hired' && (
                <Button
                  onClick={() => handleArchiveCandidate(detailCandidate)}
                  disabled={isMovingCandidate}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700 text-xs py-2"
                >
                  {isMovingCandidate ? (
                    <>
                      <div className="w-4 h-4 mr-1 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                      Archiving...
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4 mr-1" />
                      Move to Archive
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCandidateDetailDialog(false);
                setDetailCandidate(null);
              }}
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Schedule {interviewType === 'talentAcquisition' ? 'Talent Acquisition' : interviewType === 'technical' ? 'Technical' : 'Leadership'} Interview
            </DialogTitle>
            <DialogDescription>
              Select interviewer, date, time, and interview format for this candidate
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Candidate Info */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{schedulingCandidate?.name}</h4>
                  <p className="text-sm text-gray-600">{schedulingCandidate?.email}</p>
                </div>
              </div>
            </div>

            {/* Show Interviewer Selection for technical/leadership stages only */}
            {interviewType === 'talentAcquisition' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    Assigned to: {currentTeamMember?.name || 'You'}
                  </h4>
                  <p className="text-xs text-gray-600">Talent acquisition interview will be conducted by you</p>
                </div>
              </div>
            ) : ((schedulingCandidate?.stage === 'talentAcquisition' && interviewType === 'technical') ||
             (schedulingCandidate?.stage === 'technical' && interviewType === 'leadership')) ? (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Select {interviewType === 'technical' ? 'Technical' : 'Leadership'} Interviewer
                </label>
                <Select value={selectedInterviewer} onValueChange={setSelectedInterviewer}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Choose an interviewer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      console.log('🔍 All interviewers:', interviewers);
                      console.log('🎯 Current interviewType:', interviewType);
                      
                      // Filter interviewers based on interview type for better UX
                      const filteredInterviewers = interviewers.filter(interviewer => {
                        const dbInterviewType = interviewer.interviewType;
                        const targetType = interviewType;
                        
                        console.log('🎯 Filtering interviewer:', interviewer.name, 'Type:', dbInterviewType, 'Target:', targetType);
                        
                        // Direct match first
                        if (dbInterviewType === targetType) return true;
                        
                        // Handle naming variations between frontend and database
                        if (targetType === 'technical' && dbInterviewType === 'technical') return true;
                        if (targetType === 'leadership' && dbInterviewType === 'leadership') return true;
                        
                        return false;
                      });
                      
                      console.log('✅ Filtered interviewers:', filteredInterviewers);
                      return filteredInterviewers;
                    })()
                      .map((interviewer) => (
                        <SelectItem key={interviewer.id} value={interviewer.id}>
                          <div className="flex items-center gap-3 p-2 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-md">
                              <span className="text-white font-bold text-sm">
                                {interviewer.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'I'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{interviewer.name}</div>
                              <div className="text-xs text-gray-600 truncate">{interviewer.email}</div>
                              <div className="text-xs text-orange-600 font-medium truncate">
                                {interviewer.role?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Interviewer'}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">You are the interviewer</h4>
                  <p className="text-xs text-gray-600">This interview will be conducted by you</p>
                </div>
              </div>
            )}

            {/* Duration Selection */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Interview Duration
              </label>
              <Select value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(parseInt(value))}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Select Date */}
              <div>
                <label className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Select Date
                </label>
                <Input
                  type="date"
                  value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>

              {/* Select Time - Clock/Time Picker */}
              <div>
                <label className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Select Time (Hours & Minutes)
                </label>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Hours</label>
                      <select
                        value={selectedHours}
                        onChange={(e) => {
                          setSelectedHours(e.target.value);
                          setSelectedTime(`${e.target.value}:${selectedMinutes}`);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={String(i).padStart(2, '0')}>
                            {String(i).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Minutes</label>
                      <select
                        value={selectedMinutes}
                        onChange={(e) => {
                          setSelectedMinutes(e.target.value);
                          setSelectedTime(`${selectedHours}:${e.target.value}`);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {[0, 15, 30, 45].map((min) => (
                          <option key={min} value={String(min).padStart(2, '0')}>
                            {String(min).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-sm font-semibold text-blue-900">
                      Selected Time: <span className="text-lg">{selectedHours}:{selectedMinutes}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conflict Warning */}
            {selectedDate && selectedTime && interviewType === 'talentAcquisition' && checkInterviewConflict(selectedDate, selectedTime, currentTeamMember?.id, true) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span>You already have an interview scheduled at this time!</span>
              </div>
            )}

            {selectedDate && selectedTime && interviewType !== 'talentAcquisition' && selectedInterviewer && selectedInterviewer !== "self" && selectedInterviewer !== "current-user" && checkInterviewConflict(selectedDate, selectedTime, selectedInterviewer, false) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 text-sm">Scheduling Conflict Detected</h4>
                  <p className="text-sm text-red-700">
                    {interviewers.find(i => i.id === selectedInterviewer)?.name} already has an interview scheduled at this time. Please choose a different time slot.
                  </p>
                </div>
              </div>
            )}

            {/* Summary with Interview Link Generation */}
            {selectedDate && selectedTime && (
              (interviewType === 'talentAcquisition' && !checkInterviewConflict(selectedDate, selectedTime, currentTeamMember?.id, true)) ||
              (interviewType !== 'talentAcquisition' && (!selectedInterviewer || selectedInterviewer === "self" || selectedInterviewer === "current-user" || !checkInterviewConflict(selectedDate, selectedTime, selectedInterviewer, false)))
            ) && (
              <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Interview Summary
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[120px]">Candidate:</span>
                      <span>{schedulingCandidate?.name}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[120px]">Type:</span>
                      <span>{interviewType === 'talentAcquisition' ? 'Talent Acquisition' : interviewType === 'technical' ? 'Technical' : 'Leadership'} Interview</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[120px]">Interviewer:</span>
                      <span>
                        {selectedInterviewer === "self" 
                          ? "You (Employer)" 
                          : interviewers.find(i => i.id === selectedInterviewer)?.name || "Select Interviewer"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[120px]">Date:</span>
                      <span>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[120px]">Time:</span>
                      <span>{selectedHours}:{selectedMinutes}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[120px]">Duration:</span>
                      <span>{selectedDuration} minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="w-full flex gap-2 justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setScheduleDialogOpen(false);
                    setSchedulingCandidate(null);
                    setSelectedDate(null);
                    setSelectedTime("");
                    setSelectedInterviewer("");
                    setInterviewType("");
                    setSelectedDuration(60); // Reset duration
                  }}
                >
                  Cancel
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    // Generate the Meet link, show it, and immediately schedule (move to next stage), but do not open
                    const meetLink = `https://meet.google.com/new`;
                    setInterviewLink(meetLink);
                    setTimeout(() => {
                      handleScheduleInterview();
                    }, 500);
                  }}
                  className="bg-gradient-primary text-white"
                  disabled={isSchedulingInterview || !selectedDate || !selectedTime || 
                           (interviewType === 'talentAcquisition' && checkInterviewConflict(selectedDate, selectedTime, currentTeamMember?.id, true)) ||
                           (interviewType !== 'talentAcquisition' && ((schedulingCandidate?.stage === 'toContact' && interviewType === 'talentAcquisition') ||
                            (schedulingCandidate?.stage === 'talentAcquisition' && interviewType === 'technical') ||
                            (schedulingCandidate?.stage === 'technical' && interviewType === 'leadership')) && 
                           (!selectedInterviewer || checkInterviewConflict(selectedDate, selectedTime, selectedInterviewer, false)))}
                >
                  {isSchedulingInterview ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Generate Meet Link & Schedule
                    </>
                  )}
                </Button>
                {interviewLink && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={interviewLink}
                      readOnly
                      className="text-xs px-2 py-1 border border-gray-200 rounded bg-gray-50 flex-1 overflow-x-auto"
                    />
                    <a
                      href={interviewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Open
                    </a>
                  </div>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Offer Dialog */}
      <Dialog open={generateOfferDialog} onOpenChange={setGenerateOfferDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Generate Offer - {offerCandidate?.name}
            </DialogTitle>
            <DialogDescription>
              Create and customize an employment offer for this candidate
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
            {/* Offer Form */}
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Candidate Information
                </h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><strong>Name:</strong> {offerCandidate?.name}</p>
                  <p><strong>Email:</strong> {offerCandidate?.email}</p>
                  <p><strong>Phone:</strong> {offerCandidate?.phone}</p>
                  <p><strong>Applied for:</strong> {selectedJob?.title}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Offer Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="text"
                      value={offerDetails.position}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      placeholder="Job title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                    <input
                      type="text"
                      value={offerDetails.salary}
                      onChange={(e) => setOfferDetails({...offerDetails, salary: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g., $80,000/year"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={offerDetails.startDate}
                      onChange={(e) => setOfferDetails({...offerDetails, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
                    <input
                      type="text"
                      value={offerJobMeta.employmentType || selectedJob?.employment_type || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
                    <input
                      type="text"
                      value={offerJobMeta.workplace || offerDetails.workLocation || selectedJob?.workplace || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      placeholder="Work location"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Benefits & Perks</label>
                  <textarea
                    value={offerDetails.benefits}
                    onChange={(e) => setOfferDetails({...offerDetails, benefits: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
                    placeholder="Health insurance, vacation days, stock options, etc."
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleGenerateOffer}
                    className="bg-primary text-white"
                    disabled={!offerDetails.salary || !offerDetails.startDate}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Generate Offer
                  </Button>
                </div>
              </div>
            </div>

            {/* Offer Preview */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Offer Preview
              </h4>
              
              {offerGenerated ? (
                <div className="bg-white border-2 border-gray-300 rounded-lg p-6 shadow-sm min-h-[600px]">
                  {/* Company Header */}
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
                        <Briefcase className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">TalentsHub</h3>
                        <p className="text-gray-600">Technology Solutions Company</p>
                      </div>
                    </div>
                  </div>

                  {/* Offer Content */}
                  <div className="space-y-6 text-sm">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Job Offer Letter</h4>
                      <p className="text-gray-700">Date: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div>
                      <p className="text-gray-700 mb-4">Dear {offerCandidate?.name},</p>
                      <p className="text-gray-700 mb-4">
                        We are pleased to offer you the position of <strong>{offerDetails.position}</strong> at TalentsHub. 
                        We believe your skills and experience will be a valuable addition to our team.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <h5 className="font-semibold text-gray-900">Position Details:</h5>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>Position:</strong> {offerDetails.position}</div>
                        <div><strong>Salary:</strong> {offerDetails.salary}</div>
                        <div><strong>Start Date:</strong> {new Date(offerDetails.startDate).toLocaleDateString()}</div>
                        <div><strong>Employment Type:</strong> {offerJobMeta.employmentType || selectedJob?.employment_type || 'Not specified'}</div>
                        <div className="col-span-2"><strong>Work Location:</strong> {offerJobMeta.workplace || offerDetails.workLocation || selectedJob?.workplace || 'Not specified'}</div>
                      </div>
                    </div>

                    {offerDetails.benefits && (
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-2">Benefits & Perks:</h5>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-gray-700 text-sm whitespace-pre-line">{offerDetails.benefits}</p>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-gray-700 text-sm mb-4">
                        Please confirm your acceptance by replying to this offer. We look forward to welcoming you to the TalentsHub team!
                      </p>
                      <div className="space-y-2 text-sm">
                        <p><strong>Best regards,</strong></p>
                        <p>HR Department</p>
                        <p>TalentsHub</p>
                        <p className="text-gray-600">hr@talentshub.com | +1 (555) 123-4567</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <Download className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Offer Preview</h4>
                  <p className="text-gray-500">Fill in the offer details and click "Generate Offer" to see the preview</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setGenerateOfferDialog(false);
                setOfferCandidate(null);
                setOfferDetails({
                  candidateName: '',
                  candidateEmail: '',
                  candidatePhone: '',
                  position: '',
                  salary: '',
                  startDate: '',
                  benefits: '',
                  workLocation: ''
                });
                setOfferJobMeta({ employmentType: '', workplace: '' });
                setOfferGenerated(false);
              }}
            >
              Cancel
            </Button>
            {offerGenerated && (
              <Button onClick={handleSendOffer} className="bg-green-600 text-white hover:bg-green-700">
                <Mail className="w-4 h-4 mr-2" />
                Send Offer & Move to Offer Stage
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Services Dialog */}
      <Dialog open={servicesDialogOpen} onOpenChange={setServicesDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-orange-500" />
              Services by {selectedCandidateServices?.name}
            </DialogTitle>
            <DialogDescription>
              Explore professional services offered by this candidate
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            {selectedCandidateServices?.services && selectedCandidateServices.services.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {selectedCandidateServices.services.map((service) => {
                  const getIconComponent = (iconName) => {
                    const icons = {
                      Code, Palette, PenTool, Smartphone, TrendingUp, FileText, 
                      Languages, Music, Camera, Megaphone, Globe, Briefcase
                    };
                    return icons[iconName] || Briefcase;
                  };
                  const IconComponent = getIconComponent(service.icon);
                  
                  return (
                    <div
                      key={service.id}
                      className="group border border-orange-100 shadow-sm hover:shadow-lg transition-all duration-200 bg-white rounded-xl overflow-hidden flex flex-col"
                    >
                      <div className="p-6 pb-4 border-b border-orange-100 bg-white">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-7 h-7 text-orange-500" />
                          </div>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                          {service.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {service.description}
                        </p>
                      </div>
                      <div className="p-6 space-y-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                            {service.category}
                          </Badge>
                          <span>·</span>
                          <Clock className="w-3 h-3" />
                          <span>{service.deliveryTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-semibold">{service.rating}</span>
                          <span className="text-gray-500">({service.reviews} reviews)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {service.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md text-xs font-medium border border-orange-100"
                            >
                              {tag}
                            </span>
                          ))}
                          {service.tags.length > 3 && (
                            <span className="text-xs text-gray-400 pt-1">+{service.tags.length - 3} more</span>
                          )}
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-orange-100">
                          <div>
                            <span className="text-2xl font-bold text-orange-600">${service.startingPrice}</span>
                            <span className="text-xs text-gray-500 block">starting at</span>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-orange-500 text-white hover:bg-orange-600"
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Hire
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No services available</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setServicesDialogOpen(false);
                setSelectedCandidateServices(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </EmployerLayout>
  );
}