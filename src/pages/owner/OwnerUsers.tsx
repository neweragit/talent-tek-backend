import { useCallback, useEffect, useMemo, useState } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Ban,
  Briefcase,
  Calendar,
  CheckCircle,
  Eye,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Search,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

type UserStatus = "Active" | "Inactive" | "Suspended";
type StatusFilter = "all" | UserStatus;

type TalentRow = {
  id: string;
  user_id: string | null;
  full_name: string;
  phone_number: string | null;
  city: string | null;
  current_position: string | null;
  years_of_experience: string | null;
  education_level: string | null;
  skills: string[] | null;
  resume_url: string[] | null;
  created_at: string | null;
  users?: { email: string | null; is_active: boolean | null } | null;
};

type TalentProfileCounts = {
  applications: number;
  interviews: number;
  services: number;
  subscriptions: number;
};

const getStatus = (talent: TalentRow): UserStatus => {
  if (!talent.user_id) return "Inactive";
  if (talent.users?.is_active === false) return "Suspended";
  return "Active";
};

const getStatusClasses = (status: UserStatus) => {
  if (status === "Active") return "border-green-200 bg-green-50 text-green-700";
  if (status === "Suspended") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-orange-200 bg-orange-50 text-orange-700";
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatJoined = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function OwnerUsers() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [talents, setTalents] = useState<TalentRow[]>([]);
  const [globalCounts, setGlobalCounts] = useState<{ applications: number; interviews: number }>({
    applications: 0,
    interviews: 0,
  });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [confirmSuspendOpen, setConfirmSuspendOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    userId: string;
    nextActive: boolean;
    name: string;
  } | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TalentRow | null>(null);
  const [deleteChecking, setDeleteChecking] = useState(false);
  const [deleteCounts, setDeleteCounts] = useState<{ apps: number; services: number; subs: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileTalent, setProfileTalent] = useState<Record<string, any> | null>(null);
  const [profileCounts, setProfileCounts] = useState<TalentProfileCounts | null>(null);

  const loadTalents = useCallback(async () => {
    try {
      setLoading(true);

      const [talentsRes, appsCountRes, interviewsCountRes] = await Promise.all([
        supabase
          .from("talents")
          .select(
            "id,user_id,full_name,phone_number,city,current_position,years_of_experience,education_level,skills,resume_url,created_at",
          )
          .order("created_at", { ascending: false }),
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("interviews").select("id", { count: "exact", head: true }),
      ]);

      if (talentsRes.error) throw talentsRes.error;
      if (appsCountRes.error) throw appsCountRes.error;
      if (interviewsCountRes.error) throw interviewsCountRes.error;

      setGlobalCounts({
        applications: appsCountRes.count ?? 0,
        interviews: interviewsCountRes.count ?? 0,
      });

      const base = ((talentsRes.data as TalentRow[]) ?? []).map((t) => ({ ...t, users: null }));
      const userIds = Array.from(new Set(base.map((t) => t.user_id).filter(Boolean))) as string[];

      if (userIds.length > 0) {
        const usersRes = await supabase.from("users").select("id,email,is_active").in("id", userIds);
        if (usersRes.error) throw usersRes.error;

        const map = new Map<string, { email: string | null; is_active: boolean | null }>();
        (usersRes.data ?? []).forEach((u) => map.set(u.id, { email: u.email ?? null, is_active: u.is_active ?? null }));

        setTalents(base.map((t) => (t.user_id ? { ...t, users: map.get(t.user_id) ?? null } : t)));
      } else {
        setTalents(base);
      }
    } catch (err: any) {
      console.error("Owner users load failed:", err);
      toast({
        title: "Load failed",
        description: err?.message || "Unable to load talents.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadTalents();
  }, [loadTalents]);

  const kpis = useMemo(() => {
    const total = talents.length;
    const active = talents.filter((t) => getStatus(t) === "Active").length;
    const suspended = talents.filter((t) => getStatus(t) === "Suspended").length;
    return { total, active, suspended };
  }, [talents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return talents.filter((t) => {
      const status = getStatus(t);
      if (statusFilter !== "all" && status !== statusFilter) return false;

      if (!q) return true;
      const hay = [
        t.full_name,
        t.current_position ?? "",
        t.city ?? "",
        t.users?.email ?? "",
        t.skills?.join(" ") ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, statusFilter, talents]);

  const openSuspendDialog = (talent: TalentRow, nextActive: boolean) => {
    if (!talent.user_id) {
      toast({
        title: "No account linked",
        description: "This talent does not have a linked user account to suspend/reactivate.",
        variant: "destructive",
      });
      return;
    }

    setConfirmTarget({ userId: talent.user_id, nextActive, name: talent.full_name });
    setConfirmSuspendOpen(true);
  };

  const toggleSuspend = async (userId: string, nextActive: boolean) => {
    try {
      const { error } = await supabase.from("users").update({ is_active: nextActive }).eq("id", userId);
      if (error) throw error;

      toast({
        title: nextActive ? "Account reactivated" : "Account suspended",
        description: nextActive ? "Talent access has been restored." : "Talent access has been blocked.",
      });
      await loadTalents();
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err?.message || "Unable to update user status.",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = async (talent: TalentRow) => {
    setDeleteTarget(talent);
    setDeleteCounts(null);
    setDeleteOpen(true);
    setDeleteChecking(true);

    try {
      const [appsRes, servicesRes, subsRes] = await Promise.all([
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("talent_id", talent.id),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("talent_id", talent.id),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("talent_id", talent.id),
      ]);

      if (appsRes.error) throw appsRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (subsRes.error) throw subsRes.error;

      setDeleteCounts({
        apps: appsRes.count ?? 0,
        services: servicesRes.count ?? 0,
        subs: subsRes.count ?? 0,
      });
    } catch (err: any) {
      toast({
        title: "Delete check failed",
        description: err?.message || "Unable to verify relationships.",
        variant: "destructive",
      });
    } finally {
      setDeleteChecking(false);
    }
  };

  const deleteBlockers = useMemo(() => {
    if (!deleteCounts) return [];
    const items = [
      { key: "apps", label: "Applications", count: deleteCounts.apps, hint: "Remove talent applications first." },
      { key: "services", label: "Services", count: deleteCounts.services, hint: "Remove talent services first." },
      { key: "subs", label: "Subscriptions", count: deleteCounts.subs, hint: "Cancel/detach subscriptions first." },
    ] as const;
    return items.filter((i) => i.count > 0);
  }, [deleteCounts]);

  const canDelete =
    !!deleteCounts && deleteCounts.apps === 0 && deleteCounts.services === 0 && deleteCounts.subs === 0;

  const confirmDelete = async () => {
    if (!deleteTarget || !deleteCounts) return;

    if (!canDelete) {
      const parts = [
        deleteCounts.apps > 0 ? `${deleteCounts.apps} application(s)` : null,
        deleteCounts.services > 0 ? `${deleteCounts.services} service(s)` : null,
        deleteCounts.subs > 0 ? `${deleteCounts.subs} subscription(s)` : null,
      ].filter(Boolean) as string[];

      toast({
        title: "Talent can’t be deleted yet",
        description: parts.length ? `Remove linked data first: ${parts.join(", ")}.` : "This talent is not isolated yet.",
      });
      return;
    }

    try {
      setDeleting(true);

      const { error: talentError } = await supabase.from("talents").delete().eq("id", deleteTarget.id);
      if (talentError) throw talentError;

      if (deleteTarget.user_id) {
        await supabase.from("users").delete().eq("id", deleteTarget.user_id);
      }

      toast({ title: "Talent deleted", description: `${deleteTarget.full_name} has been removed.` });

      setDeleteOpen(false);
      setDeleteTarget(null);
      setDeleteCounts(null);
      await loadTalents();
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message || "Unable to delete this talent.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const openProfileDialog = async (talent: TalentRow) => {
    setProfileOpen(true);
    setProfileLoading(true);
    setProfileTalent(null);
    setProfileCounts(null);

    try {
      const talentRes = await supabase.from("talents").select("*").eq("id", talent.id).maybeSingle();
      if (talentRes.error) throw talentRes.error;

      const row = (talentRes.data ?? {}) as Record<string, any>;

      let user: { email: string | null; is_active: boolean | null } | null = null;
      if (row.user_id) {
        const userRes = await supabase.from("users").select("id,email,is_active").eq("id", row.user_id).maybeSingle();
        if (userRes.error) throw userRes.error;
        user = userRes.data ? { email: userRes.data.email ?? null, is_active: userRes.data.is_active ?? null } : null;
      }

      const [appsCountRes, servicesCountRes, subsCountRes, appIdsRes] = await Promise.all([
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("talent_id", talent.id),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("talent_id", talent.id),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("talent_id", talent.id),
        supabase.from("applications").select("id").eq("talent_id", talent.id),
      ]);

      if (appsCountRes.error) throw appsCountRes.error;
      if (servicesCountRes.error) throw servicesCountRes.error;
      if (subsCountRes.error) throw subsCountRes.error;
      if (appIdsRes.error) throw appIdsRes.error;

      const appIds = (appIdsRes.data ?? []).map((a: any) => a.id).filter(Boolean) as string[];

      let interviews = 0;
      if (appIds.length > 0) {
        const interviewsRes = await supabase
          .from("interviews")
          .select("id", { count: "exact", head: true })
          .in("application_id", appIds);
        if (interviewsRes.error) throw interviewsRes.error;
        interviews = interviewsRes.count ?? 0;
      }

      setProfileTalent({ ...row, users: user });
      setProfileCounts({
        applications: appsCountRes.count ?? 0,
        interviews,
        services: servicesCountRes.count ?? 0,
        subscriptions: subsCountRes.count ?? 0,
      });
    } catch (err: any) {
      console.error("Talent profile load failed:", err);
      toast({
        title: "Profile load failed",
        description: err?.message || "Unable to load this talent profile.",
        variant: "destructive",
      });
      setProfileOpen(false);
      setProfileTalent(null);
      setProfileCounts(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const talentFieldOrder = useMemo(
    () => [
      "id",
      "user_id",
      "full_name",
      "phone_number",
      "city",
      "current_position",
      "years_of_experience",
      "education_level",
      "job_types",
      "work_location",
      "short_bio",
      "linkedin_url",
      "github_url",
      "portfolio_url",
      "has_carte_entrepreneur",
      "skills",
      "resume_url",
      "created_at",
      "updated_at",
    ],
    [],
  );

  const toLabel = (key: string) => {
    if (key === "id") return "ID";
    if (key === "user_id") return "User ID";
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  };

  const renderValue = (key: string, value: any) => {
    if (value === null || value === undefined || value === "") return <span className="text-slate-500">—</span>;

    if (key === "resume_url" && Array.isArray(value)) {
      const urls = value as string[];
      return (
        <div className="grid gap-2">
          {urls.map((url, idx) => (
            <div key={`cv-${idx}`} className="flex items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-white px-3 py-2">
              <div className="text-sm font-semibold text-slate-900">CV {idx + 1}</div>
              {url ? (
                <a
                  className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </a>
              ) : (
                <span className="text-xs font-semibold text-slate-500">Empty</span>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-slate-500">—</span>;
      return (
        <div className="flex flex-wrap gap-2">
          {value.slice(0, 24).map((v, idx) => (
            <Badge
              key={`${key}-${idx}`}
              className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700"
            >
              {String(v)}
            </Badge>
          ))}
          {value.length > 24 ? (
            <span className="text-xs font-semibold text-slate-500">+{value.length - 24} more</span>
          ) : null}
        </div>
      );
    }

    if (typeof value === "boolean") {
      return (
        <Badge className={value ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-700"}>
          {value ? "Yes" : "No"}
        </Badge>
      );
    }

    if (typeof value === "object") return <span className="text-slate-600">{JSON.stringify(value)}</span>;

    return <span className="text-slate-900">{String(value)}</span>;
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
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">Talents</h1>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  Track talent accounts across the platform — manage status and keep data healthy.
                </p>

                <div className="mt-5">
                  <Badge className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
                    Showing {filtered.length} talents
                  </Badge>
                </div>
              </div>

              <div className="grid w-full gap-4 sm:max-w-[420px] md:grid-cols-2 lg:max-w-none lg:w-[420px] lg:min-w-[420px] xl:w-[480px] xl:min-w-[480px] shrink-0 lg:flex-none">
                {[
                  {
                    title: "Total Talents",
                    value: kpis.total,
                    detail: "Registered profiles",
                    icon: Users,
                  },
                  {
                    title: "Active Accounts",
                    value: kpis.active,
                    detail: "Currently active",
                    icon: CheckCircle,
                  },
                  {
                    title: "Suspended",
                    value: kpis.suspended,
                    detail: "Blocked access",
                    icon: Ban,
                  },
                  {
                    title: "Applications",
                    value: globalCounts.applications,
                    detail: "Total submitted",
                    icon: FileText,
                  },
                ].map((stat) => (
                  <div key={stat.title} className="rounded-3xl border border-orange-100 bg-white p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 leading-snug whitespace-normal break-normal text-balance">
                          {stat.title}
                        </p>
                        <div className="mt-2 text-3xl font-bold leading-none text-slate-900">{stat.value}</div>
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

        <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
              <Input
                placeholder="Search by name, email, skill, or position..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
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
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-orange-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-md">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Loading talents…</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
              Fetching real data from your database.
            </p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filtered.map((talent) => {
              const status = getStatus(talent);
              const isActive = status === "Active";
              const skills = (talent.skills ?? []).slice(0, 6);

              return (
                <article
                  key={talent.id}
                  className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500 opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-lg font-bold text-white shadow-lg">
                        {getInitials(talent.full_name)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-bold leading-tight text-slate-900">{talent.full_name}</h2>
                        <p className="mt-0.5 truncate text-sm font-semibold text-orange-600">
                          {talent.current_position || "—"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {talent.years_of_experience ? `${talent.years_of_experience} experience` : "—"}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusClasses(status)}>{status}</Badge>
                  </div>

                  <div className="mb-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-orange-600" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
                          {talent.users?.email || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Joined</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">{formatJoined(talent.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-600" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Location</p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{talent.city || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Role</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">Talent</p>
                      </div>
                    </div>
                  </div>

                  {skills.length > 0 ? (
                    <div className="mb-5 flex flex-wrap gap-2">
                      {skills.map((s, idx) => (
                        <Badge
                          key={`${talent.id}-skill-${idx}`}
                          className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-5 text-sm text-slate-500">No skills added yet.</div>
                  )}

                  <div className="flex items-center gap-3 border-t border-orange-100 pt-5">
                    <Button
                      className="h-12 flex-1 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-base font-semibold text-white shadow-lg hover:from-orange-700 hover:to-orange-600"
                      onClick={() => void openProfileDialog(talent)}
                      aria-label="View profile"
                      title="View full profile"
                    >
                      <Eye className="mr-2 h-5 w-5" />
                      View Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                      onClick={() => openSuspendDialog(talent, !isActive)}
                      disabled={!talent.user_id}
                      aria-label={isActive ? "Suspend talent" : "Reactivate talent"}
                      title={isActive ? "Suspend account" : "Reactivate account"}
                    >
                      {isActive ? <Ban className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                      onClick={() => void openDeleteDialog(talent)}
                      aria-label="Delete talent"
                      title="Delete talent (shows requirements)"
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
            <h2 className="text-2xl font-bold text-slate-900">No talents match these filters</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
              Try adjusting your search term or status filter.
            </p>
          </div>
        )}

        <AlertDialog
          open={confirmSuspendOpen}
          onOpenChange={(open) => {
            setConfirmSuspendOpen(open);
            if (!open) setConfirmTarget(null);
          }}
        >
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg">
                  {confirmTarget?.nextActive ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : (
                    <Ban className="h-6 w-6 text-white" />
                  )}
                </div>
                <AlertDialogTitle className="text-xl">
                  {confirmTarget?.nextActive ? "Reactivate" : "Suspend"} Talent
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                {confirmTarget?.nextActive
                  ? `Reactivating ${confirmTarget.name} will restore platform access.`
                  : `Suspending ${confirmTarget?.name} will block platform access.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full" onClick={() => setConfirmTarget(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600"
                onClick={() => {
                  const payload = confirmTarget;
                  setConfirmSuspendOpen(false);
                  setConfirmTarget(null);
                  if (payload) void toggleSuspend(payload.userId, payload.nextActive);
                }}
              >
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
                <AlertDialogTitle className="text-xl">Delete Talent</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                {deleteTarget ? (
                  <span>
                    This action permanently removes <strong>{deleteTarget.full_name}</strong>. Deletion is only allowed
                    when the talent is isolated (no applications, services, or subscriptions).
                  </span>
                ) : (
                  "Select a talent to delete."
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
                    <span className="text-slate-500">Applications</span>
                    <span className="font-semibold text-slate-900">{deleteCounts.apps}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Services</span>
                    <span className="font-semibold text-slate-900">{deleteCounts.services}</span>
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
                        This talent is isolated (no applications, services, or subscriptions).
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
                onClick={confirmDelete}
                disabled={deleting || deleteChecking || !deleteCounts}
                className="rounded-full bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:from-rose-700 hover:to-rose-600 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={profileOpen}
          onOpenChange={(open) => {
            setProfileOpen(open);
            if (!open) {
              setProfileTalent(null);
              setProfileCounts(null);
              setProfileLoading(false);
            }
          }}
        >
          <DialogContent className="max-w-3xl overflow-hidden rounded-[2rem] p-0">
            <ScrollArea className="max-h-[85vh]">
              <div className="px-8 pb-8 pt-7">
                <DialogHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-lg font-bold text-white shadow-lg">
                        {profileTalent?.full_name ? getInitials(String(profileTalent.full_name)) : "—"}
                      </div>
                      <div className="min-w-0">
                        <DialogTitle className="truncate text-2xl font-extrabold text-slate-900">
                          {profileTalent?.full_name ? String(profileTalent.full_name) : "Talent Profile"}
                        </DialogTitle>
                        <DialogDescription className="mt-1 truncate text-sm text-slate-600">
                          {profileTalent?.users?.email ?? "—"}
                        </DialogDescription>
                      </div>
                    </div>

                    {profileTalent ? (
                      <Badge
                        className={getStatusClasses(
                          !profileTalent.user_id
                            ? "Inactive"
                            : profileTalent.users?.is_active === false
                              ? "Suspended"
                              : "Active",
                        )}
                      >
                        {!profileTalent.user_id
                          ? "Inactive"
                          : profileTalent.users?.is_active === false
                            ? "Suspended"
                            : "Active"}
                      </Badge>
                    ) : null}
                  </div>
                </DialogHeader>

                <div className="mt-6 rounded-3xl border border-orange-100 bg-orange-50/40 p-5">
                  {profileLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                      Loading profile…
                    </div>
                  ) : profileCounts ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        { title: "Applications", value: profileCounts.applications, icon: FileText },
                        { title: "Interviews", value: profileCounts.interviews, icon: Calendar },
                        { title: "Services", value: profileCounts.services, icon: Briefcase },
                        { title: "Subscriptions", value: profileCounts.subscriptions, icon: CheckCircle },
                      ].map((stat) => (
                        <div key={stat.title} className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
                          <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                              <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                {stat.title}
                              </p>
                              <div className="mt-2 text-2xl font-bold leading-none text-slate-900">{stat.value}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600">—</div>
                  )}
                </div>

                <div className="mt-6">
                  <Accordion type="multiple" defaultValue={["account", "talent"]} className="w-full">
                    <AccordionItem value="account" className="rounded-3xl border border-orange-100 bg-white px-5">
                      <AccordionTrigger className="text-left text-base font-bold text-slate-900">
                        Account
                      </AccordionTrigger>
                      <AccordionContent className="pb-5">
                        <div className="grid gap-4 text-sm sm:grid-cols-2">
                          <div className="rounded-2xl border border-orange-100 bg-orange-50/30 p-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Email
                            </div>
                            <div className="mt-1 font-semibold text-slate-900">{profileTalent?.users?.email ?? "—"}</div>
                          </div>
                          <div className="rounded-2xl border border-orange-100 bg-orange-50/30 p-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Active
                            </div>
                            <div className="mt-1">
                              {profileTalent?.users?.is_active === null || profileTalent?.users?.is_active === undefined ? (
                                <span className="text-slate-500">—</span>
                              ) : (
                                <Badge
                                  className={
                                    profileTalent.users.is_active
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-amber-200 bg-amber-50 text-amber-700"
                                  }
                                >
                                  {profileTalent.users.is_active ? "Active" : "Suspended"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="talent" className="mt-4 rounded-3xl border border-orange-100 bg-white px-5">
                      <AccordionTrigger className="text-left text-base font-bold text-slate-900">
                        Talent Table (all columns)
                      </AccordionTrigger>
                      <AccordionContent className="pb-5">
                        <div className="grid gap-4">
                          {(() => {
                            const row = profileTalent ?? {};
                            const keys = Object.keys(row).filter((k) => k !== "users");
                            const ordered = talentFieldOrder.filter((k) => keys.includes(k));
                            const extras = keys.filter((k) => !talentFieldOrder.includes(k)).sort();
                            const all = [...ordered, ...extras];
                            return all.map((key) => (
                              <div
                                key={key}
                                className="rounded-2xl border border-orange-100 bg-orange-50/30 p-4"
                              >
                                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  {toLabel(key)}
                                </div>
                                <div className="mt-2 text-sm">{renderValue(key, (row as any)[key])}</div>
                              </div>
                            ));
                          })()}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                <Separator className="my-6" />

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="rounded-full border-orange-200 bg-white text-orange-700 hover:bg-orange-50"
                    onClick={() => setProfileOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  );
}
