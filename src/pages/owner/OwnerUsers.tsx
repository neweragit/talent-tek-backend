import { useState, useMemo } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Eye, Trash2, AlertTriangle, Users, Ban, CheckCircle, Mail, Calendar, Building2, Briefcase, UserCog, Sparkles } from "lucide-react";

type UserRole = "Talent" | "Interviewer" | "Company Admin";
type UserStatus = "Active" | "Inactive" | "Suspended";

interface PlatformUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinDate: string;
  location: string;
  detail: string;
}

const mockUsers: PlatformUser[] = [
  { id: 1, name: "Amara Diallo", email: "amara.diallo@gmail.com", role: "Talent", status: "Active", joinDate: "Jan 15, 2024", location: "Lagos, Nigeria", detail: "Full-Stack Engineer · React, Node.js, TypeScript" },
  { id: 2, name: "Youssef El Amine", email: "y.elamine@outlook.com", role: "Talent", status: "Active", joinDate: "Feb 3, 2024", location: "Casablanca, Morocco", detail: "Product Manager · SaaS, B2B, Roadmapping" },
  { id: 3, name: "Fatima Nkosi", email: "fatimanko@proton.me", role: "Talent", status: "Active", joinDate: "Feb 18, 2024", location: "Johannesburg, SA", detail: "Data Scientist · Python, ML, TensorFlow" },
  { id: 4, name: "Obed Kwame", email: "obed.kwame@yahoo.com", role: "Talent", status: "Inactive", joinDate: "Mar 2, 2024", location: "Accra, Ghana", detail: "UX Designer · Figma, Design Systems, Research" },
  { id: 5, name: "Lina Hajji", email: "lina.hajji@gmail.com", role: "Talent", status: "Active", joinDate: "Mar 22, 2024", location: "Tunis, Tunisia", detail: "DevOps Engineer · AWS, Kubernetes, CI/CD" },
  { id: 6, name: "Chidi Okonkwo", email: "chidi.ok@gmail.com", role: "Talent", status: "Active", joinDate: "Apr 8, 2024", location: "Abuja, Nigeria", detail: "Backend Engineer · Go, PostgreSQL, Microservices" },
  { id: 7, name: "Dr. Ines Bouaziz", email: "ines.bouaziz@expert.io", role: "Interviewer", status: "Active", joinDate: "Jan 20, 2024", location: "Paris, France", detail: "Senior Engineering Assessment · 4.9★ · 86 interviews" },
  { id: 8, name: "Moussa Traoré", email: "m.traore@assess.co", role: "Interviewer", status: "Active", joinDate: "Feb 10, 2024", location: "Dakar, Senegal", detail: "Product & Strategy · 4.8★ · 62 interviews" },
  { id: 9, name: "Nadia Hassan", email: "nadia.h@interviews.io", role: "Interviewer", status: "Active", joinDate: "Feb 28, 2024", location: "Cairo, Egypt", detail: "Data & Analytics Track · 4.7★ · 48 interviews" },
  { id: 10, name: "Kofi Asante", email: "kofi.asante@verifyme.io", role: "Interviewer", status: "Suspended", joinDate: "Mar 14, 2024", location: "Kumasi, Ghana", detail: "UX & Design · 4.5★ · 31 interviews" },
  { id: 11, name: "Sara Benyahia", email: "sara.ben@talent.expert", role: "Interviewer", status: "Active", joinDate: "Apr 1, 2024", location: "Algiers, Algeria", detail: "Cloud & Infrastructure · 4.9★ · 74 interviews" },
  { id: 12, name: "TechVentures Ltd", email: "admin@techventures.io", role: "Company Admin", status: "Active", joinDate: "Jan 12, 2024", location: "Dubai, UAE", detail: "Growth Plan · 24 team members" },
  { id: 13, name: "NexaLogistics", email: "hr@nexalogistics.com", role: "Company Admin", status: "Inactive", joinDate: "Feb 7, 2024", location: "Nairobi, Kenya", detail: "Starter Plan · 8 team members" },
];

const roleOptions = [
  { value: "all", label: "All Roles" },
  { value: "Talent", label: "Talents" },
  { value: "Interviewer", label: "Interviewers" },
  { value: "Company Admin", label: "Company Admins" },
];

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Suspended", label: "Suspended" },
];

