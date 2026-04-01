import { useCallback, useEffect, useMemo, useState } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PasswordInput } from "@/components/ui/password-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import {
  BadgeCheck,
  Ban,
  Building2,
  Calendar,
  CheckCircle,
  Copy,
  Eye,
  Loader2,
  Mail,
  MapPin,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Trash2,
  Users,
  X,
} from "lucide-react";

type EmployerRow = {
  id: string;
  user_id: string | null;
  company_name: string;
  tagline: string | null;
  description: string | null;
  industry: string | null;
  website: string | null;
  company_size: string | null;
  year_founded: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  zip_code: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  logo_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  rep_first_name: string | null;
  rep_last_name: string | null;
  users?: { email: string | null; is_active: boolean | null } | null;
};

type ActiveSubscriptionRow = {
  id: string;
  employer_id: string | null;
  status: string | null;
  started_at: string | null;
  created_at: string | null;
  plan: {
    id: string;
    name: string;
    display_name: string;
    price: number;
    target_user_type: string;
  } | null;
};

type CompanyStatus = "Active" | "Inactive" | "Suspended";
type StatusFilter = "all" | CompanyStatus;
type PlanFilter = "all" | string;

const createSteps = [
  { title: "Account Setup", description: "Step 1 of 4 (Essential)" },
  { title: "Company Basics", description: "Step 2 of 4 (Essential)" },
  { title: "Company Profile", description: "Step 3 of 4 (Optional)" },
  { title: "Review & Submit", description: "Step 4 of 4" },
];

const normalizeEmail = (email: string) =>
  email.trim().toLowerCase().replace(/\s+/g, "");

const toNullable = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const formatJoined = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getCompanyInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getStatusClasses = (status: CompanyStatus) => {
  if (status === "Active") return "border-green-200 bg-green-50 text-green-700";
  if (status === "Suspended")
    return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-orange-200 bg-orange-50 text-orange-700";
};

const planToneClass = (displayName: string) => {
  const val = displayName.toLowerCase();
  if (val.includes("enterprise"))
    return "border-purple-200 bg-purple-50 text-purple-700";
  if (val.includes("growth")) return "border-blue-200 bg-blue-50 text-blue-700";
  if (val.includes("professional"))
    return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
};

const normalizePlanLabel = (plan: ActiveSubscriptionRow["plan"] | null) => {
  if (!plan) return "Starter";
  return plan.display_name || plan.name || "Starter";
};

const getCompanyStatus = (employer: EmployerRow): CompanyStatus => {
  if (!employer.user_id) return "Inactive";
  if (employer.users?.is_active === false) return "Suspended";
  return "Active";
};

