import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapPin, Briefcase, Clock, Share2, ArrowLeft, Loader2, Building2, Send, Check } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function JobDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (id) {
      loadJobDetails();
      if (isAuthenticated && user) {
        checkApplicationStatus();
      }
    }
  }, [id, isAuthenticated, user]);

  async function loadJobDetails() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          employers!inner(
            company_name,
            logo_url,
            description,
            website,
            industry,
            company_size
          )
        `)
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      
      if (!data) {
        toast({
          title: "Job not found",
          description: "This job may have been removed or is no longer available.",
          variant: "destructive",
        });
        navigate('/jobs');
        return;
      }

      setJob(data);
    } catch (error: any) {
      console.error('Error loading job:', error);
      toast({
        title: "Error loading job",
        description: error.message,
        variant: "destructive",
      });
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  }

  async function checkApplicationStatus() {
    if (!user || !id) return;

    try {
      // Get talent profile
      const { data: talentData } = await supabase
        .from('talents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (talentData) {
        // Check if already applied
        const { data: application } = await supabase
          .from('applications')
          .select('id')
          .eq('talent_id', talentData.id)
          .eq('job_id', id)
          .maybeSingle();

        setHasApplied(!!application);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  }

  async function handleApply() {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to apply for jobs.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (user?.user_role !== 'talent') {
      toast({
        title: "Access Denied",
        description: "Only talents can apply for jobs.",
        variant: "destructive",
      });
      return;
    }

    setApplyDialogOpen(true);
  }

  async function submitApplication() {
    if (!user || !id) return;

    setApplying(true);
    try {
      // Get talent profile
      const { data: talentData, error: talentError } = await supabase
        .from('talents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (talentError) throw talentError;
      if (!talentData) {
        toast({
          title: "Profile Not Found",
          description: "Please complete your talent profile first.",
          variant: "destructive",
        });
        navigate('/talent/settings');
        return;
      }

      // Submit application
      const { error: applicationError } = await supabase
        .from('applications')
        .insert({
          job_id: id,
          talent_id: talentData.id,
          cover_letter: coverLetter,
          status: 'pending',
          stage: 'to-contact'
        });

      if (applicationError) throw applicationError;

      setHasApplied(true);
      toast({
        title: "Application Submitted!",
        description: "Your application has been sent successfully.",
      });

      setApplyDialogOpen(false);
      setCoverLetter('');
    } catch (error: any) {
      console.error('Error applying:', error);
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  }

  function getTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
    return `${Math.floor(seconds / 31536000)} years ago`;
  }

  function handleShare() {
    const jobUrl = `${window.location.origin}/jobs/${id}`;
    navigator.clipboard.writeText(jobUrl);
    toast({
      title: "Link copied!",
      description: "Job link has been copied to your clipboard.",
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-20 pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate("/jobs")}
            className="flex items-center gap-2 text-primary hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            ← All Jobs
          </button>

          <div className="grid grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="col-span-2">
              {/* Job Header */}
              <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-20 h-20 bg-gradient-primary text-white rounded-xl flex items-center justify-center font-bold text-2xl flex-shrink-0 shadow-lg overflow-hidden">
                    {job.employers?.logo_url ? (
                      <img src={job.employers.logo_url} alt={job.employers?.company_name} className="w-full h-full object-cover" />
                    ) : (
                      job.employers?.company_name?.substring(0, 2).toUpperCase() || 'JB'
                    )}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {job.title}
                    </h1>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-5 h-5 text-gray-500" />
                      <span className="text-lg font-semibold text-gray-700">{job.employers?.company_name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location || 'Remote'}
                      </Badge>
                      {job.profession && (
                        <Badge variant="secondary">{job.profession}</Badge>
                      )}
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                        {job.employment_type || 'Full-Time'}
                      </Badge>
                      {job.workplace && (
                        <Badge variant="outline">{job.workplace}</Badge>
                      )}
                      <span className="text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(job.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  {isAuthenticated && user?.user_role === 'talent' && (
                    hasApplied ? (
                      <Button
                        disabled
                        variant="outline"
                        className="flex items-center gap-2 text-green-600 border-green-600"
                      >
                        <Check className="w-4 h-4" />
                        Applied
                      </Button>
                    ) : (
                      <Button
                        onClick={handleApply}
                        className="flex items-center gap-2 bg-gradient-primary hover:opacity-90"
                      >
                        <Send className="w-4 h-4" />
                        Apply Now
                      </Button>
                    )
                  )}
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="font-medium">Share</span>
                  </button>
                </div>
              </div>

              {/* Job Description */}
              {job.description && (
                <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Job</h2>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {job.description}
                  </div>
                </div>
              )}

              {/* Job Details */}
              <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Details</h2>
                <div className="grid grid-cols-2 gap-6">
                  {job.experience_level && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Experience Level</p>
                      <p className="font-semibold text-gray-900">{job.experience_level}</p>
                    </div>
                  )}
                  {job.job_level && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Job Level</p>
                      <p className="font-semibold text-gray-900">{job.job_level}</p>
                    </div>
                  )}
                  {job.education_required && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Education Required</p>
                      <p className="font-semibold text-gray-900">{job.education_required}</p>
                    </div>
                  )}
                  {job.contract_type && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Contract Type</p>
                      <p className="font-semibold text-gray-900">{job.contract_type}</p>
                    </div>
                  )}
                  {job.positions_available && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Positions Available</p>
                      <p className="font-semibold text-gray-900">{job.positions_available}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Required Skills */}
              {job.skills_required && job.skills_required.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills_required.map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary" className="px-4 py-2 text-sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply Button */}
              {isAuthenticated && user?.user_role === 'talent' && (
                hasApplied ? (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full py-4 h-auto text-lg font-bold text-green-600 border-green-600"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Applied
                  </Button>
                ) : (
                  <Button
                    onClick={handleApply}
                    className="w-full bg-gradient-primary hover:opacity-90 text-white py-4 h-auto text-lg font-bold shadow-glow"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Apply for this Position
                  </Button>
                )
              )}
            </div>

            {/* Sidebar */}
            <div>
              {/* Company Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 sticky top-24">
                <div className="w-20 h-20 bg-gradient-primary text-white rounded-xl flex items-center justify-center font-bold text-2xl mb-4 shadow-lg mx-auto overflow-hidden">
                  {job.employers?.logo_url ? (
                    <img src={job.employers.logo_url} alt={job.employers?.company_name} className="w-full h-full object-cover" />
                  ) : (
                    job.employers?.company_name?.substring(0, 2).toUpperCase() || 'JB'
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{job.employers?.company_name}</h3>
                
                {job.employers?.industry && (
                  <div className="text-center mb-3">
                    <Badge variant="outline">{job.employers?.industry}</Badge>
                  </div>
                )}
                
                {job.employers?.description && (
                  <p className="text-gray-600 text-sm mb-4 text-center">
                    {job.employers?.description}
                  </p>
                )}

                {job.employers?.company_size && (
                  <div className="text-center mb-4 text-sm text-gray-600">
                    <span className="font-medium">Company Size:</span> {job.employers?.company_size} employees
                  </div>
                )}

                {job.employers?.website && (
                  <a 
                    href={job.employers?.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full text-center border border-primary text-primary hover:bg-primary/5 py-2 rounded-lg font-semibold mb-4 transition"
                  >
                    Visit Website
                  </a>
                )}

                {isAuthenticated && user?.user_role === 'talent' && (
                  hasApplied ? (
                    <Button
                      disabled
                      variant="outline"
                      className="w-full py-3 h-auto font-bold text-green-600 border-green-600"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Applied
                    </Button>
                  ) : (
                    <Button
                      onClick={handleApply}
                      className="w-full bg-gradient-primary hover:opacity-90 text-white py-3 h-auto font-bold shadow-glow"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Apply Now
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Apply for {job?.title}</DialogTitle>
            <DialogDescription>
              at {job?.employers?.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                Cover Letter (Optional)
              </label>
              <Textarea
                placeholder="Tell the employer why you're a great fit for this role..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={8}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-2">
                A well-written cover letter can increase your chances of getting an interview.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setApplyDialogOpen(false);
                  setCoverLetter('');
                }}
                disabled={applying}
              >
                Cancel
              </Button>
              <Button
                onClick={submitApplication}
                disabled={applying}
                className="bg-gradient-primary"
              >
                {applying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