const getRoleIcon = (role: UserRole) => {
  if (role === "Talent") return <Briefcase className="h-4 w-4 text-orange-600" />;
  if (role === "Interviewer") return <UserCog className="h-4 w-4 text-orange-600" />;
  return <Building2 className="h-4 w-4 text-orange-600" />;
};

const getStatusClasses = (status: UserStatus) => {
  if (status === "Active") return "border-green-200 bg-green-50 text-green-700";
  if (status === "Suspended") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-orange-200 bg-orange-50 text-orange-700";
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

export default function OwnerUsers() {
  const [users, setUsers] = useState<PlatformUser[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<number | null>(null);

  const userStats = useMemo(() => {
    const activeCount = users.filter((u) => u.status === "Active").length;
    const talentCount = users.filter((u) => u.role === "Talent").length;
    const interviewerCount = users.filter((u) => u.role === "Interviewer").length;
    return [
      { label: "Total Users", value: users.length, detail: "All platform accounts", icon: Users },
      { label: "Active", value: activeCount, detail: "Currently active", icon: CheckCircle },
      { label: "Talents", value: talentCount, detail: "Job seekers on platform", icon: Briefcase },
      { label: "Interviewers", value: interviewerCount, detail: "Verified assessors", icon: UserCog },
    ];
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const resultsLabel =
    filteredUsers.length === users.length
      ? `Showing all ${users.length} users`
      : `Showing ${filteredUsers.length} of ${users.length} users`;

  function handleDeleteUser(id: number) {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (userToDelete) {
      setUsers(users.filter((u) => u.id !== userToDelete));
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  }

  function handleToggleStatus(id: number) {
    setUserToDeactivate(id);
    setDeactivateDialogOpen(true);
  }

  function confirmToggleStatus() {
    if (userToDeactivate) {
      setUsers(users.map((u) =>
        u.id === userToDeactivate
          ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" }
          : u
      ));
      setDeactivateDialogOpen(false);
      setUserToDeactivate(null);
    }
  }

  const targetUser = users.find((u) => u.id === (userToDeactivate ?? userToDelete));

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
                User Management
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Oversee every account on the TalenTek platform — talents building careers, expert interviewers, and company admins — all from one command view.
              </p>
              <div className="mt-6 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                {resultsLabel}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {userStats.map((stat) => (
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
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-full min-h-14 rounded-3xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-lg">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((opt) => (
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

        {/* User List */}
        {filteredUsers.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredUsers.map((user) => (
              <article
                key={user.id}
                className="group relative overflow-hidden rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-700 via-orange-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-lg font-bold text-white shadow-lg">
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold leading-tight text-slate-900">{user.name}</h2>
                      <p className="mt-0.5 text-sm font-semibold text-orange-600">{user.role}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{user.location}</p>
                    </div>
                  </div>
                  <Badge className={getStatusClasses(user.status)}>{user.status}</Badge>
                </div>

                <p className="mb-5 text-sm leading-6 text-gray-600">{user.detail}</p>

                <div className="mb-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</p>
                      <p className="mt-0.5 break-all text-sm font-semibold text-slate-900">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Joined</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">{user.joinDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role)}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Role</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">{user.role}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                  <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{user.role}</Badge>
                  <Badge className="border border-orange-200 bg-orange-50 text-orange-700">{user.location}</Badge>
                </div>

                <div className="flex items-center gap-3 border-t border-orange-100 pt-5">
                  <Button className="flex-1 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-md">
                    <Eye className="h-4 w-4" />
                    View Profile
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={() => handleToggleStatus(user.id)}
                  >
                    {user.status === "Active" ? <Ban className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={() => handleDeleteUser(user.id)}
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
            <h2 className="text-2xl font-bold text-slate-900">No users match these filters</h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
              Try adjusting your search term, role, or status filter.
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
                <AlertDialogTitle className="text-xl">Delete User</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                Are you sure you want to permanently delete <strong>{targetUser?.name}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Toggle Status Dialog */}
        <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <AlertDialogTitle className="text-xl">
                  {targetUser?.status === "Active" ? "Deactivate" : "Activate"} User
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                {targetUser?.status === "Active"
                  ? `Deactivating ${targetUser?.name} will prevent them from accessing the platform.`
                  : `Reactivating ${targetUser?.name} will restore their platform access.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmToggleStatus} className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white">
                {targetUser?.status === "Active" ? "Deactivate" : "Activate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </OwnerLayout>
  );
}
