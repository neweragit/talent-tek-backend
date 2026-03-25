import { useState, useMemo } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Search,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  Briefcase,
  Package,
  Sparkles,
  Settings,
  UserPlus,
  Zap,
} from "lucide-react";

type SubStatus = "active" | "cancelled" | "past_due";
type SubType = "Employer" | "Talent";

type PlanOption = {
  value: string;
  label: string;
  price: string;
};

interface Subscription {
  id: string;
  name: string;
  email: string;
  type: SubType;
  plan: string;
  price: string;
  startDate: string;
  nextBilling: string;
  status: SubStatus;
  totalPaid: string;
}

const mockSubscriptions: Subscription[] = [
  { id: "112fc9e9-913d-4d30-8f87-b75419a4672b", name: "Idk", email: "abderraoufahmedabla@gmail.com", type: "Employer", plan: "Starter", price: "99 DZD", startDate: "2026-03-05", nextBilling: "2026-04-05", status: "active", totalPaid: "99 DZD" },
  { id: "f174020d-670d-41a7-8971-5e460ce2d51a", name: "seal", email: "seal@seal.com", type: "Employer", plan: "Free", price: "0 DZD", startDate: "2026-03-03", nextBilling: "2026-04-03", status: "active", totalPaid: "0 DZD" },
  { id: "b9334f59-ad37-4b51-8e66-7bfcc807e976", name: "skyoilot", email: "skyoilot@gmail.com", type: "Employer", plan: "Free", price: "0 DZD", startDate: "2026-01-28", nextBilling: "2026-02-28", status: "active", totalPaid: "0 DZD" },
  { id: "7f76a977-50cb-4d48-8296-28f07197e0d7", name: "ablaabla@ablaabla.com", email: "ablaabla@ablaabla.com", type: "Employer", plan: "Free", price: "0 DZD", startDate: "2026-01-28", nextBilling: "2026-02-28", status: "active", totalPaid: "0 DZD" },
  { id: "fff90bec-f3e8-4ad4-9064-c9f6d37e9492", name: "mineminemine@mine.com", email: "mineminemine@mine.com", type: "Employer", plan: "Free", price: "0 DZD", startDate: "2026-01-28", nextBilling: "2026-02-28", status: "active", totalPaid: "0 DZD" },
];

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "cancelled", label: "Cancelled" },
  { value: "past_due", label: "Past Due" },
];

const planOptions: PlanOption[] = [
  { value: "Free", label: "Free", price: "0 DZD" },
  { value: "Starter", label: "Starter", price: "99 DZD" },
  { value: "Professional", label: "Professional", price: "299 DZD" },
  { value: "Growth", label: "Growth", price: "599 DZD" },
  { value: "Enterprise", label: "Enterprise", price: "999 DZD" },
];

const getStatusClasses = (status: SubStatus) => {
  if (status === "active") return "border-green-200 bg-green-50 text-green-700";
  if (status === "cancelled") return "border-slate-200 bg-slate-50 text-slate-600";
  return "border-amber-200 bg-amber-50 text-amber-700";
};

const getStatusLabel = (status: SubStatus) => {
  if (status === "active") return "Active";
  if (status === "cancelled") return "Cancelled";
  return "Past Due";
};

const getStatusIcon = (status: SubStatus) => {
  if (status === "active") return CheckCircle;
  if (status === "cancelled") return XCircle;
  return AlertCircle;
};

const getPlanClasses = (plan: string) => {
  if (plan === "Enterprise") return "border-purple-200 bg-purple-50 text-purple-700";
  if (plan === "Growth" || plan === "Professional") return "border-blue-200 bg-blue-50 text-blue-700";
  if (plan === "Starter" || plan === "Premium") return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
};

