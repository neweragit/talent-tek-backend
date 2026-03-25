import { useState, useMemo } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Building2, Users, BadgeCheck, TrendingUp, Eye, Trash2, AlertTriangle, Ban, CheckCircle, Mail, Calendar, MapPin, Sparkles } from "lucide-react";

type CompanyPlan = "Starter" | "Professional" | "Growth" | "Enterprise";
type CompanyStatus = "Active" | "Inactive" | "Suspended";

interface CompanyAdmin {
  id: number;
  company: string;
  adminName: string;
  email: string;
  plan: CompanyPlan;
  members: number;
  joinDate: string;
  location: string;
  status: CompanyStatus;
  industry: string;
}

const mockCompanies: CompanyAdmin[] = [
  { id: 1, company: "BlueGrid Technologies", adminName: "Yacine Belkacem", email: "yacine@bluegrid.io", plan: "Enterprise", members: 42, joinDate: "Jan 8, 2024", location: "Dubai, UAE", status: "Active", industry: "Cloud Infrastructure" },
  { id: 2, company: "NexaLogistics", adminName: "Amira Ouedraogo", email: "a.ouedraogo@nexalogistics.com", plan: "Growth", members: 27, joinDate: "Jan 22, 2024", location: "Nairobi, Kenya", status: "Active", industry: "Logistics & Supply Chain" },
  { id: 3, company: "FinEdge Capital", adminName: "Tarek Mansour", email: "tarek.m@finedge.co", plan: "Professional", members: 18, joinDate: "Feb 5, 2024", location: "Cairo, Egypt", status: "Active", industry: "FinTech" },
  { id: 4, company: "DesignLabs Africa", adminName: "Chidinma Eze", email: "c.eze@designlabsafrica.com", plan: "Starter", members: 9, joinDate: "Feb 19, 2024", location: "Lagos, Nigeria", status: "Inactive", industry: "Creative & Design" },
  { id: 5, company: "OmniRetail Group", adminName: "Hamza El Fassi", email: "h.elfassi@omniretail.ma", plan: "Growth", members: 31, joinDate: "Mar 1, 2024", location: "Casablanca, Morocco", status: "Active", industry: "E-Commerce & Retail" },
  { id: 6, company: "AgroVentures SA", adminName: "Sylvie Mendes", email: "s.mendes@agroventures.co.za", plan: "Professional", members: 14, joinDate: "Mar 14, 2024", location: "Cape Town, SA", status: "Active", industry: "AgriTech" },
  { id: 7, company: "HealthBridge", adminName: "Omar Diarra", email: "omar@healthbridge.sn", plan: "Starter", members: 6, joinDate: "Mar 28, 2024", location: "Dakar, Senegal", status: "Active", industry: "HealthTech" },
  { id: 8, company: "DataSphere Analytics", adminName: "Nour El Hoda", email: "nour@datasphere.tn", plan: "Enterprise", members: 38, joinDate: "Apr 4, 2024", location: "Tunis, Tunisia", status: "Suspended", industry: "Data Analytics" },
  { id: 9, company: "EduReach Platform", adminName: "Kweku Acheampong", email: "k.acheampong@edureach.gh", plan: "Growth", members: 23, joinDate: "Apr 10, 2024", location: "Accra, Ghana", status: "Active", industry: "EdTech" },
  { id: 10, company: "SecureVault Systems", adminName: "Imen Chaabane", email: "imen@securevault.io", plan: "Professional", members: 12, joinDate: "Apr 18, 2024", location: "Tunis, Tunisia", status: "Active", industry: "Cybersecurity" },
];

const planOptions = [
  { value: "all", label: "All Plans" },
  { value: "Starter", label: "Starter" },
  { value: "Professional", label: "Professional" },
  { value: "Growth", label: "Growth" },
  { value: "Enterprise", label: "Enterprise" },
];

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Suspended", label: "Suspended" },
];

const getPlanClasses = (plan: CompanyPlan) => {
  if (plan === "Enterprise") return "border-purple-200 bg-purple-50 text-purple-700";
  if (plan === "Growth") return "border-blue-200 bg-blue-50 text-blue-700";
  if (plan === "Professional") return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
};

const getStatusClasses = (status: CompanyStatus) => {
  if (status === "Active") return "border-green-200 bg-green-50 text-green-700";
  if (status === "Suspended") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-orange-200 bg-orange-50 text-orange-700";
};

const getCompanyInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export default function OwnerCompanyAdmins() {
  const [companies, setCompanies] = useState<CompanyAdmin[]>(mockCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<number | null>(null);
  const [companyToToggle, setCompanyToToggle] = useState<number | null>(null);

  const stats = useMemo(() => {
    const activeCount = companies.filter((c) => c.status === "Active").length;
    const totalMembers = companies.reduce((sum, c) => sum + c.members, 0);
    const premiumCount = companies.filter((c) => c.plan === "Enterprise" || c.plan === "Growth").length;
    const avgMembers = Math.round(totalMembers / companies.length);
    return [
      { label: "Total Companies", value: companies.length, detail: "Registered organizations", icon: Building2 },
      { label: "Active Accounts", value: activeCount, detail: "Currently subscribed", icon: BadgeCheck },
      { label: "Premium Plans", value: premiumCount, detail: "Growth or Enterprise tier", icon: TrendingUp },
      { label: "Avg Team Size", value: avgMembers, detail: "Members per company", icon: Users },
    ];
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch =
        c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlan = planFilter === "all" || c.plan === planFilter;
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [companies, searchQuery, planFilter, statusFilter]);

  const resultsLabel =
    filteredCompanies.length === companies.length
      ? `Showing all ${companies.length} company admins`
      : `Showing ${filteredCompanies.length} of ${companies.length} company admins`;

  function handleDelete(id: number) {
    setCompanyToDelete(id);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (companyToDelete) {
      setCompanies(companies.filter((c) => c.id !== companyToDelete));
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  }

  function handleToggleStatus(id: number) {
    setCompanyToToggle(id);
    setSuspendDialogOpen(true);
  }

  function confirmToggleStatus() {
    if (companyToToggle) {
      setCompanies(companies.map((c) =>
        c.id === companyToToggle
          ? { ...c, status: c.status === "Active" ? "Suspended" : "Active" }
          : c
      ));
      setSuspendDialogOpen(false);
      setCompanyToToggle(null);
    }
  }

  const targetCompany = companies.find((c) => c.id === (companyToToggle ?? companyToDelete));

  return (
    <OwnerLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">

        {/* Hero Section */}
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(253,186,116,0.14),_transparent_32%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_58%,_#fff1e6_100%)] p-6 shadow-xl sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Owner Portal
              </div>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Company Admins
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Manage every subscribing organization on TalenTek — review plan tiers, team sizes, and account health in one unified panel.
              </p>
              <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                {resultsLabel}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg backdrop-blur-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
                  <div className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</div>
                  <p className="mt-1 text-sm text-slate-600">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Controls */}
        <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
              <Input
                placeholder="Search by company, admin name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              {planOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Company Cards */}
        {filteredCompanies.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredCompanies.map((company) => (
              <article
                key={company.id}
                className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-lg font-bold text-white shadow-lg">
                      {getCompanyInitials(company.company)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold leading-tight text-slate-900">{company.company}</h2>
                      <p className="mt-0.5 text-sm font-semibold text-orange-600">{company.adminName}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{company.industry}</p>
                    </div>
                  </div>
                  <Badge className={getStatusClasses(company.status)}>{company.status}</Badge>
                </div>

                <div className="mb-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Admin Email</p>
                      <p className="mt-0.5 break-all text-sm font-semibold text-slate-900">{company.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Joined</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">{company.joinDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Team Members</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">{company.members} members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Location</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">{company.location}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                  <Badge className={getPlanClasses(company.plan)}>{company.plan} Plan</Badge>
                  <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{company.industry}</Badge>
                </div>

                <div className="flex items-center gap-3 border-t border-orange-100 pt-5">
                  <Button className="flex-1 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-md">
                    <Eye className="h-4 w-4" />
                    View Company
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={() => handleToggleStatus(company.id)}
                  >
                    {company.status === "Active" ? <Ban className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={() => handleDelete(company.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-md">
              <Search className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">No companies match these filters</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
              Try adjusting your search term, plan tier, or status filter.
            </p>
          </div>
        )}

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <AlertDialogTitle className="text-xl">Remove Company</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                Are you sure you want to permanently remove <strong>{targetCompany?.company}</strong>? All associated data will be deleted and cannot be recovered.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Suspend / Reactivate Dialog */}
        <AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <AlertDialogTitle className="text-xl">
                  {targetCompany?.status === "Active" ? "Suspend" : "Reactivate"} Company
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                {targetCompany?.status === "Active"
                  ? `Suspending ${targetCompany?.company} will block all platform access for their team.`
                  : `Reactivating ${targetCompany?.company} will restore platform access for all team members.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmToggleStatus} className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white">
                {targetCompany?.status === "Active" ? "Suspend" : "Reactivate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </OwnerLayout>
  );
}
