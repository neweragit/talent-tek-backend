import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase,
  Building2,
  CalendarDays,
  GraduationCap,
  MapPin,
  Share2,
  Users,
} from "lucide-react";

type JobDetail = {
  id: string;
  title: string;
  description: string;
  location: string;
  workplace: string;
  employment_type: string;
  contract_type: string;
  experience_level: string;
  job_level: string;
  education_required: string;
  skills_required: string[];
  positions_available: number;
  created_at: string;
  what_you_will_do: string[];
  requirements: string[];
  employers?: {
    company_name?: string;
    industry?: string;
    logo_url?: string;
    company_size?: string;
    website?: string;
  } | null;
};

export default function JobDetails() {
  const { toast } = useToast();
  const { id } = useParams();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadJob = async () => {
      if (!id) return;
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("jobs")
          .select(
            `
            id,
            title,
            description,
            location,
            workplace,
            employment_type,
            contract_type,
            experience_level,
            job_level,
            education_required,
            skills_required,
            positions_available,
            created_at,
            what_you_will_do,
            requirements,
            employers (
              company_name,
              industry,
              logo_url,
              company_size,
              website
            )
          `
          )
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!ignore) {
          setJob(data as JobDetail);
        }
      } catch (err) {
        console.error("Failed to load job details:", err);
        if (!ignore) {
          toast({
            title: "Unable to load job details",
            description: "Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadJob();
    return () => {
      ignore = true;
    };
  }, [id, toast]);

  const postedLabel = useMemo(() => {
    if (!job?.created_at) return "Recently posted";
    const date = new Date(job.created_at);
    if (Number.isNaN(date.getTime())) return "Recently posted";
    return date.toLocaleDateString();
  }, [job?.created_at]);

  const handleShare = () => {
    if (!job) return;
    const jobUrl = `${window.location.origin}/jobs/${job.id}`;
    navigator.clipboard
      .writeText(jobUrl)
      .then(() => toast({ title: "Link copied to clipboard" }))
      .catch((error) => {
        toast({
          title: "Copy failed",
          description: error?.message || "Could not copy the link.",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-28 pb-16">
        {loading ? (
          <div className="rounded-3xl border border-orange-100 bg-white p-10 text-center shadow-lg">
            <p className="text-base font-semibold text-slate-600">Loading job details...</p>
          </div>
        ) : job ? (
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-orange-100 text-orange-700 shadow-inner">
                    {job.employers?.logo_url ? (
                      <img src={job.employers.logo_url} alt={job.employers?.company_name || "Company"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-bold">
                        {(job.employers?.company_name || "CO").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">
                      <Briefcase className="h-3.5 w-3.5" />
                      Job Details
                    </div>
                    <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">{job.title}</h1>
                    <p className="mt-2 text-base font-semibold text-slate-600">{job.employers?.company_name || "Company"}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.employers?.industry ? (
                        <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{job.employers.industry}</Badge>
                      ) : null}
                      {job.employment_type ? (
                        <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{job.employment_type}</Badge>
                      ) : null}
                      {job.workplace ? (
                        <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{job.workplace}</Badge>
                      ) : null}
                      {job.experience_level ? (
                        <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{job.experience_level}</Badge>
                      ) : null}
                      {job.job_level ? (
                        <Badge className="rounded-full border border-orange-200 bg-white text-orange-700">{job.job_level}</Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    onClick={handleShare}
                    className="rounded-full border border-orange-200 bg-white text-orange-700 hover:bg-orange-50"
                    variant="outline"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <div className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
                    Posted {postedLabel}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Location</p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    {job.location || "Not specified"}
                  </div>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Contract Type</p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Briefcase className="h-4 w-4 text-orange-500" />
                    {job.contract_type || "Not specified"}
                  </div>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Positions</p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Users className="h-4 w-4 text-orange-500" />
                    {job.positions_available || 1} opening{job.positions_available === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Education</p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <GraduationCap className="h-4 w-4 text-orange-500" />
                    {job.education_required || "Not specified"}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-bold text-slate-900">Job description</h2>
              </div>
              <p className="text-sm leading-7 text-slate-700 whitespace-pre-line">{job.description}</p>
            </section>



            {job.skills_required?.length ? (
              <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-bold text-slate-900">Required Skills</h3>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.skills_required.map((skill) => (
                    <Badge key={skill} className="rounded-full border border-orange-200 bg-orange-50 text-orange-700">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[2rem] border border-orange-100 bg-orange-50/70 p-6 text-sm font-semibold text-slate-700 shadow-sm">
              To apply, log in to your Talent dashboard.
            </section>
          </div>
        ) : (
          <div className="rounded-3xl border border-orange-100 bg-white p-10 text-center shadow-lg">
            <p className="text-base font-semibold text-slate-600">Job not found.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