export default function OwnerEmployers() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [employers, setEmployers] = useState<EmployerRow[]>([]);
  const [teamCounts, setTeamCounts] = useState<Record<string, number>>({});
  const [activeSubscriptions, setActiveSubscriptions] = useState<
    Record<string, ActiveSubscriptionRow>
  >({});

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");

  const [confirmSuspendOpen, setConfirmSuspendOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    employerId: string;
    nextActive: boolean;
  } | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EmployerRow | null>(null);
  const [deleteChecking, setDeleteChecking] = useState(false);
  const [deleteCounts, setDeleteCounts] = useState<{ jobs: number; team: number; subs: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const deleteBlockers = useMemo(() => {
    if (!deleteCounts) return [];
    const items = [
      {
        key: "jobs",
        label: "Jobs",
        count: deleteCounts.jobs,
        hint: "Delete or move the company jobs first.",
      },
      {
        key: "team",
        label: "Team members",
        count: deleteCounts.team,
        hint: "Remove company team members first.",
      },
      {
        key: "subs",
        label: "Subscriptions",
        count: deleteCounts.subs,
        hint: "Cancel or detach active subscriptions first.",
      },
    ] as const;

    return items.filter((item) => item.count > 0);
  }, [deleteCounts]);

  const canDeleteCompany =
    !!deleteCounts && deleteCounts.jobs === 0 && deleteCounts.team === 0 && deleteCounts.subs === 0;

  const [viewOpen, setViewOpen] = useState(false);
  const [viewEmployer, setViewEmployer] = useState<EmployerRow | null>(null);
  const [viewDetailsLoading, setViewDetailsLoading] = useState(false);
  const [viewJobsCount, setViewJobsCount] = useState<number | null>(null);
  const [viewTeamMembers, setViewTeamMembers] = useState<
    Array<{
      id: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      users?: { email: string | null } | null;
    }>
  >([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4>(1);
  const [createValidating, setCreateValidating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    companyName: string;
  } | null>(null);
  const [createForm, setCreateForm] = useState({
    repFirstName: "",
    repLastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    industry: "",
    city: "",
    country: "",
    companyTagline: "",
    companyDescription: "",
    website: "",
    companySize: "",
    yearFounded: "",
    address: "",
    zipCode: "",
    linkedinUrl: "",
    facebookUrl: "",
    logoUrl: "",
    logoFile: null as File | null,
  });

  const loadEmployers = useCallback(async () => {
    try {
      setLoading(true);

      const [employersRes, teamRes, subsRes] = await Promise.all([
        supabase
          .from("employers")
          .select(
            "id,user_id,company_name,tagline,description,industry,website,company_size,year_founded,address,city,country,zip_code,linkedin_url,facebook_url,logo_url,created_at,updated_at,rep_first_name,rep_last_name",
          )
          .order("created_at", { ascending: false }),
        supabase.from("employer_team_members").select("employer_id"),
        supabase
          .from("subscriptions")
          .select(
            "id,employer_id,status,started_at,created_at,plan:plans(id,name,display_name,price,target_user_type)",
          )
          .eq("status", "active")
          .order("started_at", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (employersRes.error) throw employersRes.error;
      if (teamRes.error) throw teamRes.error;
      if (subsRes.error) throw subsRes.error;

      const employersData = ((employersRes.data as EmployerRow[]) ?? []).map((e) => ({
        ...e,
        users: null,
      }));

      const userIds = Array.from(new Set(employersData.map((e) => e.user_id).filter(Boolean))) as string[];
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id,email,is_active")
          .in("id", userIds);
        if (usersError) throw usersError;

        const byId: Record<string, { email: string | null; is_active: boolean | null }> = {};
        for (const u of usersData ?? []) {
          const id = (u as any)?.id as string | undefined;
          if (!id) continue;
          byId[id] = { email: (u as any)?.email ?? null, is_active: (u as any)?.is_active ?? null };
        }

        for (const e of employersData) {
          if (e.user_id && byId[e.user_id]) e.users = byId[e.user_id];
        }
      }

      setEmployers(employersData);

      const counts: Record<string, number> = {};
      for (const row of teamRes.data ?? []) {
        const employerId = (row as any)?.employer_id as string | null;
        if (!employerId) continue;
        counts[employerId] = (counts[employerId] ?? 0) + 1;
      }
      setTeamCounts(counts);

      const subsMap: Record<string, ActiveSubscriptionRow> = {};
      const subsData = (subsRes.data as any as ActiveSubscriptionRow[]) ?? [];
      for (const sub of subsData) {
        if (!sub.employer_id) continue;
        if (
          sub.plan?.target_user_type &&
          sub.plan.target_user_type !== "employer"
        ) {
          continue;
        }
        if (!subsMap[sub.employer_id]) subsMap[sub.employer_id] = sub;
      }
      setActiveSubscriptions(subsMap);
    } catch (err: any) {
      console.error("OwnerEmployers load failed:", err);
      toast({
        title: "Failed to load companies",
        description: err?.message || "Unable to load employers from database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadEmployers();
  }, [loadEmployers]);

  const planOptions = useMemo(() => {
    const values = new Set<string>();
    values.add("Starter");
    Object.values(activeSubscriptions).forEach((sub) =>
      values.add(normalizePlanLabel(sub.plan)),
    );
    return ["all", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [activeSubscriptions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employers.filter((e) => {
      const status = getCompanyStatus(e);
      if (statusFilter !== "all" && status !== statusFilter) return false;

      const sub = activeSubscriptions[e.id];
      const planName = normalizePlanLabel(sub?.plan ?? null);
      if (planFilter !== "all" && planName !== planFilter) return false;

      if (!q) return true;

      const adminName = [e.rep_first_name, e.rep_last_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const email = (e.users?.email ?? "").toLowerCase();
      const location = [e.city, e.country]
        .filter(Boolean)
        .join(", ")
        .toLowerCase();
      const industry = (e.industry ?? "").toLowerCase();
      const company = e.company_name.toLowerCase();

      return (
        company.includes(q) ||
        email.includes(q) ||
        adminName.includes(q) ||
        location.includes(q) ||
        industry.includes(q) ||
        planName.toLowerCase().includes(q)
      );
    });
  }, [
    employers,
    query,
    statusFilter,
    planFilter,
    activeSubscriptions,
  ]);

  const kpis = useMemo(() => {
    const totalCompanies = employers.length;
    const activeAccounts = employers.filter(
      (e) => e.user_id && e.users?.is_active !== false,
    ).length;

    let premiumPlans = 0;
    for (const employer of employers) {
      const sub = activeSubscriptions[employer.id];
      if (!sub?.plan) continue;
      if ((sub.plan.price ?? 0) > 0) premiumPlans += 1;
    }

    const totalMembers = Object.values(teamCounts).reduce(
      (sum, n) => sum + n,
      0,
    );
    const avgTeamSize =
      totalCompanies > 0
        ? Math.round((totalMembers / totalCompanies) * 10) / 10
        : 0;

    return { totalCompanies, activeAccounts, premiumPlans, avgTeamSize };
  }, [employers, activeSubscriptions, teamCounts]);

  const toggleSuspend = async (employerId: string, nextActive: boolean) => {
    const employer = employers.find((e) => e.id === employerId);
    if (!employer?.user_id) {
      toast({
        title: "Action unavailable",
        description: "This company is missing a linked user account.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: nextActive })
        .eq("id", employer.user_id);
      if (error) throw error;
      toast({
        title: nextActive ? "Account reactivated" : "Account suspended",
        description: `${employer.company_name} is now ${
          nextActive ? "active" : "suspended"
        }.`,
      });
      await loadEmployers();
    } catch (err: any) {
      console.error("Suspend/reactivate failed:", err);
      toast({
        title: "Update failed",
        description: err?.message || "Unable to update this account.",
        variant: "destructive",
      });
    }
  };

  const openSuspendDialog = (employerId: string, nextActive: boolean) => {
    setConfirmTarget({ employerId, nextActive });
    setConfirmSuspendOpen(true);
  };

  const openDeleteDialog = async (company: EmployerRow) => {
    setDeleteTarget(company);
    setDeleteCounts(null);
    setDeleteOpen(true);
    setDeleteChecking(true);

    try {
      const [jobsRes, teamRes, subsRes] = await Promise.all([
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("employer_id", company.id),
        supabase.from("employer_team_members").select("id", { count: "exact", head: true }).eq("employer_id", company.id),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("employer_id", company.id),
      ]);

      if (jobsRes.error) throw jobsRes.error;
      if (teamRes.error) throw teamRes.error;
      if (subsRes.error) throw subsRes.error;

      setDeleteCounts({
        jobs: jobsRes.count ?? 0,
        team: teamRes.count ?? 0,
        subs: subsRes.count ?? 0,
      });
    } catch (err: any) {
      console.error("Delete eligibility check failed:", err);
      toast({
        title: "Could not check delete eligibility",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteChecking(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    if (!deleteCounts) return;
    const canDelete = deleteCounts.jobs === 0 && deleteCounts.team === 0 && deleteCounts.subs === 0;
    if (!canDelete) return;

    setDeleting(true);
    try {
      const { error: employerDeleteError } = await supabase.from("employers").delete().eq("id", deleteTarget.id);
      if (employerDeleteError) throw employerDeleteError;

      if (deleteTarget.user_id) {
        await supabase.from("users").delete().eq("id", deleteTarget.user_id);
      }

      toast({ title: "Company deleted", description: `${deleteTarget.company_name} has been removed.` });
      setDeleteOpen(false);
      setDeleteTarget(null);
      setDeleteCounts(null);
      await loadEmployers();
    } catch (err: any) {
      console.error("Delete failed:", err);
      toast({
        title: "Delete failed",
        description: err?.message || "Unable to delete this company.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const openViewCompany = async (employer: EmployerRow) => {
    setViewEmployer(employer);
    setViewOpen(true);
    setViewDetailsLoading(true);
    setViewJobsCount(null);
    setViewTeamMembers([]);

    try {
      const [jobsRes, teamRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("employer_id", employer.id),
        supabase
          .from("employer_team_members")
          .select("id,first_name,last_name,phone,user_id")
          .eq("employer_id", employer.id)
          .order("created_at", { ascending: true }),
      ]);

      if (jobsRes.error) throw jobsRes.error;
      if (teamRes.error) throw teamRes.error;

      setViewJobsCount(jobsRes.count ?? 0);

      const members = (teamRes.data as any as Array<{ id: string; user_id: string; first_name: string | null; last_name: string | null; phone: string | null }>) ?? [];
      const memberUserIds = Array.from(new Set(members.map((m) => m.user_id).filter(Boolean)));

      let usersById: Record<string, { email: string | null }> = {};
      if (memberUserIds.length > 0) {
        const { data: memberUsers, error: memberUsersError } = await supabase
          .from("users")
          .select("id,email")
          .in("id", memberUserIds as string[]);
        if (memberUsersError) throw memberUsersError;
        usersById = Object.fromEntries(
          (memberUsers ?? []).map((u: any) => [u.id as string, { email: (u.email ?? null) as string | null }]),
        );
      }

      setViewTeamMembers(
        members.map((m) => ({
          id: m.id,
          first_name: m.first_name ?? null,
          last_name: m.last_name ?? null,
          phone: m.phone ?? null,
          users: usersById[m.user_id] ?? null,
        })),
      );
    } catch (err: any) {
      console.error("OwnerEmployers view load failed:", err);
      toast({
        title: "Failed to load company details",
        description: err?.message || "Could not load additional company data.",
        variant: "destructive",
      });
    } finally {
      setViewDetailsLoading(false);
    }
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateStep(1);
    setCreating(false);
    setCreateForm({
      repFirstName: "",
      repLastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      companyName: "",
      industry: "",
      city: "",
      country: "",
      companyTagline: "",
      companyDescription: "",
      website: "",
      companySize: "",
      yearFounded: "",
      address: "",
      zipCode: "",
      linkedinUrl: "",
      facebookUrl: "",
      logoUrl: "",
      logoFile: null,
    });
  };

  const validateCreateStep = useCallback(
    async (nextStep: number) => {
      setCreateValidating(true);
      try {
        if (nextStep === 2) {
          if (!createForm.repFirstName.trim() || !createForm.repLastName.trim() || !createForm.email.trim()) {
            toast({
              title: "Missing required fields",
              description: "Representative first name, last name, and email are required.",
              variant: "destructive",
            });
            return false;
          }

          const email = normalizeEmail(createForm.email);
          if (createForm.password.length < 8) {
            toast({
              title: "Weak password",
              description: "Password must be at least 8 characters.",
              variant: "destructive",
            });
            return false;
          }

          if (createForm.password !== createForm.confirmPassword) {
            toast({
              title: "Password mismatch",
              description: "Password and confirm password do not match.",
              variant: "destructive",
            });
            return false;
          }

          const { data: existingUsers, error: checkError } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .limit(1);

          if (checkError) {
            toast({
              title: "Error",
              description: "Failed to verify email. Please try again.",
              variant: "destructive",
            });
            return false;
          }

          if (existingUsers && existingUsers.length > 0) {
            toast({
              title: "Email already registered",
              description: "This email is already in use. Please use a different email.",
              variant: "destructive",
            });
            return false;
          }

          setCreateForm((prev) => ({ ...prev, email }));
        }

        if (nextStep === 3 && !createForm.companyName.trim()) {
          toast({
            title: "Missing company name",
            description: "Company name is required.",
            variant: "destructive",
          });
          return false;
        }

        return true;
      } finally {
        setCreateValidating(false);
      }
    },
    [createForm, toast],
  );

  const handleCreateSubmit = async () => {
    if (creating) return;
    if (!createForm.companyName.trim()) {
      toast({ title: "Missing company name", description: "Company name is required.", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const normalizedEmail = normalizeEmail(createForm.email);
      const passwordHash = await bcrypt.hash(createForm.password, 10);

      const { data: createdUser, error: userError } = await supabase
        .from("users")
        .insert({
          email: normalizedEmail,
          password_hash: passwordHash,
          user_role: "superadmin",
          is_active: true,
          email_verified: false,
          profile_completed: false,
        })
        .select("id,email")
        .maybeSingle();

      if (userError || !createdUser?.id) throw userError || new Error("Could not create user.");

      let logoUrl = "";
      if (createForm.logoFile) {
        const fileExtension = createForm.logoFile.name.split(".").pop();
        const timestamp = Date.now();
        const filePath = `company_logo_${timestamp}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("companys_logo")
          .upload(filePath, createForm.logoFile, { cacheControl: "3600", upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from("companys_logo").getPublicUrl(filePath);
        logoUrl = publicUrlData.publicUrl;
      }

      const { data: createdEmployer, error: employerError } = await supabase
        .from("employers")
        .insert({
          user_id: createdUser.id,
          company_name: createForm.companyName.trim(),
          tagline: toNullable(createForm.companyTagline),
          description: toNullable(createForm.companyDescription),
          industry: toNullable(createForm.industry),
          website: toNullable(createForm.website),
          company_size: toNullable(createForm.companySize),
          year_founded: toNullable(createForm.yearFounded),
          address: toNullable(createForm.address),
          city: toNullable(createForm.city),
          country: toNullable(createForm.country),
          zip_code: toNullable(createForm.zipCode),
          linkedin_url: toNullable(createForm.linkedinUrl),
          facebook_url: toNullable(createForm.facebookUrl),
          logo_url: toNullable(logoUrl),
          rep_first_name: toNullable(createForm.repFirstName),
          rep_last_name: toNullable(createForm.repLastName),
        })
        .select("id")
        .maybeSingle();

      if (employerError || !createdEmployer?.id) throw employerError || new Error("Could not create employer.");

      toast({ title: "Company admin created", description: `${createForm.companyName} is ready.` });
      setCreatedCredentials({
        email: normalizeEmail(createForm.email),
        password: createForm.password,
        companyName: createForm.companyName.trim(),
      });
      setCredentialsOpen(true);
      closeCreate();
      await loadEmployers();
    } catch (err: any) {
      console.error("Create employer failed:", err);
      toast({
        title: "Create failed",
        description: err?.message || "Unable to create this company admin.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="max-w-6xl px-4 pb-10 pt-6 xl:px-0 xl:pt-10">
        <section className="mb-8 overflow-hidden rounded-[2.5rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-orange-50 shadow-[0_30px_60px_-40px_rgba(234,88,12,0.35)]">
          <div className="p-8 md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
              <div className="max-w-xl">
                <Badge className="mb-4 inline-flex rounded-full border border-orange-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Owner Portal
                </Badge>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                  Company Admins
                </h1>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  Manage every subscribing organization on TalenTek — review plan
                  tiers, team sizes, and account health in one unified panel.
                </p>

                <div className="mt-5">
                  <Badge className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
                    Showing all {employers.length} company admins
                  </Badge>
                </div>
              </div>

              <div className="grid w-full gap-4 sm:max-w-[420px] md:grid-cols-2 lg:max-w-none lg:w-[420px] lg:min-w-[420px] xl:w-[480px] xl:min-w-[480px] shrink-0 lg:flex-none">
                {[
                  {
                    title: "Total Companies",
                    value: kpis.totalCompanies,
                    detail: "Registered organizations",
                    icon: Building2,
                  },
                  {
                    title: "Active Accounts",
                    value: kpis.activeAccounts,
                    detail: "Currently active",
                    icon: BadgeCheck,
                  },
                  {
                    title: "Premium Plans",
                    value: kpis.premiumPlans,
                    detail: "Paid subscriptions",
                    icon: TrendingUp,
                  },
                  {
                    title: "Avg Team Size",
                    value: kpis.avgTeamSize,
                    detail: "Members per company",
                    icon: Users,
                  },
                ].map((stat) => (
                  <div
                    key={stat.title}
                    className="rounded-3xl border border-orange-100 bg-white p-6 shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 leading-snug whitespace-normal break-normal text-balance">
                          {stat.title}
                        </p>
                        <div className="mt-2 text-3xl font-bold leading-none text-slate-900">
                          {stat.value}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600 whitespace-normal break-normal text-balance">
                          {stat.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
              <Input
                placeholder="Search by company, admin name, or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <Select value={planFilter} onValueChange={(v) => setPlanFilter(v)}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {planOptions
                .filter((v) => v !== "all")
                .map((plan) => (
                  <SelectItem key={plan} value={plan}>
                    {plan}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Dialog
            open={createOpen}
            onOpenChange={(open) => (open ? setCreateOpen(true) : closeCreate())}
          >
            <DialogTrigger asChild>
              <Button className="h-14 rounded-3xl bg-gradient-to-r from-orange-600 to-orange-500 px-6 text-white shadow-lg hover:from-orange-700 hover:to-orange-600">
                <Plus className="mr-2 h-5 w-5" />
                Add Company Admin
              </Button>
            </DialogTrigger>            <DialogContent className="max-w-md max-h-[90vh] overflow-hidden rounded-[28px] border-0 bg-transparent p-0 shadow-none">
              <Card className="rounded-[28px] border-2 border-orange-500 bg-white shadow-2xl transition-all duration-300 overflow-hidden">
                <CardHeader className="text-center p-8 pb-2 bg-white">
                  <CardTitle className="text-4xl sm:text-5xl font-bold tracking-tighter leading-tight text-slate-900 mb-2">
                    {createSteps[createStep - 1].title}
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base leading-relaxed text-gray-700">
                    {createSteps[createStep - 1].description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 p-8 max-h-[75vh] overflow-y-auto">
                  <div className="flex justify-center mb-6">
                    {createSteps.map((entry, idx) => (
                      <div
                        key={entry.title}
                        className={`w-6 h-6 rounded-full flex items-center justify-center mx-1 text-xs font-bold border-2 ${
                          createStep === idx + 1
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white text-orange-500 border-orange-200"
                        }`}
                      >
                        {idx + 1}
                      </div>
                    ))}
                  </div>

                  {createStep === 1 && (
                    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ownerRepFirstName">Representative First Name</Label>
                          <Input
                            id="ownerRepFirstName"
                            disabled={createValidating || creating}
                            value={createForm.repFirstName}
                            onChange={(e) => setCreateForm((p) => ({ ...p, repFirstName: e.target.value }))}
                            required
                            className="bg-orange-50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ownerRepLastName">Representative Last Name</Label>
                          <Input
                            id="ownerRepLastName"
                            disabled={createValidating || creating}
                            value={createForm.repLastName}
                            onChange={(e) => setCreateForm((p) => ({ ...p, repLastName: e.target.value }))}
                            required
                            className="bg-orange-50"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="ownerCompanyEmail">Company Email</Label>
                        <Input
                          id="ownerCompanyEmail"
                          type="email"
                          disabled={createValidating || creating}
                          value={createForm.email}
                          onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                          autoComplete="email"
                          required
                          className="bg-orange-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ownerPassword">Password</Label>
                        <PasswordInput
                          id="ownerPassword"
                          disabled={createValidating || creating}
                          value={createForm.password}
                          onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                          required
                          className="bg-orange-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Use at least 8 characters.</p>
                      </div>
                      <div>
                        <Label htmlFor="ownerConfirmPassword">Confirm Password</Label>
                        <PasswordInput
                          id="ownerConfirmPassword"
                          disabled={createValidating || creating}
                          value={createForm.confirmPassword}
                          onChange={(e) => setCreateForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                          required
                          className="bg-orange-50"
                        />
                      </div>
                      <Button
                        type="button"
                        className="w-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4 mt-2"
                        disabled={createValidating || creating}
                        onClick={async () => {
                          if (await validateCreateStep(2)) {
                            setCreateStep(2);
                          }
                        }}
                      >
                        {createValidating ? "Checking Email..." : "Continue"}
                      </Button>
                    </form>
                  )}

                  {createStep === 2 && (
                    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                      <div>
                        <Label htmlFor="ownerCompanyName">Company Name</Label>
                        <Input
                          id="ownerCompanyName"
                          disabled={createValidating || creating}
                          value={createForm.companyName}
                          onChange={(e) => setCreateForm((p) => ({ ...p, companyName: e.target.value }))}
                          required
                          className="bg-orange-50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ownerIndustry">Industry</Label>
                          <Input
                            id="ownerIndustry"
                            disabled={createValidating || creating}
                            value={createForm.industry}
                            onChange={(e) => setCreateForm((p) => ({ ...p, industry: e.target.value }))}
                            placeholder="Technology, Finance..."
                            className="bg-orange-50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ownerCompanySize">Company Size</Label>
                          <Input
                            id="ownerCompanySize"
                            type="number"
                            disabled={createValidating || creating}
                            value={createForm.companySize}
                            onChange={(e) => setCreateForm((p) => ({ ...p, companySize: e.target.value }))}
                            placeholder="e.g., 50"
                            min={1}
                            className="bg-orange-50"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="block mb-2">Company Logo (Optional)</Label>
                        <div className="flex items-center gap-4 p-4 border-2 border-dashed border-orange-200 rounded-lg bg-orange-50">
                          {createForm.logoFile && (
                            <div className="relative">
                              <img
                                src={URL.createObjectURL(createForm.logoFile)}
                                alt="Logo preview"
                                className="h-20 w-20 object-cover rounded border border-orange-300"
                              />
                              <button
                                type="button"
                                onClick={() => setCreateForm((p) => ({ ...p, logoFile: null }))}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          )}
                          {!createForm.logoFile && (
                            <div className="h-20 w-20 bg-orange-100 rounded flex items-center justify-center border border-orange-300">
                              <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              {createForm.logoFile ? "✓ Logo selected" : "Select your company logo"}
                            </p>
                            <p className="text-xs text-gray-500 mb-3">JPEG, PNG, WebP or SVG • Max 5MB</p>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/svg+xml"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
                                  if (!allowedTypes.includes(file.type)) {
                                    toast({ title: "Invalid file type", description: "Please upload JPEG, PNG, WebP, or SVG.", variant: "destructive" });
                                    return;
                                  }
                                  const maxSize = 5 * 1024 * 1024;
                                  if (file.size > maxSize) {
                                    toast({ title: "File too large", description: "Maximum size is 5MB.", variant: "destructive" });
                                    return;
                                  }
                                  setCreateForm((p) => ({ ...p, logoFile: file }));
                                }
                              }}
                              className="hidden"
                              id="ownerLogoInput"
                              disabled={createValidating || creating}
                            />
                            <Button
                              type="button"
                              onClick={() => document.getElementById("ownerLogoInput")?.click()}
                              disabled={createValidating || creating}
                              variant="outline"
                              size="sm"
                              className="bg-orange-600 text-white border-orange-600 hover:bg-orange-700 hover:border-orange-700"
                            >
                              {createForm.logoFile ? "Change Logo" : "Choose File"}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="ownerAddress">Address</Label>
                        <Input
                          id="ownerAddress"
                          disabled={createValidating || creating}
                          value={createForm.address}
                          onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))}
                          placeholder="Street address"
                          className="bg-orange-50"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="ownerCity">City</Label>
                          <Input
                            id="ownerCity"
                            disabled={createValidating || creating}
                            value={createForm.city}
                            onChange={(e) => setCreateForm((p) => ({ ...p, city: e.target.value }))}
                            placeholder="City"
                            className="bg-orange-50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ownerCountry">Country</Label>
                          <Input
                            id="ownerCountry"
                            disabled={createValidating || creating}
                            value={createForm.country}
                            onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value }))}
                            placeholder="Country"
                            className="bg-orange-50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ownerZipCode">ZIP Code</Label>
                          <Input
                            id="ownerZipCode"
                            disabled={createValidating || creating}
                            value={createForm.zipCode}
                            onChange={(e) => setCreateForm((p) => ({ ...p, zipCode: e.target.value }))}
                            placeholder="ZIP"
                            className="bg-orange-50"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button type="button" variant="outline" className="w-full" onClick={() => setCreateStep(1)}>
                          Back
                        </Button>
                        <Button
                          type="button"
                          className="w-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4"
                          disabled={createValidating || creating}
                          onClick={async () => {
                            if (await validateCreateStep(3)) {
                              setCreateStep(3);
                            }
                          }}
                        >
                          {createValidating ? "Validating..." : "Next"}
                        </Button>
                      </div>
                    </form>
                  )}

                  {createStep === 3 && (
                    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                      <div>
                        <Label htmlFor="ownerCompanyTagline">Company Tagline</Label>
                        <Input id="ownerCompanyTagline" disabled={creating} value={createForm.companyTagline} onChange={(e) => setCreateForm((p) => ({ ...p, companyTagline: e.target.value }))} placeholder="e.g., Scaling startups with world-class talent" className="bg-orange-50" />
                      </div>
                      <div>
                        <Label htmlFor="ownerCompanyDescription">Company Description</Label>
                        <Textarea id="ownerCompanyDescription" disabled={creating} value={createForm.companyDescription} onChange={(e) => setCreateForm((p) => ({ ...p, companyDescription: e.target.value }))} maxLength={1000} rows={4} className="bg-orange-50" placeholder="Tell us about your company, mission, and what you do..." />
                        <div className="text-xs text-gray-400 text-right">{createForm.companyDescription.length}/1000</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ownerWebsite">Website</Label>
                          <Input id="ownerWebsite" disabled={creating} value={createForm.website} onChange={(e) => setCreateForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://example.com" className="bg-orange-50" />
                        </div>
                        <div>
                          <Label htmlFor="ownerYearFounded">Year Founded</Label>
                          <Input id="ownerYearFounded" disabled={creating} value={createForm.yearFounded} onChange={(e) => setCreateForm((p) => ({ ...p, yearFounded: e.target.value }))} placeholder="2020" className="bg-orange-50" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="ownerLinkedinUrl">LinkedIn URL</Label>
                        <Input id="ownerLinkedinUrl" disabled={creating} value={createForm.linkedinUrl} onChange={(e) => setCreateForm((p) => ({ ...p, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/company/yourcompany" className="bg-orange-50" />
                      </div>
                      <div>
                        <Label htmlFor="ownerFacebookUrl">Facebook URL</Label>
                        <Input id="ownerFacebookUrl" disabled={creating} value={createForm.facebookUrl} onChange={(e) => setCreateForm((p) => ({ ...p, facebookUrl: e.target.value }))} placeholder="https://facebook.com/yourcompany" className="bg-orange-50" />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button type="button" variant="outline" className="w-full" onClick={() => setCreateStep(2)}>
                          Back
                        </Button>
                        <Button type="button" className="w-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4" onClick={() => setCreateStep(4)}>
                          Next
                        </Button>
                      </div>
                    </form>
                  )}

                  {createStep === 4 && (
                    <form
                      className="space-y-5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleCreateSubmit();
                      }}
                    >
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-blue-900">Required data is complete. Optional company profile fields can be updated later.</p>
                      </div>
                      <div className="rounded-lg border border-orange-100 bg-orange-50 p-4 space-y-2 text-sm">
                        <p><span className="font-semibold">Representative:</span> {createForm.repFirstName || "-"} {createForm.repLastName || ""}</p>
                        <p><span className="font-semibold">Email:</span> {createForm.email || "-"}</p>
                        <p><span className="font-semibold">Company:</span> {createForm.companyName || "-"}</p>
                        <p><span className="font-semibold">Industry:</span> {createForm.industry || "-"}</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button type="button" variant="outline" className="w-full" onClick={() => setCreateStep(3)}>
                          Back
                        </Button>
                        <Button type="submit" disabled={creating} className="w-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4">
                          {creating ? "Creating account..." : "Create Company Admin"}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </DialogContent>
          </Dialog>
        </div>

        <AlertDialog open={credentialsOpen} onOpenChange={setCredentialsOpen}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <AlertDialogTitle className="text-xl">Company Admin Credentials</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                {createdCredentials ? (
                  <span>
                    Save these credentials now. This is the <strong>only time</strong> the password will be shown (it’s stored hashed).
                  </span>
                ) : (
                  "Credentials are ready."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {createdCredentials ? (
              <div className="mt-2 rounded-3xl border border-orange-100 bg-orange-50/40 p-5 text-sm text-slate-700">
                <div className="grid gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</div>
                      <div className="mt-1 break-all font-semibold text-slate-900">{createdCredentials.email}</div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 rounded-full"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(createdCredentials.email);
                          toast({ title: "Copied", description: "Email copied to clipboard." });
                        } catch {
                          toast({ title: "Copy failed", description: "Could not copy email.", variant: "destructive" });
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Password</div>
                      <div className="mt-1 break-all font-mono font-semibold text-slate-900">{createdCredentials.password}</div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 rounded-full"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(createdCredentials.password);
                          toast({ title: "Copied", description: "Password copied to clipboard." });
                        } catch {
                          toast({ title: "Copy failed", description: "Could not copy password.", variant: "destructive" });
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Company</div>
                      <div className="mt-1 font-semibold text-slate-900">{createdCredentials.companyName}</div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 rounded-full"
                      onClick={async () => {
                        const text = `Company: ${createdCredentials.companyName}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
                        try {
                          await navigator.clipboard.writeText(text);
                          toast({ title: "Copied", description: "Credentials copied to clipboard." });
                        } catch {
                          toast({ title: "Copy failed", description: "Could not copy credentials.", variant: "destructive" });
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Copy all
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            <AlertDialogFooter>
              <AlertDialogAction
                className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600"
                onClick={() => {
                  setCredentialsOpen(false);
                  setCreatedCredentials(null);
                }}
              >
                Done
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {loading ? (
          <div className="rounded-[2rem] border border-orange-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-md">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Loading companies…</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
              Fetching real data from your database.
            </p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filtered.map((company) => {
              const status = getCompanyStatus(company);
              const isActive = status === "Active";
              const sub = activeSubscriptions[company.id];
              const planName = normalizePlanLabel(sub?.plan ?? null);
              const members = teamCounts[company.id] ?? 0;

              return (
                <article
                  key={company.id}
                  className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500 opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-lg font-bold text-white shadow-lg">
                        {company.logo_url ? (
                          <img
                            src={company.logo_url}
                            alt={`${company.company_name} logo`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getCompanyInitials(company.company_name)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-bold leading-tight text-slate-900">
                          {company.company_name}
                        </h2>
                        <p className="mt-0.5 truncate text-sm font-semibold text-orange-600">
                          {[company.rep_first_name, company.rep_last_name]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {company.industry || "—"}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusClasses(status)}>{status}</Badge>
                  </div>

                  <div className="mb-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-orange-600" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Admin Email
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                          {company.users?.email || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Joined
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">
                          {formatJoined(company.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Team Members
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">
                          {members} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-600" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Location
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                          {[company.city, company.country]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5 flex flex-wrap gap-2">
                    <Badge
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${planToneClass(
                        planName,
                      )}`}
                    >
                      {planName}
                    </Badge>
                    {company.industry ? (
                      <Badge className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                        {company.industry}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3 border-t border-orange-100 pt-5">
                    <Button
                      className="flex-1 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md hover:from-orange-700 hover:to-orange-600"
                      onClick={() => void openViewCompany(company)}
                    >
                      <Eye className="h-4 w-4" />
                      View Company
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                      onClick={() => openSuspendDialog(company.id, !isActive)}
                      disabled={!company.user_id}
                      aria-label={
                        isActive ? "Suspend company" : "Reactivate company"
                      }
                    >
                      {isActive ? (
                        <Ban className="h-5 w-5" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 disabled:opacity-60"
                      onClick={() => void openDeleteDialog(company)}
                      aria-label="Delete company"
                      title="Delete company (shows requirements)"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-md">
              <Search className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              No companies match these filters
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
              Try adjusting your search term, plan tier, or status filter.
            </p>
          </div>
        )}

        <Dialog
          open={viewOpen}
          onOpenChange={(open) => {
            if (!open) {
              setViewOpen(false);
              setViewEmployer(null);
              setViewTeamMembers([]);
              setViewJobsCount(null);
              setViewDetailsLoading(false);
              return;
            }
            setViewOpen(true);
          }}
        >
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Company Details</DialogTitle>
              <DialogDescription>
                Full profile from the employers table, plus team and job stats.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[70vh] overflow-y-auto pr-2">
              {viewEmployer ? (
                <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-lg font-bold text-white shadow-lg">
                      {viewEmployer.logo_url ? (
                        <img
                          src={viewEmployer.logo_url}
                          alt={`${viewEmployer.company_name} logo`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getCompanyInitials(viewEmployer.company_name)
                      )}
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-slate-900">
                        {viewEmployer.company_name}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-orange-600">
                        {[viewEmployer.city, viewEmployer.country]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {viewEmployer.tagline || viewEmployer.industry || "—"}
                      </div>
                    </div>
                  </div>

                  <Badge className={getStatusClasses(getCompanyStatus(viewEmployer))}>
                    {getCompanyStatus(viewEmployer)}
                  </Badge>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-orange-100 bg-orange-50/40 p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      About
                    </div>
                    <div className="mt-2 text-sm leading-7 text-slate-700">
                      {viewEmployer.description || "—"}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-orange-100 bg-white p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Profile
                    </div>
                    <div className="mt-3 grid gap-2 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Website</span>
                        <span className="truncate font-semibold text-slate-900">
                          {viewEmployer.website || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Company Size</span>
                        <span className="truncate font-semibold text-slate-900">
                          {viewEmployer.company_size || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Founded</span>
                        <span className="truncate font-semibold text-slate-900">
                          {viewEmployer.year_founded || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Joined</span>
                        <span className="truncate font-semibold text-slate-900">
                          {formatJoined(viewEmployer.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-3xl border border-orange-100 bg-white p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Representative
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                      {[viewEmployer.rep_first_name, viewEmployer.rep_last_name]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {viewEmployer.users?.email || "—"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {viewDetailsLoading ? "…" : viewTeamMembers[0]?.phone || "—"}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-orange-100 bg-white p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Address
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      {viewEmployer.address || "—"}
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      {[viewEmployer.city, viewEmployer.country, viewEmployer.zip_code]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-orange-100 bg-white p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Subscription
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                      {normalizePlanLabel(
                        activeSubscriptions[viewEmployer.id]?.plan ?? null,
                      )}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Jobs: {viewDetailsLoading ? "…" : viewJobsCount ?? 0}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Team: {teamCounts[viewEmployer.id] ?? 0} members
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-orange-100 bg-white p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Team Members
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {viewDetailsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                        Loading team…
                      </div>
                    ) : viewTeamMembers.length > 0 ? (
                      viewTeamMembers.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4"
                        >
                          <div className="text-sm font-semibold text-slate-900">
                            {[m.first_name, m.last_name]
                              .filter(Boolean)
                              .join(" ") || "Team Member"}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {m.users?.email || "—"}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {m.phone || "—"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-600">
                        No team members found.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-sm text-slate-600">No company selected.</div>
            )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setViewOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={confirmSuspendOpen} onOpenChange={setConfirmSuspendOpen}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg">
                  <Ban className="h-6 w-6 text-white" />
                </div>
                <AlertDialogTitle className="text-xl">
                  {confirmTarget?.nextActive ? "Reactivate" : "Suspend"} Company
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                {confirmTarget?.nextActive
                  ? "Reactivating will restore platform access for this company admin."
                  : "Suspending will block platform access for this company admin."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="rounded-full"
                onClick={() => setConfirmTarget(null)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const payload = confirmTarget;
                  setConfirmSuspendOpen(false);
                  setConfirmTarget(null);
                  if (payload) void toggleSuspend(payload.employerId, payload.nextActive);
                }}
                className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600"
              >
                {confirmTarget?.nextActive ? (
                  <CheckCircle className="mr-2 h-4 w-4" />
                ) : (
                  <Ban className="mr-2 h-4 w-4" />
                )}
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            if (!open) {
              setDeleteTarget(null);
              setDeleteCounts(null);
              setDeleteChecking(false);
              setDeleting(false);
            }
          }}
        >
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 shadow-lg">
                  <Trash2 className="h-6 w-6 text-white" />
                </div>
                <AlertDialogTitle className="text-xl">Delete Company</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                {deleteTarget ? (
                  <span>
                    This action permanently removes <strong>{deleteTarget.company_name}</strong>. Deletion is only allowed when the company is isolated (no jobs, no team members, no subscriptions).
                  </span>
                ) : (
                  "Select a company to delete."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="mt-2 rounded-3xl border border-orange-100 bg-orange-50/40 p-5 text-sm text-slate-700">
              {deleteChecking ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                  Checking relationships…
                </div>
              ) : deleteCounts ? (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Jobs</span>
                    <span className="font-semibold text-slate-900">{deleteCounts.jobs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Team members</span>
                    <span className="font-semibold text-slate-900">{deleteCounts.team}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Subscriptions</span>
                    <span className="font-semibold text-slate-900">{deleteCounts.subs}</span>
                  </div>
                  {deleteBlockers.length > 0 ? (
                    <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50/60 p-4 text-sm text-rose-800">
                      <div className="font-semibold">Why you can’t delete yet</div>
                      <ul className="mt-2 space-y-1">
                        {deleteBlockers.map((item) => (
                          <li key={item.key} className="flex items-start justify-between gap-3">
                            <span className="text-rose-700">
                              {item.label}: <span className="font-semibold">{item.count}</span>
                            </span>
                            <span className="text-rose-700/80">{item.hint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-900">
                      <div className="font-semibold">Ready to delete</div>
                      <div className="mt-1 text-emerald-800">
                        This company is isolated (no jobs, team members, or subscriptions).
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-600">—</div>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full" disabled={deleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!deleteCounts) return;
                  if (!canDeleteCompany) {
                    const parts = [
                      deleteCounts.jobs > 0 ? `${deleteCounts.jobs} job(s)` : null,
                      deleteCounts.team > 0 ? `${deleteCounts.team} team member(s)` : null,
                      deleteCounts.subs > 0 ? `${deleteCounts.subs} subscription(s)` : null,
                    ].filter(Boolean) as string[];

                    toast({
                      title: "Company can’t be deleted yet",
                      description: parts.length
                        ? `Remove linked data first: ${parts.join(", ")}.`
                        : "This company is not isolated yet.",
                    });
                    return;
                  }

                  void confirmDelete();
                }}
                disabled={deleting || deleteChecking || !deleteCounts}
                className="rounded-full bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:from-rose-700 hover:to-rose-600 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </OwnerLayout>
  );
}

