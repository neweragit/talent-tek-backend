import React, { useState, useEffect } from "react";
import TalentLayout from "@/components/layouts/TalentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { ExternalLink, Eye, Download, Trash2, Search, Loader2, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Application {
  id: string;
  job_id: string;
  status: string;
  stage: string;
  match_score: number;
  cover_letter: string;
  resume_url: string;
  applied_at: string;
  reviewed_at: string;
  jobs: {
    id: string;
    title: string;
    description: string;
    location: string;
    employment_type: string;
    workplace: string;
    profession: string;
    skills_required: string[];
    employers: {
      company_name: string;
      logo_url: string;
      industry: string;
    }[];
  }[];
}

const TalentApplications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  async function loadApplications() {
    if (!user) return;

    setLoading(true);
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
          description: "Please complete your talent profile.",
          variant: "destructive",
        });
        return;
      }

      // Load applications with job details
      const { data: applicationsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          id,
          job_id,
          status,
          stage,
          match_score,
          cover_letter,
          resume_url,
          applied_at,
          reviewed_at,
          jobs (
            id,
            title,
            description,
            location,
            employment_type,
            workplace,
            profession,
            skills_required,
            employers (
              company_name,
              logo_url,
              industry
            )
          )
        `)
        .eq('talent_id', talentData.id)
        .order('applied_at', { ascending: false });

      if (appsError) throw appsError;

      setApplications(applicationsData || []);
    } catch (error: any) {
      console.error('Error loading applications:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw(applicationId: string) {
    if (!confirm('Are you sure you want to withdraw this application?')) return;

    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: 'archived',
          stage: null 
        })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'archived', stage: null } 
            : app
        )
      );

      toast({
        title: "Application Withdrawn",
        description: "Your application has been withdrawn successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "reviewed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "shortlisted":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "interview-scheduled":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "offered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "hired":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "maybe":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in-progress":
        return "In Progress";
      case "shortlisted":
        return "Shortlisted";
      case "interview-scheduled":
        return "Interview Scheduled";
      case "offered":
        return "Offered";
      case "hired":
        return "Hired";
      case "rejected":
        return "Rejected";
      case "archived":
        return "Archived";
      case "maybe":
        return "Maybe";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

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

  const filteredApplications = applications.filter((app) => {
    const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
    const employer = job?.employers ? (Array.isArray(job.employers) ? job.employers[0] : job.employers) : null;
    
    const statusMatch = filterStatus === "all" || app.status === filterStatus;
    const searchMatch =
      employer?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  if (loading) {
    return (
      <TalentLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </TalentLayout>
    );
  }

  return (
    <TalentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Applications</h1>
          <p className="text-muted-foreground">Track and manage your job applications</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-col sm:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search by company or job title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="interview-scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="maybe">Maybe</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Applications ({filteredApplications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredApplications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Company
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Job Title
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Status
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Applied Date
                      </th>
                      <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app) => {
                      const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
                      const employer = job?.employers ? (Array.isArray(job.employers) ? job.employers[0] : job.employers) : null;
                      
                      return (
                        <tr
                          key={app.id}
                          className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
                                {employer?.logo_url ? (
                                  <img src={employer.logo_url} alt={employer.company_name} className="w-full h-full object-cover" />
                                ) : (
                                  employer?.company_name?.substring(0, 2).toUpperCase() || 'CO'
                                )}
                              </div>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {employer?.company_name || 'Company'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Link
                              to={`/jobs/${app.job_id}`}
                              className="text-primary hover:text-primary/80 font-medium flex items-center gap-1 w-fit group"
                            >
                              {job?.title || 'Job Title'}
                              <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={`${getStatusColor(app.status)} font-medium`}>
                              {getStatusLabel(app.status)}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                            {getTimeAgo(app.applied_at)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="View Job Details"
                                asChild
                                className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                <Link to={`/jobs/${app.job_id}`}>
                                  <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                </Link>
                              </Button>
                              {app.resume_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Download Resume"
                                  asChild
                                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                  <a href={app.resume_url} target="_blank" rel="noopener noreferrer" download>
                                    <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                  </a>
                                </Button>
                              )}
                              {app.status !== 'archived' && app.status !== 'rejected' && app.status !== 'hired' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Withdraw Application"
                                  onClick={() => handleWithdraw(app.id)}
                                  className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                                >
                                  <Trash2 className="w-4 h-4 text-slate-600 dark:text-slate-400 hover:text-red-600" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  {applications.length === 0 
                    ? "You haven't applied to any jobs yet" 
                    : "No applications found matching your filters"}
                </p>
                <Link to="/jobs">
                  <Button className="gap-2 bg-gradient-primary hover:opacity-90">
                    <Briefcase className="w-4 h-4" />
                    Browse Jobs
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TalentLayout>
  );
};

export default TalentApplications;