const getInitials = (name: string) =>
  name.split(/[\s@.]/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export default function OwnerSubscriptions() {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(mockSubscriptions);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"employers" | "talents">("employers");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [newSubscriber, setNewSubscriber] = useState({
    accountId: "",
    accountName: "",
    accountEmail: "",
    type: "Employer" as SubType,
    plan: "Starter",
  });

  const summaryStats = useMemo(() => {
    const totalRevenueDZD = subscriptions.reduce((sum, s) => {
      const num = parseInt(s.totalPaid.replace(/[^0-9]/g, ""), 10) || 0;
      return sum + num;
    }, 0);
    const activeEmployers = subscriptions.filter((s) => s.type === "Employer" && s.status === "active").length;
    const activeTalents = subscriptions.filter((s) => s.type === "Talent" && s.status === "active").length;
    return [
      { label: "Total Revenue", value: `${totalRevenueDZD.toLocaleString()} DZD`, detail: "All-time collected revenue", icon: DollarSign },
      { label: "Monthly Revenue", value: "0 DZD", detail: "Current billing cycle", icon: TrendingUp },
      { label: "Active Employers", value: activeEmployers, detail: "Paying organizations", icon: Building2 },
      { label: "Active Talents", value: activeTalents, detail: "Subscribed candidates", icon: Briefcase },
    ];
  }, [subscriptions]);

  const totalCount = subscriptions.length;
  const employerCount = subscriptions.filter((s) => s.type === "Employer").length;
  const talentCount = subscriptions.filter((s) => s.type === "Talent").length;

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      const matchesTab = activeTab === "employers" ? s.type === "Employer" : s.type === "Talent";
      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [subscriptions, searchQuery, statusFilter, activeTab]);

  const resultsLabel =
    filteredSubscriptions.length === subscriptions.length
      ? `Showing all ${totalCount} subscriptions — ${employerCount} Employers, ${talentCount} Talents`
      : `Showing ${filteredSubscriptions.length} of ${totalCount} subscriptions`;

  function handleCancel(sub: Subscription) {
    setSelectedSub(sub);
    setCancelDialogOpen(true);
  }

  function confirmCancel() {
    toast({
      title: "Subscription Cancelled",
      description: `${selectedSub?.name}'s subscription has been cancelled.`,
    });
    setCancelDialogOpen(false);
    setSelectedSub(null);
  }

  function handleExport() {
    toast({
      title: "Export Initiated",
      description: "PDF report sent to your owner inbox via SlickPay reporting API.",
    });
  }

  function handleAddSubscriber() {
    const accountId = newSubscriber.accountId.trim();
    const accountName = newSubscriber.accountName.trim();

    if (!accountId || !accountName) {
      toast({
        title: "Missing information",
        description: "Please enter both company/account ID and account name.",
      });
      return;
    }

    const alreadyExists = subscriptions.some((subscription) => subscription.id.toLowerCase() === accountId.toLowerCase());
    if (alreadyExists) {
      toast({
        title: "Account already exists",
        description: "A subscriber with this account ID already exists.",
      });
      return;
    }

    const selectedPlan = planOptions.find((plan) => plan.value === newSubscriber.plan);
    const planPrice = selectedPlan?.price ?? "0 DZD";
    const today = new Date();
    const nextBillingDate = new Date(today);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const fallbackEmail = `${accountName.toLowerCase().replace(/[^a-z0-9]/g, "")}@account.local`;

    const createdSubscription: Subscription = {
      id: accountId,
      name: accountName,
      email: newSubscriber.accountEmail.trim() || fallbackEmail,
      type: newSubscriber.type,
      plan: newSubscriber.plan,
      price: planPrice,
      startDate: today.toISOString().split("T")[0],
      nextBilling: nextBillingDate.toISOString().split("T")[0],
      status: "active",
      totalPaid: planPrice,
    };

    setSubscriptions((previous) => [createdSubscription, ...previous]);
    setAddDialogOpen(false);
    setNewSubscriber({
      accountId: "",
      accountName: "",
      accountEmail: "",
      type: "Employer",
      plan: "Starter",
    });

    toast({
      title: "Subscriber added",
      description: `${accountName} has been added on the ${newSubscriber.plan} plan.`,
    });
  }

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
                Subscriptions Management
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Manage subscription plans and subscribers across every employer and talent account. Payments processed securely via <span className="font-bold text-orange-600">SlickPay</span>.
              </p>

              {/* SlickPay badge */}
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                <Zap className="h-4 w-4 text-orange-500" />
                Powered by <span className="text-orange-600 font-bold ml-1">SlickPay</span>
              </div>

              <div className="mt-4 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm ml-3">
                {resultsLabel}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-md">
                  <Settings className="h-4 w-4" />
                  Manage Plans
                </Button>
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  className="gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md hover:from-orange-700 hover:to-orange-600"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Subscriber
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {summaryStats.map((stat) => (
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

        {/* Total Subscriptions callout */}
        <div className="mb-6 overflow-hidden rounded-[2rem] border border-orange-100 bg-white p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Total Subscriptions</p>
                <p className="mt-1 text-4xl font-bold text-slate-900">{totalCount}</p>
                <p className="mt-0.5 text-sm font-semibold text-orange-600">{employerCount} Employers, {talentCount} Talents</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-orange-50/60 px-5 py-3 text-sm font-semibold text-slate-700">
              <Users className="h-4 w-4 text-orange-500" />
              All subscriber activity is synced with SlickPay billing cycles
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_180px]">
          <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
              <Input
                placeholder="Search by company or talent name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleExport}
            className="h-full min-h-14 gap-2 rounded-3xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-lg"
          >
            <Download className="h-4 w-4" />
            Export to PDF
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("employers")}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "employers"
                ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                : "border border-orange-200 bg-white text-slate-700 hover:bg-orange-50"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Employers
            <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === "employers" ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"}`}>
              {employerCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("talents")}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "talents"
                ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                : "border border-orange-200 bg-white text-slate-700 hover:bg-orange-50"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Talents
            <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === "talents" ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"}`}>
              {talentCount}
            </span>
          </button>
        </div>

        {/* Tab heading */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            {activeTab === "employers" ? "Employer Subscriptions" : "Talent Subscriptions"}
          </h2>
        </div>

        {/* Subscription Cards */}
        {filteredSubscriptions.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredSubscriptions.map((sub) => {
              const StatusIcon = getStatusIcon(sub.status);
              return (
                <article
                  key={sub.id}
                  className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-lg font-bold text-white shadow-lg">
                        {getInitials(sub.name)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold leading-tight text-slate-900">{sub.name}</h3>
                        <p className="mt-0.5 text-sm font-semibold text-orange-600">{sub.email}</p>
                        <p className="mt-0.5 text-xs font-mono text-slate-400 break-all">{sub.id}</p>
                      </div>
                    </div>
                    <Badge className={getStatusClasses(sub.status)}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {getStatusLabel(sub.status)}
                    </Badge>
                  </div>

                  <div className="mb-5 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Plan</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">{sub.plan}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Price</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">{sub.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Next Billing</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">{sub.nextBilling}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total Paid</p>
                        <p className="mt-0.5 text-sm font-semibold text-green-600">{sub.totalPaid}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-5 flex flex-wrap gap-2">
                    <Badge className={getPlanClasses(sub.plan)}>{sub.plan}</Badge>
                    <Badge className="border border-orange-200 bg-orange-50 text-orange-700">
                      {sub.type === "Employer" ? <Building2 className="mr-1 h-3 w-3 inline" /> : <Briefcase className="mr-1 h-3 w-3 inline" />}
                      {sub.type}
                    </Badge>
                    <Badge className="border border-slate-200 bg-slate-50 text-slate-600 font-mono text-xs">
                      <Zap className="mr-1 h-3 w-3 inline text-orange-500" />SlickPay
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 border-t border-orange-100 pt-5">
                    <Button className="flex-1 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-md">
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                    {sub.status === "active" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        onClick={() => handleCancel(sub)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
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
            <h2 className="text-2xl font-bold text-slate-900">No subscriptions match these filters</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
              Try a different name, status, or switch between the Employers / Talents tabs.
            </p>
          </div>
        )}

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="rounded-3xl border-orange-100 sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">Add Subscriber</DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                Manually add a subscriber using company/account ID, account name, and subscription plan.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Company / Account ID</p>
                <Input
                  value={newSubscriber.accountId}
                  onChange={(event) => setNewSubscriber((previous) => ({ ...previous, accountId: event.target.value }))}
                  placeholder="e.g. 112fc9e9-913d-4d30-8f87-b75419a4672b"
                  className="rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Account Name / Company Name</p>
                <Input
                  value={newSubscriber.accountName}
                  onChange={(event) => setNewSubscriber((previous) => ({ ...previous, accountName: event.target.value }))}
                  placeholder="e.g. Nexa Logistics"
                  className="rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Account Email (optional)</p>
                <Input
                  value={newSubscriber.accountEmail}
                  onChange={(event) => setNewSubscriber((previous) => ({ ...previous, accountEmail: event.target.value }))}
                  placeholder="e.g. billing@company.com"
                  className="rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Subscriber Type</p>
                  <Select value={newSubscriber.type} onValueChange={(value) => setNewSubscriber((previous) => ({ ...previous, type: value as SubType }))}>
                    <SelectTrigger className="rounded-xl border-orange-200 px-3 focus:border-orange-400 focus:ring-orange-400">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employer">Employer</SelectItem>
                      <SelectItem value="Talent">Talent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Subscription Plan</p>
                  <Select value={newSubscriber.plan} onValueChange={(value) => setNewSubscriber((previous) => ({ ...previous, plan: value }))}>
                    <SelectTrigger className="rounded-xl border-orange-200 px-3 focus:border-orange-400 focus:ring-orange-400">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {planOptions.map((plan) => (
                        <SelectItem key={plan.value} value={plan.value}>
                          {plan.label} ({plan.price})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                onClick={() => setAddDialogOpen(false)}
                className="rounded-full bg-orange-500 text-white hover:bg-orange-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSubscriber}
                className="rounded-full bg-orange-600 text-white hover:bg-orange-700"
              >
                Add Subscriber
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg">
                  <Trash2 className="h-6 w-6 text-white" />
                </div>
                <AlertDialogTitle className="text-xl">Cancel Subscription</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                Are you sure you want to cancel <strong>{selectedSub?.name}</strong>'s subscription? They will lose access at the end of their current SlickPay billing period.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Keep Active</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCancel} className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white">
                Cancel Subscription
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </OwnerLayout>
  );
}
