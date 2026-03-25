import { useEffect, useMemo, useState } from "react";
import RecruiterAdminLayout from "@/components/layouts/RecruiterAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { UserPlus, Mail, Edit, Trash2, Search, CheckCircle, XCircle, Users, Calendar, Sparkles, Loader } from "lucide-react";
import bcrypt from "bcryptjs";

type UserStatus = "active" | "inactive";

interface CompanyUser {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  phone: string;
  joinDate: string;
  status: UserStatus;
}

const toDisplayRole = (role: string) => {
  if (!role) return "Recruiter";
  return role
    .split("-")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function EmployerAdminUsers() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [pendingDeactivateUser, setPendingDeactivateUser] = useState<CompanyUser | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<CompanyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [employerId, setEmployerId] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  });

  const loadUsers = async () => {
    try {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const { data: employer, error: employerError } = await supabase
        .from("employers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (employerError || !employer?.id) {
        throw employerError || new Error("Employer not found");
      }

      setEmployerId(employer.id);

      const { data: teamMembers, error: membersError } = await supabase
        .from("employer_team_members")
        .select("id,user_id,joined_at,created_at,first_name,last_name,phone")
        .eq("employer_id", employer.id);

      if (membersError) throw membersError;

      const userIds = Array.from(new Set((teamMembers || []).map((member: any) => member.user_id).filter(Boolean)));

      let userDataMap = new Map<string, { email: string; user_role: string; is_active: boolean }>();

      if (userIds.length > 0) {
        const { data: userRows, error: userRowsError } = await supabase
          .from("users")
          .select("id,email,user_role,is_active")
          .in("id", userIds);

        if (userRowsError) throw userRowsError;
        userDataMap = new Map((userRows || []).map((account: any) => [account.id, { email: account.email || "", user_role: account.user_role || "recruiter", is_active: account.is_active ?? true }]));

      }

      const mappedUsers: CompanyUser[] = (teamMembers || []).map((member: any) => {
        const userData = userDataMap.get(member.user_id) || { email: "", user_role: "recruiter", is_active: true };

        const firstName = member.first_name || "";
        const lastName = member.last_name || "";
        const fullName = `${firstName} ${lastName}`.trim() || userData.email || "Unknown User";

        return {
          id: member.id,
          userId: member.user_id,
          firstName,
          lastName,
          fullName,
          email: userData.email,
          role: userData.user_role,
          phone: member.phone || "",
          joinDate: member.joined_at || member.created_at || new Date().toISOString(),
          status: userData.is_active ? "active" : "inactive",
        };
      });

      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error loading team members:", error);
      toast({
        title: "Error",
        description: "Failed to load team members from database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [user?.id]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.toLowerCase();

    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
    );
  }, [users, searchTerm]);

  const kpiStats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "active").length;
    const inactive = users.filter((u) => u.status === "inactive").length;

    return [
      { label: "Total Recruiters", value: total, desc: "In your team", icon: Users },
      { label: "Active", value: active, desc: "Enabled accounts", icon: CheckCircle },
      { label: "Inactive", value: inactive, desc: "Disabled accounts", icon: XCircle },
    ];
  }, [users]);

  const handleOpenDialog = () => {
    setEditingUser(null);
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
    });
    setOpenDialog(true);
  };

  const handleEditUser = (companyUser: CompanyUser) => {
    setEditingUser(companyUser);
    setForm({
      firstName: companyUser.firstName,
      lastName: companyUser.lastName,
      email: companyUser.email,
      password: "",
      phone: companyUser.phone,
    });
    setOpenDialog(true);
  };

  const handleSaveUser = async () => {
    if (!form.firstName || !form.lastName || !form.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!employerId) {
      toast({
        title: "Error",
        description: "Employer account not loaded yet.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      const normalizedEmail = form.email.trim().toLowerCase();

      if (editingUser) {
        const { error: updateError } = await supabase
          .from("employer_team_members")
          .update({
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
          })
          .eq("id", editingUser.id);

        if (updateError) throw updateError;
      } else {
        if (!user?.id) {
          toast({
            title: "Error",
            description: "You must be logged in to invite a recruiter.",
            variant: "destructive",
          });
          return;
        }

        if (!form.password) {
          toast({
            title: "Error",
            description: "Password is required for new recruiter account.",
            variant: "destructive",
          });
          return;
        }

        const { data: existingAccount, error: existingAccountError } = await supabase
          .from("users")
          .select("id,email")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (existingAccountError) throw existingAccountError;

        if (existingAccount?.id) {
          toast({
            title: "Already Exists",
            description: "A user account with this email already exists.",
            variant: "destructive",
          });
          return;
        }

        const passwordHash = await bcrypt.hash(form.password, 10);

        const { data: createdUser, error: createUserError } = await supabase
          .from("users")
          .insert([
            {
              email: normalizedEmail,
              password_hash: passwordHash,
              user_role: "recruiter",
              is_active: true,
              email_verified: false,
              profile_completed: true,
            },
          ])
          .select("id")
          .single();

        if (createUserError || !createdUser?.id) throw createUserError || new Error("Failed to create user account");

        const { data: existingMember } = await supabase
          .from("employer_team_members")
          .select("id")
          .eq("employer_id", employerId)
          .eq("user_id", createdUser.id)
          .maybeSingle();

        if (existingMember?.id) {
          toast({
            title: "Already Added",
            description: "This user account is already in your team.",
            variant: "destructive",
          });
          return;
        }

        const { error: insertError } = await supabase.from("employer_team_members").insert([
          {
            employer_id: employerId,
            user_id: createdUser.id,
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            invited_by: user.id,
          },
        ]);

        if (insertError) throw insertError;

      }

      toast({
        title: "Success",
        description: editingUser ? "Team member updated successfully." : "Team member added successfully.",
      });

      setOpenDialog(false);
      setEditingUser(null);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
      });

      await loadUsers();
    } catch (error) {
      console.error("Error saving team member:", error);
      toast({
        title: "Error",
        description: "Failed to save team member.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const countLinkedRows = async (table: string, column: string, value: string) => {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq(column, value);

    if (error) throw error;
    return count || 0;
  };

  const getDeleteBlockers = async (target: CompanyUser) => {
    const blockers: string[] = [];

    const checks: Array<{ table: string; column: string; label: string; value: string }> = [
      { table: "interviews", column: "team_member_id", label: "assigned interviews", value: target.id },
      { table: "interviews", column: "created_by", label: "created interviews", value: target.id },
      { table: "activity_logs", column: "user_id", label: "activity logs", value: target.userId },
      { table: "notifications", column: "user_id", label: "notifications", value: target.userId },
      { table: "tickets", column: "user_id", label: "support tickets", value: target.userId },
      { table: "talents", column: "user_id", label: "talent profile", value: target.userId },
      { table: "owners", column: "user_id", label: "owner profile", value: target.userId },
      { table: "employers", column: "user_id", label: "employer profile", value: target.userId },
      { table: "employer_team_members", column: "invited_by", label: "invited team members", value: target.userId },
    ];

    for (const check of checks) {
      const linkedCount = await countLinkedRows(check.table, check.column, check.value);
      if (linkedCount > 0) {
        blockers.push(`${check.label} (${linkedCount})`);
      }
    }

    const { data: memberships, error: membershipError } = await supabase
      .from("employer_team_members")
      .select("id")
      .eq("user_id", target.userId);

    if (membershipError) throw membershipError;
    if ((memberships || []).length > 1) {
      blockers.push("other team memberships");
    }

    return blockers;
  };

  const deactivateInsteadOfDelete = async (target: CompanyUser, reason?: string) => {
    const { error: deactivateError } = await supabase
      .from("users")
      .update({ is_active: false })
      .eq("id", target.userId);

    if (deactivateError) throw deactivateError;

    toast({
      title: "Cannot Hard Delete",
      description: reason
        ? `This recruiter has linked records (${reason}), so the account was deactivated instead.`
        : "This recruiter has linked records, so the account was deactivated instead.",
      variant: "destructive",
    });

    await loadUsers();
    setOpenDialog(false);
  };

  const isForeignKeyError = (error: unknown) => {
    return !!error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23503";
  };

  const handleDeleteUser = async (target: CompanyUser) => {
    try {
      const blockers = await getDeleteBlockers(target);
      if (blockers.length > 0) {
        await deactivateInsteadOfDelete(target, blockers.join(", "));
        return;
      }

      const { error: deleteError } = await supabase.from("employer_team_members").delete().eq("id", target.id);
      if (deleteError) {
        if (isForeignKeyError(deleteError)) {
          await deactivateInsteadOfDelete(target);
          return;
        }
        throw deleteError;
      }

      toast({
        title: "Removed",
        description: "Recruiter removed from this team successfully.",
      });

      await loadUsers();
      setOpenDialog(false);
    } catch (error) {
      console.error("Error deleting team member:", error);
      toast({
        title: "Error",
        description: "Failed to delete team member.",
        variant: "destructive",
      });
    }
  };

  const handleRequestDelete = (target: CompanyUser) => {
    if (target.status === "active") {
      toast({
        title: "Deactivate First",
        description: "Please deactivate this recruiter before deleting.",
        variant: "destructive",
      });
      return;
    }

    setPendingDeleteUser(target);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteUser) return;
    const target = pendingDeleteUser;
    setPendingDeleteUser(null);
    await handleDeleteUser(target);
  };

  const updateStatus = async (target: CompanyUser, nextActive: boolean) => {
    try {
      setIsUpdatingStatus(true);

      const { error: statusError } = await supabase
        .from("users")
        .update({ is_active: nextActive })
        .eq("id", target.userId);

      if (statusError) throw statusError;

      await loadUsers();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update account status.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleToggleStatus = async (target: CompanyUser) => {
    const nextActive = target.status !== "active";

    if (!nextActive) {
      setPendingDeactivateUser(target);
      return;
    }

    await updateStatus(target, true);
  };

  const handleConfirmDeactivate = async () => {
    if (!pendingDeactivateUser) return;

    const target = pendingDeactivateUser;
    setPendingDeactivateUser(null);
    await updateStatus(target, false);
  };

  return (
    <RecruiterAdminLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-orange-50 p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Team Management
              </div>
              <h1 className="text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">My Team</h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Manage your company team from one place.
              </p>
            </div>

            <Button
              onClick={handleOpenDialog}
              className="h-12 rounded-full bg-orange-600 px-6 font-semibold text-white shadow-md hover:bg-orange-700"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Add Team Member
            </Button>
          </div>
        </section>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {kpiStats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-orange-100 bg-white p-6 shadow-lg">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-md">
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              <div className="mt-1 text-sm font-semibold text-slate-700">{stat.label}</div>
              <div className="mt-1 text-xs text-slate-500">{stat.desc}</div>
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-3xl border border-orange-100 bg-white p-4 shadow-lg">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search recruiters by name, email, or role..."
              className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 p-12 text-center shadow-sm">
            <Loader className="mx-auto mb-4 h-8 w-8 animate-spin text-orange-500" />
            <h3 className="mb-2 text-xl font-semibold text-slate-900">Loading users from database...</h3>
            <p className="text-orange-700">Please wait</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 p-12 text-center shadow-sm">
                <Users className="mx-auto mb-4 h-16 w-16 text-orange-300" />
                <h3 className="mb-2 text-xl font-semibold text-slate-900">No team members found</h3>
                <p className="mb-6 text-orange-700">Add your first team member to build your company team</p>
                <Button onClick={handleOpenDialog} className="rounded-full bg-orange-600 px-8 font-semibold text-white hover:bg-orange-700">
                  Add Team Member
                </Button>
              </div>
            ) : (
              filteredUsers.map((teamUser) => (
                <div key={teamUser.id} className="group rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600 text-xl font-bold text-white shadow-lg">
                        {teamUser.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{teamUser.fullName}</h3>
                        <p className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          {teamUser.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" />
                  </div>

                  <div className="mb-4">
                    <Badge
                      className={teamUser.status === "active"
                        ? "rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-orange-700"
                        : "rounded-full border border-orange-300 bg-orange-100 px-3 py-1 text-orange-800"
                      }
                    >
                      {teamUser.status === "active" ? "● Active" : "○ Inactive"}
                    </Badge>
                  </div>

                  <div className="mb-4 space-y-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-orange-700">Role</span>
                      <Badge className="rounded-full border-0 bg-orange-100 text-orange-700">{toDisplayRole(teamUser.role)}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-orange-700">Join Date</span>
                      <span className="flex items-center gap-1 font-bold text-slate-900">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        {new Date(teamUser.joinDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-orange-100 pt-4">
                    <Button
                      onClick={() => handleToggleStatus(teamUser)}
                      className="flex-1 gap-2 rounded-full bg-orange-600 text-white shadow-md hover:bg-orange-700"
                    >
                      {teamUser.status === "active" ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditUser(teamUser)}
                      className="text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                      aria-label={`Edit ${teamUser.fullName}`}
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRequestDelete(teamUser)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      aria-label={`Delete ${teamUser.fullName}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">
                {editingUser ? "Edit Team Member" : "Add New Team Member"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveUser();
              }}
              className="mt-4 grid gap-4 sm:grid-cols-2"
            >
              <div>
                <Label className="text-sm font-semibold text-slate-700">First Name</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="John"
                  className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400"
                  required
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-slate-700">Last Name</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Doe"
                  className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400"
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="member@company.com"
                  disabled={!!editingUser}
                  className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400"
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+213 ..."
                  className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400"
                />
              </div>

              {!editingUser && (
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Password</Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Set initial password"
                    className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400"
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2 sm:col-span-2">
                <Button
                  type="button"
                  onClick={() => setOpenDialog(false)}
                  className="h-12 flex-1 rounded-full bg-orange-600 font-semibold text-white shadow-lg hover:bg-orange-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="h-12 flex-1 rounded-full bg-orange-600 font-semibold text-white shadow-lg hover:bg-orange-700"
                >
                  {isSaving ? "Saving..." : editingUser ? "Update" : "Add"} Recruiter
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!pendingDeleteUser} onOpenChange={(open) => !open && setPendingDeleteUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Recruiter From Team?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDeleteUser
                  ? `${pendingDeleteUser.fullName} will be removed from this team. If related records exist, the system will deactivate the account instead of hard deleting.`
                  : "This recruiter will be removed from this team. If related records exist, the system will deactivate the account instead of hard deleting."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>Yes, Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!pendingDeactivateUser} onOpenChange={(open) => !open && setPendingDeactivateUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate Recruiter?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDeactivateUser
                  ? `${pendingDeactivateUser.fullName} will lose access until you activate this account again.`
                  : "This recruiter will lose access until you activate the account again."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeactivate} disabled={isUpdatingStatus}>
                {isUpdatingStatus ? "Deactivating..." : "Yes, Deactivate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RecruiterAdminLayout>
  );
}
