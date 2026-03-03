import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MapPin, Briefcase, Share2, Loader2, Send, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function Jobs() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [jobsData, setJobsData] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  
  // Search and filter states
  const [searchTitle, setSearchTitle] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [filters, setFilters] = useState({
    employmentType: [] as string[],
    industry: [] as string[],
    experienceLevel: [] as string[],
    jobLevel: [] as string[],
  });

  // Dynamic filter options
  const [filterOptions, setFilterOptions] = useState({
    employmentTypes: [] as { value: string; count: number }[],
    industries: [] as { value: string; count: number }[],
    experienceLevels: [] as { value: string; count: number }[],
    jobLevels: [] as { value: string; count: number }[],
  });

  useEffect(() => {
    loadPublishedJobs();
    if (isAuthenticated && user) {
      loadUserApplications();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    applyFilters();
  }, [jobsData, searchTitle, searchLocation, filters]);

  async function loadPublishedJobs() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          description,
          location,
          employment_type,
          profession,
          skills_required,
          created_at,
          employers!inner(company_name, logo_url)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedJobs = (data || []).map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.employers?.company_name || 'Company',
        logo: job.employers?.logo_url || job.employers?.company_name?.substring(0, 2).toUpperCase() || 'JB',
        location: job.location || 'Remote',
        category: job.profession || 'Technology',
        type: job.employment_type || 'Full-Time',
        description: job.description || '',
        tags: job.skills_required || [],
        postedTime: getTimeAgo(job.created_at),
        experienceLevel: job.experience_level || '',
        jobLevel: job.job_level || '',
      }));

      setJobsData(formattedJobs);
      setFilteredJobs(formattedJobs);
      calculateFilterOptions(formattedJobs);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      toast({
        title: "Error loading jobs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadUserApplications() {
    if (!user) return;

    try {
      // Get talent profile
      const { data: talentData } = await supabase
        .from('talents')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (talentData) {
        // Load applications
        const { data: applications } = await supabase
          .from('applications')
          .select('job_id')
          .eq('talent_id', talentData.id);

        if (applications) {
          setAppliedJobs(new Set(applications.map(app => app.job_id)));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  async function handleApply(job: any) {
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

    setSelectedJobForApply(job);
    setApplyDialogOpen(true);
  }

  async function submitApplication() {
    if (!user || !selectedJobForApply) return;

    setApplying(true);
    try {
      // Get talent profile with resume
      const { data: talentData, error: talentError } = await supabase
        .from('talents')
        .select('id, resume_url')
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

      // Submit application with talent's resume
      const { error: applicationError } = await supabase
        .from('applications')
        .insert({
          job_id: selectedJobForApply.id,
          talent_id: talentData.id,
          cover_letter: coverLetter,
          resume_url: talentData.resume_url,
          status: 'pending',
          stage: null
        });

      if (applicationError) throw applicationError;

      // Update applied jobs set
      setAppliedJobs(prev => new Set([...prev, selectedJobForApply.id]));

      toast({
        title: "Application Submitted!",
        description: "Your application has been sent successfully.",
      });

      setApplyDialogOpen(false);
      setCoverLetter('');
      setSelectedJobForApply(null);
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

  function handleShare(job: any) {
    const jobUrl = `${window.location.origin}/jobs/${job.id}`;
    navigator.clipboard.writeText(jobUrl);
    toast({
      title: "Link copied!",
      description: "Job link has been copied to your clipboard.",
    });
  }

  function calculateFilterOptions(jobs: any[]) {
    const employmentTypes: { [key: string]: number } = {};
    const industries: { [key: string]: number } = {};
    const experienceLevels: { [key: string]: number } = {};
    const jobLevels: { [key: string]: number } = {};

    jobs.forEach(job => {
      if (job.type) employmentTypes[job.type] = (employmentTypes[job.type] || 0) + 1;
      if (job.category) industries[job.category] = (industries[job.category] || 0) + 1;
      if (job.experienceLevel) experienceLevels[job.experienceLevel] = (experienceLevels[job.experienceLevel] || 0) + 1;
      if (job.jobLevel) jobLevels[job.jobLevel] = (jobLevels[job.jobLevel] || 0) + 1;
    });

    setFilterOptions({
      employmentTypes: Object.entries(employmentTypes).map(([value, count]) => ({ value, count })),
      industries: Object.entries(industries).map(([value, count]) => ({ value, count })),
      experienceLevels: Object.entries(experienceLevels).map(([value, count]) => ({ value, count })),
      jobLevels: Object.entries(jobLevels).map(([value, count]) => ({ value, count })),
    });
  }

  function applyFilters() {
    let filtered = [...jobsData];

    // Search by title
    if (searchTitle) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchTitle.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTitle.toLowerCase()) ||
        job.tags.some((tag: string) => tag.toLowerCase().includes(searchTitle.toLowerCase()))
      );
    }

    // Search by location
    if (searchLocation) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(searchLocation.toLowerCase())
      );
    }

    // Filter by employment type
    if (filters.employmentType.length > 0) {
      filtered = filtered.filter(job => filters.employmentType.includes(job.type));
    }

    // Filter by industry
    if (filters.industry.length > 0) {
      filtered = filtered.filter(job => filters.industry.includes(job.category));
    }

    // Filter by experience level
    if (filters.experienceLevel.length > 0) {
      filtered = filtered.filter(job => filters.experienceLevel.includes(job.experienceLevel));
    }

    // Filter by job level
    if (filters.jobLevel.length > 0) {
      filtered = filtered.filter(job => filters.jobLevel.includes(job.jobLevel));
    }

    setFilteredJobs(filtered);
  }

  function handleFilterChange(filterType: keyof typeof filters, value: string) {
    setFilters(prev => {
      const currentValues = prev[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return { ...prev, [filterType]: newValues };
    });
  }

  function clearAllFilters() {
    setFilters({
      employmentType: [],
      industry: [],
      experienceLevel: [],
      jobLevel: [],
    });
    setSearchTitle('');
    setSearchLocation('');
  }

  function handleSearch() {
    applyFilters();
  }
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-20">
        {/* Search Section */}
        <div className="bg-gradient-to-r from-primary to-orange-600 py-8 mt-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-4">
              <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-3">
                <Briefcase className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Job title or keyword..."
                  className="flex-1 outline-none"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-3">
                <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Location"
                  className="flex-1 outline-none"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button 
                onClick={handleSearch}
                className="bg-white hover:bg-gray-50 text-primary px-8 py-3 rounded-lg font-semibold shadow transition"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredJobs.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{jobsData.length}</span> jobs
            </p>
            {(filters.employmentType.length > 0 || filters.industry.length > 0 || 
              filters.experienceLevel.length > 0 || filters.jobLevel.length > 0 ||
              searchTitle || searchLocation) && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-primary hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside className="w-72 bg-white rounded-xl shadow-sm p-6 h-fit sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Filters</h3>
              {(filters.employmentType.length > 0 || filters.industry.length > 0 || 
                filters.experienceLevel.length > 0 || filters.jobLevel.length > 0) && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Active Filters */}
            {(filters.employmentType.length > 0 || filters.industry.length > 0 || 
              filters.experienceLevel.length > 0 || filters.jobLevel.length > 0) && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {[...filters.employmentType, ...filters.industry, ...filters.experienceLevel, ...filters.jobLevel].map((filter, idx) => (
                    <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      {filter}
                      <button 
                        onClick={() => {
                          if (filters.employmentType.includes(filter)) handleFilterChange('employmentType', filter);
                          else if (filters.industry.includes(filter)) handleFilterChange('industry', filter);
                          else if (filters.experienceLevel.includes(filter)) handleFilterChange('experienceLevel', filter);
                          else if (filters.jobLevel.includes(filter)) handleFilterChange('jobLevel', filter);
                        }}
                        className="hover:text-primary/80"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Employment Type */}
            {filterOptions.employmentTypes.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Employment Type
                </h4>
                <div className="space-y-2">
                  {filterOptions.employmentTypes.map(({ value, count }) => (
                    <label key={value} className="flex items-center justify-between text-sm hover:bg-gray-50 p-2 rounded cursor-pointer transition">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          checked={filters.employmentType.includes(value)}
                          onChange={() => handleFilterChange('employmentType', value)}
                        />
                        <span className="text-gray-700">{value}</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Industry */}
            {filterOptions.industries.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Industry</h4>
                <div className="space-y-2">
                  {filterOptions.industries.map(({ value, count }) => (
                    <label key={value} className="flex items-center justify-between text-sm hover:bg-gray-50 p-2 rounded cursor-pointer transition">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          checked={filters.industry.includes(value)}
                          onChange={() => handleFilterChange('industry', value)}
                        />
                        <span className="text-gray-700">{value}</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Level */}
            {filterOptions.experienceLevels.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Experience Level</h4>
                <div className="space-y-2">
                  {filterOptions.experienceLevels.map(({ value, count }) => (
                    <label key={value} className="flex items-center justify-between text-sm hover:bg-gray-50 p-2 rounded cursor-pointer transition">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          checked={filters.experienceLevel.includes(value)}
                          onChange={() => handleFilterChange('experienceLevel', value)}
                        />
                        <span className="text-gray-700">{value}</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Job Level */}
            {filterOptions.jobLevels.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Job Level</h4>
                <div className="space-y-2">
                  {filterOptions.jobLevels.map(({ value, count }) => (
                    <label key={value} className="flex items-center justify-between text-sm hover:bg-gray-50 p-2 rounded cursor-pointer transition">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          checked={filters.jobLevel.includes(value)}
                          onChange={() => handleFilterChange('jobLevel', value)}
                        />
                        <span className="text-gray-700">{value}</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Jobs List */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                <div className="mb-4">
                  <Briefcase className="w-16 h-16 mx-auto text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-500 mb-4">
                  {jobsData.length === 0 
                    ? "No published jobs available at the moment." 
                    : "Try adjusting your filters or search criteria."}
                </p>
                {(filters.employmentType.length > 0 || filters.industry.length > 0 || 
                  filters.experienceLevel.length > 0 || filters.jobLevel.length > 0 ||
                  searchTitle || searchLocation) && (
                  <button
                    onClick={clearAllFilters}
                    className="text-primary hover:underline font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
            <div className="space-y-4">
              {filteredJobs.map((job, idx) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gradient-primary text-white rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-md overflow-hidden">
                      {job.logo && (job.logo.startsWith('http://') || job.logo.startsWith('https://')) ? (
                        <img src={job.logo} alt={job.company} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-xl">{job.logo}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1 hover:text-primary transition">{job.title}</h3>
                          <p className="text-gray-600 font-medium">{job.company}</p>
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap">{job.postedTime}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3 text-sm">
                        <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location}
                        </span>
                        {job.category && (
                          <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-700">{job.category}</span>
                        )}
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{job.type}</span>
                      </div>
                      <p className="text-gray-700 mb-3 line-clamp-2 leading-relaxed">{job.description}</p>
                      {job.tags && job.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {job.tags.slice(0, 5).map((tag: string, idx: number) => (
                            <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                              {tag}
                            </span>
                          ))}
                          {job.tags.length > 5 && (
                            <span className="text-xs text-gray-500 px-2 py-1">+{job.tags.length - 5} more</span>
                          )}
                        </div>
                      )}
                      <div className="flex gap-3 pt-2">
                        {isAuthenticated && user?.user_role === 'talent' && (
                          <>
                            {appliedJobs.has(job.id) ? (
                              <Button
                                disabled
                                variant="outline"
                                className="flex items-center gap-1.5 text-green-600 border-green-600"
                              >
                                <Check className="w-4 h-4" />
                                Applied
                              </Button>
                            ) : (
                              <Button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleApply(job);
                                }}
                                className="flex items-center gap-1.5 bg-gradient-primary hover:opacity-90"
                              >
                                <Send className="w-4 h-4" />
                                Apply Now
                              </Button>
                            )}
                          </>
                        )}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleShare(job);
                          }}
                          className="flex items-center gap-1.5 text-gray-600 hover:text-primary transition font-medium"
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center items-center gap-2 mt-8">
              <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                ← Previous
              </button>
              <button className="px-3 py-2 text-sm bg-primary text-white rounded">1</button>
              <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">2</button>
              <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJobForApply?.title}</DialogTitle>
            <DialogDescription>
              at {selectedJobForApply?.company}
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
                  setSelectedJobForApply(null);
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
