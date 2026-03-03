import { useState, useEffect } from "react";
import EmployerAdminLayout from "@/components/layouts/EmployerAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, Edit, Trash2, AlertTriangle, Search, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface CompanyUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  user_role: string;
  is_active: boolean;
  created_at: string;
  invited_by?: string;
}

export default function EmployerAdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<CompanyUser | null>(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [userToToggle, setUserToToggle] = useState<CompanyUser | null>(null);
  const [employerId, setEmployerId] = useState<string>("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    user_role: "employer",
  });

  useEffect(() => {
    if (user?.id) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get employer_id from logged-in user
      const { data: employerData } = await supabase
        .from('employers')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      
      if (!employerData) {
        toast({
          title: "Error",
          description: "Could not find company profile.",
          variant: "destructive",
        });
        return;
      }
      
      setEmployerId(employerData.id);
      
      // Check if employer_team_members table exists, otherwise query users directly
      const { data: teamMembers, error: teamError } = await supabase
        .from('employer_team_members')
        .select('user_id, first_name, last_name, phone, invited_by')
        .eq('employer_id', employerData.id);
      
      if (teamError) {
        // Table might not exist, query users directly
        console.log('employer_team_members table not found, querying users directly');
        const { data: directUsers, error: userError } = await supabase
          .from('users')
          .select('id, email, user_role, is_active, created_at')
          .order('created_at', { ascending: false });
        
        if (userError) {
          console.error('Error fetching users:', userError);
          toast({
            title: "Error",
            description: "Failed to load users.",
            variant: "destructive",
          });
        } else {
          setUsers(directUsers || []);
        }
      } else {
        // Fetch user details for each team member
        const userIds = teamMembers.map(tm => tm.user_id);
        if (userIds.length > 0) {
          const { data: userDetails, error: userDetailsError } = await supabase
            .from('users')
            .select('id, email, user_role, is_active, created_at')
            .in('id', userIds);
          
          if (userDetailsError) {
            console.error('Error fetching user details:', userDetailsError);
          } else {
            const formattedUsers = (userDetails || []).map((u: any) => {
              const teamMember = teamMembers.find(tm => tm.user_id === u.id);
              return {
                id: u.id,
                email: u.email,
                first_name: teamMember?.first_name,
                last_name: teamMember?.last_name,
                phone: teamMember?.phone,
                user_role: u.user_role,
                is_active: u.is_active,
                created_at: u.created_at,
                invited_by: teamMember?.invited_by,
              };
            });
            setUsers(formattedUsers);
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) => u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = () => {
    setEditingUser(null);
    setForm({ email: "", password: "", first_name: "", last_name: "", phone: "", user_role: "employer" });
    setOpenDialog(true);
  };

  const handleEditUser = (u: CompanyUser) => {
    setEditingUser(u);
    setForm({ 
      email: u.email, 
      password: "", 
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      phone: u.phone || "",
      user_role: u.user_role 
    });
    setOpenDialog(true);
  };

  const handleSaveUser = async () => {
    if (!form.email) {
      toast({
        title: "Validation Error",
        description: "Email is required.",
        variant: "destructive",
      });
      return;
    }

    if (editingUser) {
      // Update existing user role and team member info
      try {
        const { error } = await supabase
          .from('users')
          .update({ 
            user_role: form.user_role,
            email: form.email,
          })
          .eq('id', editingUser.id);
        
        if (error) throw error;
        
        // Update employer_team_members if exists
        try {
          await supabase
            .from('employer_team_members')
            .update({
              first_name: form.first_name,
              last_name: form.last_name,
              phone: form.phone,
            })
            .eq('user_id', editingUser.id);
        } catch (teamUpdateError) {
          console.log('employer_team_members update skipped');
        }
        
        toast({
          title: "Success",
          description: "User updated successfully.",
        });
        setOpenDialog(false);
        loadUsers();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update user.",
          variant: "destructive",
        });
      }
    } else {
      // Create new user
      if (!form.password) {
        toast({
          title: "Validation Error",
          description: "Password is required for new users.",
          variant: "destructive",
        });
        return;
      }

      try {
        // Check if email already exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', form.email)
          .maybeSingle();
        
        if (existingUser) {
          toast({
            title: "Error",
            description: "Email already exists.",
            variant: "destructive",
          });
          return;
        }

        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(form.password, 10);
        
        // Create user
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: form.email,
            password_hash: hashedPassword,
            user_role: form.user_role,
            is_active: true,
          })
          .select('id, email, user_role, is_active, created_at')
          .single();
        
        if (userError) throw userError;
        
        // Try to add to employer_team_members if table exists
        try {
          await supabase
            .from('employer_team_members')
            .insert({
              employer_id: employerId,
              user_id: newUser.id,
              first_name: form.first_name,
              last_name: form.last_name,
              phone: form.phone,
              invited_by: user?.id,
            });
        } catch (teamError) {
          console.log('employer_team_members table not available, skipping team tracking');
        }
        
        toast({
          title: "Success",
          description: "Team member added successfully.",
        });
        setOpenDialog(false);
        setForm({ email: "", password: "", first_name: "", last_name: "", phone: "", user_role: "employer" });
        loadUsers();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to create user.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteUser = (u: CompanyUser) => {
    setUserToDelete(u);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      // Try to delete from employer_team_members if table exists
      try {
        await supabase
          .from('employer_team_members')
          .delete()
          .eq('user_id', userToDelete.id)
          .eq('employer_id', employerId);
      } catch (teamError) {
        console.log('employer_team_members table not available, skipping team cleanup');
      }
      
      // Delete the user
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userToDelete.id);
      
      if (userError) throw userError;
      
      toast({
        title: "Success",
        description: "User removed successfully.",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = (u: CompanyUser) => {
    setUserToToggle(u);
    setStatusDialog(true);
  };

  const confirmToggleStatus = async () => {
    if (!userToToggle) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !userToToggle.is_active })
        .eq('id', userToToggle.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `User ${!userToToggle.is_active ? 'activated' : 'deactivated'} successfully.`,
      });
      setStatusDialog(false);
      setUserToToggle(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status.",
        variant: "destructive",
      });
    }
  };

  return (
    <EmployerAdminLayout>
      <div className="max-w-6xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Company Team Members</h1>
            <p className="text-gray-600">Manage team members and their access to the platform</p>
          </div>
          <Button
            onClick={handleOpenDialog}
            className="bg-gradient-primary text-white gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Add Team Member
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Table */}
        <Card className="shadow-lg border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
          <div className="overflow-x-auto">
            <div className="hidden md:block">
              <div className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Phone
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Role
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Join Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border text-sm">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                          No team members found. Add your first team member to get started.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30 transition">
                        <td className="px-4 py-3 whitespace-nowrap font-medium">
                          {u.first_name || u.last_name 
                            ? `${u.first_name || ''} ${u.last_name || ''}`.trim()
                            : <span className="text-gray-400 italic">Not set</span>
                          }
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{u.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          {u.phone || <span className="text-gray-400 italic">Not set</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {u.user_role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {u.is_active ? (
                            <Badge className="bg-green-100 text-green-700">Active</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2"
                              onClick={() => handleToggleStatus(u)}
                            >
                              {u.is_active ? (
                                <XCircle className="w-4 h-4 text-red-600" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2"
                              onClick={() => handleEditUser(u)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteUser(u)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No team members found.
                </div>
              ) : (
                filteredUsers.map((u) => (
                <div key={u.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {u.first_name || u.last_name 
                          ? `${u.first_name || ''} ${u.last_name || ''}`.trim()
                          : <span className="text-gray-400 italic">Not set</span>
                        }
                      </div>
                      <div className="text-sm text-gray-500">{u.email}</div>
                    </div>
                    <Badge
                      className={
                        u.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Phone: {u.phone || <span className="text-gray-400 italic">Not set</span>}</div>
                    <div>Role: {u.user_role}</div>
                    <div>Joined: {new Date(u.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(u)}
                      className="flex-1"
                    >
                      {u.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditUser(u)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => handleDeleteUser(u)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )))}
            </div>
          </div>
          )}
        </Card>

        {/* Add/Edit User Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit Team Member" : "Add New Team Member"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Update team member information and role." : "Create a new team member account for your company."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="user@company.com"
                  disabled={!!editingUser}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="user_role">User Role</Label>
                <Select value={form.user_role} onValueChange={(value) => setForm({ ...form, user_role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employer">employer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveUser} className="bg-gradient-primary text-white">
                {editingUser ? "Update" : "Add"} Team Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <AlertDialogTitle className="text-xl">Delete Team Member</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                Are you sure you want to remove {userToDelete?.email} from your team? This action cannot be undone and will permanently delete their account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Toggle Status Confirmation */}
        <AlertDialog open={statusDialog} onOpenChange={setStatusDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {userToToggle?.is_active ? "Deactivate" : "Activate"} Team Member
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to{" "}
                {userToToggle?.is_active ? "deactivate" : "activate"}{" "}
                {userToToggle?.email}? This will affect their access to the platform.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmToggleStatus}
                className={
                  userToToggle?.is_active
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }
              >
                {userToToggle?.is_active ? "Deactivate" : "Activate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </EmployerAdminLayout>
  );
}
