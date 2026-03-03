import EmployerLayout from "@/components/layouts/EmployerLayout";
import { useState, useEffect } from "react";
import bcrypt from "bcryptjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, User, Mail, Phone, Briefcase, Edit, Trash2, Plus, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function EmployerInterviewers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employerId, setEmployerId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [interviewerToDelete, setInterviewerToDelete] = useState(null);
  const [selectedInterviewer, setSelectedInterviewer] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    expertise: "",
    email: "",
    password: "",
    status: "active",
    interview_type: "",
    role: "",
  });

  useEffect(() => {
    if (user) {
      loadEmployerId();
    }
  }, [user]);

  useEffect(() => {
    if (employerId) {
      loadInterviewers();
    }
  }, [employerId]);

  async function loadEmployerId() {
    try {
      console.log("Current user id:", user?.id);
      
      // Get employer ID from team member association
      const { data, error } = await supabase
        .from("employer_team_members")
        .select("employer_id")
        .eq("user_id", user?.id)
        .single();

      console.log("Team member query result:", data, error);

      if (error) {
        console.error('Error loading employer ID from team members:', error);
        throw error;
      }
      
      if (data) {
        setEmployerId(data.employer_id);
      } else {
        toast({
          title: "Error",
          description: "You are not associated with any company. Please contact your administrator.",
          variant: "destructive",
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Error loading employer ID:", error);
      toast({
        title: "Error",
        description: error?.message || String(error),
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  async function loadInterviewers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("interviewers")
        .select("*")
        .eq("employer_id", employerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInterviewers(data || []);
    } catch (error) {
      console.error("Error loading interviewers:", error);
      toast({
        title: "Error",
        description: "Failed to load interviewers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleAddInterviewer(e) {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password || !form.interview_type || !form.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Check if employerId is valid
    if (!employerId) {
      toast({
        title: "Error",
        description: "Employer information not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    let createdUserId = null;

    try {
      // Hash the password before storing
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(form.password, salt);

      // Create user account for interviewer
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert([
          {
            email: form.email,
            password_hash: hashedPassword,
            user_role: "interviewer",
            is_active: true,
            email_verified: true,
            profile_completed: true,
          },
        ])
        .select()
        .single();

      if (userError) {
        console.error("User creation error:", userError);
        throw new Error(userError.message || JSON.stringify(userError));
      }

      createdUserId = userData.id;

      // Insert interviewer record
      const { data, error } = await supabase
        .from("interviewers")
        .insert([
          {
            employer_id: employerId,
            user_id: userData.id,
            full_name: form.full_name,
            email: form.email,
            expertise: form.expertise.split(",").map((s) => s.trim()).filter(Boolean),
            interview_type: form.interview_type,
            role: form.role,
            status: form.status,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Interviewer creation error:", error);
        // Rollback: Delete the created user account
        if (createdUserId) {
          await supabase.from("users").delete().eq("id", createdUserId);
        }
        throw new Error(error.message || JSON.stringify(error));
      }

      toast({
        title: "Success",
        description: "Interviewer account created and added successfully.",
      });

      loadInterviewers();
      setForm({ full_name: "", expertise: "", email: "", password: "", status: "active", interview_type: "", role: "" });
      setOpen(false);
    } catch (error) {
      console.error("Error adding interviewer:", error);
      toast({
        title: "Error",
        description: error?.message || String(error) || "Failed to add interviewer",
        variant: "destructive",
      });
    }
  }

  function handleEditInterviewer(interviewer) {
    setSelectedInterviewer(interviewer);
    setForm({
      full_name: interviewer.full_name,
      expertise: Array.isArray(interviewer.expertise) ? interviewer.expertise.join(", ") : "",
      email: interviewer.email,
      password: "",
      status: interviewer.status || "active",
      interview_type: interviewer.interview_type || "",
      role: interviewer.role || "",
    });
    setEditDialogOpen(true);
  }

  async function handleUpdateInterviewer(e) {
    e.preventDefault();
    if (!form.full_name || !form.interview_type || !form.role) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("interviewers")
        .update({
          full_name: form.full_name,
          expertise: form.expertise.split(",").map((s) => s.trim()).filter(Boolean),
          status: form.status,
          interview_type: form.interview_type,
          role: form.role,
        })
        .eq("id", selectedInterviewer.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Interviewer updated successfully",
      });

      loadInterviewers();
      setForm({ full_name: "", expertise: "", email: "", password: "", status: "active", interview_type: "", role: "" });
      setEditDialogOpen(false);
      setSelectedInterviewer(null);
    } catch (error) {
      console.error("Error updating interviewer:", error);
      toast({
        title: "Error",
        description: "Failed to update interviewer",
        variant: "destructive",
      });
    }
  }

  function handleDeleteInterviewer(interviewer) {
    setInterviewerToDelete(interviewer);
    setDeleteDialogOpen(true);
  }

  async function confirmDeleteInterviewer() {
    if (!interviewerToDelete) return;

    try {
      // Delete the interviewer record
      const { error: interviewerError } = await supabase
        .from("interviewers")
        .delete()
        .eq("id", interviewerToDelete.id);

      if (interviewerError) throw interviewerError;

      // Delete the user record
      if (interviewerToDelete.user_id) {
        const { error: userError } = await supabase
          .from("users")
          .delete()
          .eq("id", interviewerToDelete.user_id);
        if (userError) throw userError;
      }

      toast({
        title: "Success",
        description: "Interviewer and their user account deleted successfully.",
      });

      loadInterviewers();
      setDeleteDialogOpen(false);
      setInterviewerToDelete(null);
    } catch (error) {
      console.error("Error deleting interviewer/user:", error);
      toast({
        title: "Error",
        description: "Failed to delete interviewer or user account.",
        variant: "destructive",
      });
    }
  }

  return (
    <EmployerLayout>
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Interviewers</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-gradient-primary text-white">
                <UserPlus className="w-5 h-5" /> Add Interviewer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl p-0">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Add Interviewer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddInterviewer} className="flex flex-col h-full">
                <div className="flex-1 p-6 pt-2">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 font-medium flex items-center gap-2">
                          <User className="w-4 h-4 text-orange-500" /> Full Name *
                        </label>
                        <Input name="full_name" value={form.full_name} onChange={handleFormChange} required />
                      </div>
                      <div>
                        <label className="mb-2 font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4 text-orange-500" /> Email *
                        </label>
                        <Input name="email" type="email" value={form.email} onChange={handleFormChange} required />
                      </div>
                      <div>
                        <label className="mb-2 font-medium flex items-center gap-2">
                          <User className="w-4 h-4 text-orange-500" /> Password *
                        </label>
                        <Input name="password" type="password" value={form.password} onChange={handleFormChange} required />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 font-medium flex items-center gap-2">
                          <User className="w-4 h-4 text-orange-500" /> Expertise (comma separated)
                        </label>
                        <Input name="expertise" value={form.expertise} onChange={handleFormChange} placeholder="e.g. Frontend, React" />
                      </div>
                      <div>
                        <label className="mb-2 font-medium flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-orange-500" /> Interview Type *
                        </label>
                        <Select value={form.interview_type} onValueChange={(value) => setForm(prev => ({ ...prev, interview_type: value, role: "" }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interview type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="talent-acquisition">Talent Acquisition Interview</SelectItem>
                            <SelectItem value="technical">Technical Interview</SelectItem>
                            <SelectItem value="leadership">Leadership Interview</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {form.interview_type && (
                        <div>
                          <label className="mb-2 font-medium flex items-center gap-2">
                            <User className="w-4 h-4 text-orange-500" /> Role *
                          </label>
                          <Select value={form.role} onValueChange={(value) => setForm(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {form.interview_type === "talent-acquisition" ? (
                                <>
                                  <SelectItem value="hr_manager">HR Manager</SelectItem>
                                  <SelectItem value="talent_acquisition_specialist">Talent Acquisition Specialist</SelectItem>
                                  <SelectItem value="recruiter">Recruiter</SelectItem>
                                  <SelectItem value="hr_business_partner">HR Business Partner</SelectItem>
                                  <SelectItem value="talent_sourcer">Talent Sourcer</SelectItem>
                                </>
                              ) : form.interview_type === "leadership" ? (
                                <>
                                  <SelectItem value="cto">CTO - Chief Technology Officer</SelectItem>
                                  <SelectItem value="ceo">CEO - Chief Executive Officer</SelectItem>
                                  <SelectItem value="coo">COO - Chief Operating Officer</SelectItem>
                                  <SelectItem value="vp_engineering">VP of Engineering</SelectItem>
                                  <SelectItem value="director">Director</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="senior_engineer">Senior Engineer</SelectItem>
                                  <SelectItem value="lead_engineer">Lead Engineer</SelectItem>
                                  <SelectItem value="tech_lead">Tech Lead</SelectItem>
                                  <SelectItem value="architect">Software Architect</SelectItem>
                                  <SelectItem value="principal_engineer">Principal Engineer</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter className="p-4 pt-0 flex flex-row gap-2 justify-end border-t">
                  <Button type="submit" className="bg-gradient-primary text-white w-full">Create Account & Add</Button>
                  <DialogClose asChild>
                    <Button type="button" variant="ghost" className="w-full">Cancel</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="overflow-x-auto rounded-2xl shadow-card bg-white">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Full Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Expertise</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Interview Type</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Role</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading interviewers...
                      </td>
                    </tr>
                  ) : interviewers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No interviewers found. Add your first interviewer to get started.
                      </td>
                    </tr>
                  ) : (
                    interviewers.map((i) => (
                      <tr key={i.id} className="hover:bg-muted/30 transition">
                        <td className="px-4 py-3 whitespace-nowrap font-bold">{i.full_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{Array.isArray(i.expertise) ? i.expertise.join(", ") : ""}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">{i.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="outline" className={i.interview_type === "technical" ? "text-blue-600 border-blue-200 bg-blue-50" : i.interview_type === "leadership" ? "text-purple-600 border-purple-200 bg-purple-50" : "text-green-600 border-green-200 bg-green-50"}>
                            {i.interview_type === "technical" ? "Technical" : i.interview_type === "leadership" ? "Leadership" : "Talent Acquisition"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{i.role?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {i.status === "active" ? (
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600 border-gray-200 bg-gray-100">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleEditInterviewer(i)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive hover:text-destructive" onClick={() => handleDeleteInterviewer(i)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading interviewers...
              </div>
            ) : interviewers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No interviewers found. Add your first interviewer to get started.
              </div>
            ) : (
              interviewers.map((i) => (
                <div key={i.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-orange-500" /> {i.full_name}
                    </div>
                    {i.status === "active" ? (
                      <Badge className="bg-green-500 text-white">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-400 text-white">Inactive</Badge>
                    )}
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-orange-500" />{Array.isArray(i.expertise) ? i.expertise.join(", ") : "-"}</div>
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-orange-500" />{i.email}</div>
                    <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-orange-500" />{i.interview_type === "technical" ? "Technical" : i.interview_type === "leadership" ? "Leadership" : "Talent Acquisition"} - {i.role?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEditInterviewer(i)}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteInterviewer(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-3xl p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Edit Interviewer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateInterviewer} className="flex flex-col h-full">
              <div className="flex-1 p-6 pt-2">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-orange-500" /> Full Name *
                      </label>
                      <Input name="full_name" value={form.full_name} onChange={handleFormChange} required />
                    </div>
                    <div>
                      <label className="mb-2 font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4 text-orange-500" /> Email
                      </label>
                      <Input type="email" value={form.email} disabled className="bg-gray-50 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="mb-2 font-medium">Status</label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={form.status === "active" ? "default" : "outline"}
                          className={form.status === "active" ? "bg-green-600 hover:bg-green-700 text-white flex-1" : "flex-1"}
                          onClick={() => setForm(prev => ({ ...prev, status: "active" }))}
                        >
                          Active
                        </Button>
                        <Button
                          type="button"
                          variant={form.status === "inactive" ? "default" : "outline"}
                          className={form.status === "inactive" ? "bg-gray-500 hover:bg-gray-600 text-white flex-1" : "flex-1"}
                          onClick={() => setForm(prev => ({ ...prev, status: "inactive" }))}
                        >
                          Inactive
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-orange-500" /> Expertise (comma separated)
                      </label>
                      <Input name="expertise" value={form.expertise} onChange={handleFormChange} placeholder="e.g. Frontend, React" />
                    </div>
                    <div>
                      <label className="mb-2 font-medium flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-orange-500" /> Interview Type *
                      </label>
                      <Select value={form.interview_type} onValueChange={(value) => setForm(prev => ({ ...prev, interview_type: value, role: "" }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select interview type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="talent-acquisition">Talent Acquisition Interview</SelectItem>
                          <SelectItem value="technical">Technical Interview</SelectItem>
                          <SelectItem value="leadership">Leadership Interview</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {form.interview_type && (
                      <div>
                        <label className="mb-2 font-medium flex items-center gap-2">
                          <User className="w-4 h-4 text-orange-500" /> Role *
                        </label>
                        <Select value={form.role} onValueChange={(value) => setForm(prev => ({ ...prev, role: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {form.interview_type === "talent-acquisition" ? (
                              <>
                                <SelectItem value="hr_manager">HR Manager</SelectItem>
                                <SelectItem value="talent_acquisition_specialist">Talent Acquisition Specialist</SelectItem>
                                <SelectItem value="recruiter">Recruiter</SelectItem>
                                <SelectItem value="hr_business_partner">HR Business Partner</SelectItem>
                                <SelectItem value="talent_sourcer">Talent Sourcer</SelectItem>
                              </>
                            ) : form.interview_type === "leadership" ? (
                              <>
                                <SelectItem value="cto">CTO - Chief Technology Officer</SelectItem>
                                <SelectItem value="ceo">CEO - Chief Executive Officer</SelectItem>
                                <SelectItem value="coo">COO - Chief Operating Officer</SelectItem>
                                <SelectItem value="vp_engineering">VP of Engineering</SelectItem>
                                <SelectItem value="director">Director</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="senior_engineer">Senior Engineer</SelectItem>
                                <SelectItem value="lead_engineer">Lead Engineer</SelectItem>
                                <SelectItem value="tech_lead">Tech Lead</SelectItem>
                                <SelectItem value="architect">Software Architect</SelectItem>
                                <SelectItem value="principal_engineer">Principal Engineer</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter className="p-4 pt-0 flex flex-row gap-2 justify-end border-t">
                <Button type="submit" className="bg-gradient-primary text-white w-full">Update Interviewer</Button>
                <DialogClose asChild>
                  <Button type="button" variant="ghost" className="w-full">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Alert Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <AlertDialogTitle className="text-xl">Delete Interviewer & User Account</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                <>
                  Are you sure you want to delete this interviewer? <strong>This will also permanently delete their user account from the system.</strong> This action cannot be undone.
                  <br />
                  <br />
                  The interviewer and their login access will be removed from your system.
                </>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteInterviewer}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </EmployerLayout>
  );
}