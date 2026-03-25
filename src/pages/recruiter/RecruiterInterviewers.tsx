import { useEffect, useMemo, useState } from "react";
import RecruiterLayout from "@/components/layouts/RecruiterLayout";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import {
  UserPlus,
  Mail,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  Users,
  UserCheck,
  Calendar,
  Sparkles,
  Loader2,
} from "lucide-react";

interface InterviewerUser {
  id: string;
  userId: string | null;
  fullName: string;
  email: string;
  role: "Technical Interviewer" | "Leadership Interviewer";
  expertise: string[];
  joinDate: string;
  status: "active" | "inactive";
}

const roleOptions: Array<InterviewerUser["role"]> = ["Technical Interviewer", "Leadership Interviewer"];

const toDbInterviewType = (role: InterviewerUser["role"]) => {
  if (role === "Leadership Interviewer") {
    return "leadership";
  }

  return "technical";
};

const toUiRole = (interviewType?: string): InterviewerUser["role"] => {
  if (interviewType === "leadership") {
    return "Leadership Interviewer";
  }

  return "Technical Interviewer";
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

export default function EmployerInterviewers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<InterviewerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<InterviewerUser | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<InterviewerUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "" as "" | InterviewerUser["role"],
    expertise: "",
    password: "",
  });

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (member) =>
          member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm, users]
  );

  const loadInterviewers = async () => {
    try {
      if (!user?.id) {
        setUsers([]);
        setEmployerId(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      let resolvedEmployerId: string | null = null;

      const { data: employerByOwner } = await supabase
        .from("employers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (employerByOwner?.id) {
        resolvedEmployerId = employerByOwner.id;
      } else {
        const { data: teamMembership } = await supabase
          .from("employer_team_members")
          .select("employer_id")
          .eq("user_id", user.id)
          .maybeSingle();

        resolvedEmployerId = teamMembership?.employer_id ?? null;
      }

      if (!resolvedEmployerId) {
        setEmployerId(null);
        setUsers([]);
        toast({
          title: "No Company Found",
          description: "We could not find the company linked to this recruiter account.",
          variant: "destructive",
        });
        return;
      }

      setEmployerId(resolvedEmployerId);

      const { data: rows, error } = await supabase
        .from("interviewers")
        .select("id,user_id,full_name,email,expertise,interview_type,status,created_at")
        .eq("employer_id", resolvedEmployerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const linkedUserIds = Array.from(new Set((rows || []).map((row: any) => row.user_id).filter(Boolean)));
      const userMap = new Map<string, { email: string; is_active: boolean }>();

      if (linkedUserIds.length > 0) {
        const { data: userRows, error: userRowsError } = await supabase
          .from("users")
          .select("id,email,is_active")
          .in("id", linkedUserIds);

        if (userRowsError) throw userRowsError;

        for (const userRow of userRows || []) {
          if (!userRow?.id) continue;
          userMap.set(userRow.id, {
            email: userRow.email || "",
            is_active: userRow.is_active ?? true,
          });
        }
      }

      const mappedUsers: InterviewerUser[] = (rows || []).map((row: any) => {
        const linkedUser = row.user_id ? userMap.get(row.user_id) : undefined;

        return {
          id: row.id,
          userId: row.user_id || null,
          fullName: row.full_name || "Unknown",
          email: linkedUser?.email || row.email || "",
          role: toUiRole(row.interview_type),
          expertise: toStringArray(row.expertise),
          joinDate: row.created_at || new Date().toISOString(),
          status: linkedUser ? (linkedUser.is_active ? "active" : "inactive") : row.status === "inactive" ? "inactive" : "active",
        };
      });

      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error loading interviewers:", error);
      toast({
        title: "Error",
        description: "Failed to load interviewers from database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInterviewers();
  }, [user?.id]);

  const handleOpenDialog = () => {
    setEditingUser(null);
    setForm({ fullName: "", email: "", role: "", expertise: "", password: "" });
    setOpenDialog(true);
  };

  const handleEditUser = (user: InterviewerUser) => {
    setEditingUser(user);
    setForm({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      expertise: user.expertise.join(", "),
      password: "",
    });
    setOpenDialog(true);
  };

  const handleSaveUser = async () => {
    if (!form.fullName || !form.email || !form.role || !form.expertise.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields, including expertise.",
        variant: "destructive",
      });
      return;
    }

    const expertiseArray = form.expertise
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (expertiseArray.length === 0) {
      toast({
        title: "Missing Expertise",
        description: "Please add at least one expertise item.",
        variant: "destructive",
      });
      return;
    }

    if (!employerId) {
      toast({
        title: "No Company Found",
        description: "No employer was found for this account.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      const normalizedEmail = form.email.trim().toLowerCase();

      if (editingUser) {
        if (editingUser.userId) {
          const userUpdatePayload: Record<string, any> = {
            email: normalizedEmail,
            profile_completed: true,
            updated_at: new Date().toISOString(),
          };

          if (form.password.trim()) {
            userUpdatePayload.password_hash = await bcrypt.hash(form.password, 10);
          }

          const { error: updateUserError } = await supabase
            .from("users")
            .update(userUpdatePayload)
            .eq("id", editingUser.userId);

          if (updateUserError) throw updateUserError;
        }

        const { error } = await supabase
          .from("interviewers")
          .update({
            full_name: form.fullName.trim(),
            email: normalizedEmail,
            expertise: expertiseArray,
            interview_type: toDbInterviewType(form.role),
            role: form.role,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingUser.id);

        if (error) throw error;
      } else {
        if (!form.password.trim()) {
          toast({
            title: "Password Required",
            description: "Please set a password for the interviewer user account.",
            variant: "destructive",
          });
          return;
        }

        const { data: existingUser, error: existingUserError } = await supabase
          .from("users")
          .select("id")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (existingUserError) throw existingUserError;

        if (existingUser?.id) {
          toast({
            title: "Already Exists",
            description: "A user account with this email already exists.",
            variant: "destructive",
          });
          return;
        }

        const passwordHash = await bcrypt.hash(form.password.trim(), 10);

        const { data: createdUser, error: createUserError } = await supabase
          .from("users")
          .insert([
            {
              email: normalizedEmail,
              password_hash: passwordHash,
              user_role: "interviewer",
              is_active: true,
              email_verified: false,
              profile_completed: true,
            },
          ])
          .select("id")
          .single();

        if (createUserError || !createdUser?.id) throw createUserError || new Error("Failed to create user account");

        const { error } = await supabase.from("interviewers").insert([
          {
            user_id: createdUser.id,
            employer_id: employerId,
            full_name: form.fullName.trim(),
            email: normalizedEmail,
            expertise: expertiseArray,
            interview_type: toDbInterviewType(form.role),
            role: form.role,
            status: "active",
          },
        ]);

        if (error) throw error;
      }

      await loadInterviewers();
      setOpenDialog(false);
      setForm({ fullName: "", email: "", role: "", expertise: "", password: "" });
      setEditingUser(null);
    } catch (error: any) {
      console.error("Error saving interviewer:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save interviewer.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const { error } = await supabase.from("interviewers").delete().eq("id", id);
      if (error) throw error;

      await loadInterviewers();
    } catch (error) {
      console.error("Error deleting interviewer:", error);
      toast({
        title: "Error",
        description: "Failed to delete interviewer.",
        variant: "destructive",
      });
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

  const getDeleteBlockers = async (target: InterviewerUser) => {
    const blockers: string[] = [];

    const linkedInterviews = await countLinkedRows("interviews", "interviewer_id", target.id);
    if (linkedInterviews > 0) {
      blockers.push(`linked interviews (${linkedInterviews})`);
    }

    if (target.userId) {
      const checks: Array<{ table: string; column: string; label: string }> = [
        { table: "activity_logs", column: "user_id", label: "activity logs" },
        { table: "notifications", column: "user_id", label: "notifications" },
        { table: "tickets", column: "user_id", label: "support tickets" },
      ];

      for (const check of checks) {
        const linkedCount = await countLinkedRows(check.table, check.column, target.userId);
        if (linkedCount > 0) {
          blockers.push(`${check.label} (${linkedCount})`);
        }
      }
    }

    return blockers;
  };

  const deactivateInsteadOfDelete = async (target: InterviewerUser, reason?: string) => {
    const { error: interviewerDeactivateError } = await supabase
      .from("interviewers")
      .update({ status: "inactive", updated_at: new Date().toISOString() })
      .eq("id", target.id);

    if (interviewerDeactivateError) throw interviewerDeactivateError;

    if (target.userId) {
      const { error: userDeactivateError } = await supabase
        .from("users")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", target.userId);

      if (userDeactivateError) throw userDeactivateError;
    }

    toast({
      title: "Cannot Hard Delete",
      description: reason
        ? `This interviewer has linked records (${reason}), so the account was deactivated instead.`
        : "This interviewer has linked records, so the account was deactivated instead.",
      variant: "destructive",
    });
  };

  const isForeignKeyError = (error: unknown) => {
    return !!error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23503";
  };

  const handleRequestDelete = (target: InterviewerUser) => {
    setPendingDeleteUser(target);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteUser) return;

    const target = pendingDeleteUser;
    setPendingDeleteUser(null);

    try {
      setIsDeleting(true);

      const blockers = await getDeleteBlockers(target);
      if (blockers.length > 0) {
        await deactivateInsteadOfDelete(target, blockers.join(", "));
        await loadInterviewers();
        return;
      }

      const { error: deleteInterviewerError } = await supabase.from("interviewers").delete().eq("id", target.id);
      if (deleteInterviewerError) {
        if (isForeignKeyError(deleteInterviewerError)) {
          await deactivateInsteadOfDelete(target);
          await loadInterviewers();
          return;
        }
        throw deleteInterviewerError;
      }

      if (target.userId) {
        const { error: deleteUserError } = await supabase.from("users").delete().eq("id", target.userId);
        if (deleteUserError && !isForeignKeyError(deleteUserError)) {
          throw deleteUserError;
        }

        if (deleteUserError && isForeignKeyError(deleteUserError)) {
          await deactivateInsteadOfDelete(target);
          await loadInterviewers();
          return;
        }
      }

      toast({
        title: "Deleted",
        description: "Interviewer removed successfully.",
      });

      await loadInterviewers();
      setOpenDialog(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error deleting interviewer:", error);
      toast({
        title: "Error",
        description: "Failed to delete interviewer.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const target = users.find((member) => member.id === id);
    if (!target) return;

    try {
      const nextStatus = target.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("interviewers")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      if (target.userId) {
        const { error: userStatusError } = await supabase
          .from("users")
          .update({ is_active: nextStatus === "active", updated_at: new Date().toISOString() })
          .eq("id", target.userId);

        if (userStatusError) throw userStatusError;
      }

      await loadInterviewers();
    } catch (error) {
      console.error("Error updating interviewer status:", error);
      toast({
        title: "Error",
        description: "Failed to update interviewer status.",
        variant: "destructive",
      });
    }
  };

  return (
    <RecruiterLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-orange-50 p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Interview Panel
              </div>
              <h1 className="text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Interviewers
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
                Manage technical and leadership interviewer access from one place.
              </p>
            </div>

            <Button
              onClick={handleOpenDialog}
              className="h-12 rounded-full bg-orange-600 px-6 font-semibold text-white shadow-md hover:bg-orange-700"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Add Interviewer
            </Button>
          </div>
        </section>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Technical",
              value: users.filter((u) => u.role === "Technical Interviewer").length,
              desc: "Technical interviewers",
              icon: UserCheck,
            },
            {
              label: "Leadership",
              value: users.filter((u) => u.role === "Leadership Interviewer").length,
              desc: "Leadership interviewers",
              icon: XCircle,
            },
            {
              label: "Total",
              value: users.filter((u) => u.status === "active" || u.status === "inactive").length,
              desc: "Active + Inactive",
              icon: Users,
            },
          ].map((stat) => (
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
              placeholder="Search interviewers by name or email..."
              className="h-12 rounded-xl border-orange-200 pl-12 focus:border-orange-400 focus:ring-orange-400"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 p-12 text-center shadow-sm">
              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-orange-400" />
              <h3 className="mb-2 text-xl font-semibold text-slate-900">Loading interviewers...</h3>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="col-span-full rounded-[2rem] border border-dashed border-orange-200 bg-orange-50/50 p-12 text-center shadow-sm">
              <Users className="mx-auto mb-4 h-16 w-16 text-orange-300" />
              <h3 className="mb-2 text-xl font-semibold text-slate-900">No interviewers found</h3>
              <p className="mb-6 text-orange-700">Add your first interviewer to build your panel</p>
              <Button onClick={handleOpenDialog} className="rounded-full bg-orange-600 px-8 font-semibold text-white hover:bg-orange-700">
                Add Interviewer
              </Button>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="group rounded-3xl border border-orange-100 bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600 text-xl font-bold text-white shadow-lg">
                      {user.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{user.fullName}</h3>
                      <p className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" />
                </div>

                <div className="mb-4">
                  <Badge
                    className={
                      user.status === "active"
                        ? "rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-orange-700"
                        : "rounded-full border border-orange-300 bg-orange-100 px-3 py-1 text-orange-800"
                    }
                  >
                    {user.status === "active" ? "• Active" : "○ Inactive"}
                  </Badge>
                </div>

                <div className="mb-4 space-y-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-orange-700">Role</span>
                    <Badge className="rounded-full border-0 bg-orange-100 text-orange-700">{user.role}</Badge>
                  </div>
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <span className="pt-1 text-orange-700">Expertise</span>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {user.expertise.length > 0 ? (
                        user.expertise.map((item) => (
                          <Badge key={`${user.id}-${item}`} className="rounded-full border border-orange-200 bg-white text-orange-700">
                            {item}
                          </Badge>
                        ))
                      ) : (
                        <span className="font-medium text-slate-500">Not set</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-orange-700">Join Date</span>
                    <span className="flex items-center gap-1 font-bold text-slate-900">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      {new Date(user.joinDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-orange-100 pt-4">
                  <Button
                    onClick={() => handleToggleStatus(user.id)}
                    className="flex-1 gap-2 rounded-full bg-orange-600 text-white shadow-md hover:bg-orange-700"
                  >
                    {user.status === "active" ? (
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
                    onClick={() => handleEditUser(user)}
                    className="text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                    aria-label={`Edit ${user.fullName}`}
                  >
                    <Edit className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRequestDelete(user)}
                    className="text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                    aria-label={`Delete ${user.fullName}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-slate-900">
                {editingUser ? "Edit Interviewer" : "Add New Interviewer"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveUser();
              }}
              className="mt-4 space-y-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Full Name</Label>
                  <Input
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="John Doe"
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
                    placeholder="interviewer@company.com"
                    className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-slate-700">
                    Password {editingUser ? "(leave blank to keep current)" : ""}
                  </Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editingUser ? "Optional" : "Set initial password"}
                    className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400"
                    required={!editingUser}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(value) => setForm({ ...form, role: value as InterviewerUser["role"] })}
                  >
                    <SelectTrigger className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((roleOption) => (
                        <SelectItem key={roleOption} value={roleOption}>
                          {roleOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-sm font-semibold text-slate-700">Expertise (comma separated)</Label>
                  <Input
                    value={form.expertise}
                    onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                    placeholder="React, System Design, Behavioral"
                    className="mt-2 h-12 rounded-xl border-orange-200 bg-orange-50 focus:border-orange-400"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
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
                  {editingUser ? "Update" : "Add"} Interviewer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!pendingDeleteUser} onOpenChange={(open) => !open && setPendingDeleteUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Interviewer?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDeleteUser
                  ? `${pendingDeleteUser.fullName} will be deleted. If linked records exist, the system will deactivate the account instead of hard deleting.`
                  : "This action will remove the interviewer account."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? "Processing..." : "Yes, Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RecruiterLayout>
  );
}

