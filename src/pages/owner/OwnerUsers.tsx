import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Filter, UserPlus, Eye, Trash2, AlertTriangle, Building2, Briefcase, UserCog, Ban, CheckCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
}

export default function OwnerUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setIsLoading(true);
      
      // Fetch all users with their profile data
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, user_role, created_at, is_active')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch all profile tables in parallel
      const [talentsRes, employersRes, ownersRes] = await Promise.all([
        supabase.from('talents').select('user_id, full_name'),
        supabase.from('employers').select('user_id, company_name'),
        supabase.from('owners').select('user_id, full_name'),
      ]);

      // Create lookup maps
      const talentsMap = new Map(talentsRes.data?.map(t => [t.user_id, t.full_name]) || []);
      const employersMap = new Map(employersRes.data?.map(e => [e.user_id, e.company_name]) || []);
      const ownersMap = new Map(ownersRes.data?.map(o => [o.user_id, o.full_name]) || []);

      // Map users with their names
      const formattedUsers: User[] = usersData.map(user => {
        let name = user.email.split('@')[0]; // fallback
        let role = user.user_role.charAt(0).toUpperCase() + user.user_role.slice(1);

        if (user.user_role === 'talent') {
          name = talentsMap.get(user.id) || name;
          role = 'Talent';
        } else if (user.user_role === 'superadmin') {
          name = employersMap.get(user.id) || name;
          role = 'Superadmin';
        } else if (user.user_role === 'owner') {
          name = ownersMap.get(user.id) || name;
          role = 'Owner';
        }

        return {
          id: user.id,
          name,
          email: user.email,
          role,
          status: user.is_active ? 'Active' : 'Inactive',
          joinDate: new Date(user.created_at).toISOString().split('T')[0],
        };
      });

      // Sort users: Owner first, then Superadmins, and Talents
      formattedUsers.sort((a, b) => {
        const roleOrder = { 'Owner': 0, 'Superadmin': 1, 'Talent': 2 };
        return (roleOrder[a.role as keyof typeof roleOrder] || 99) - (roleOrder[b.role as keyof typeof roleOrder] || 99);
      });

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    // Only allow Owner, Superadmin, Talent
    if (user.role === "Employer") return false;
    const matchesRole = filterRole === "All" || user.role === filterRole;
    const matchesTab = activeTab === "all" || 
                       (activeTab === "superadmins" && user.role === "Superadmin") ||
                       (activeTab === "talents" && user.role === "Talent") ||
                       (activeTab === "owner" && user.role === "Owner");
    return matchesSearch && matchesRole && matchesTab;
  });

  function handleDeleteUser(id: string) {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!userToDelete) return;
    
    try {
      // Delete user from database
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userToDelete);

      if (error) throw error;

      // Update local state
      setUsers(users.filter(user => user.id !== userToDelete));
      
      toast({
        title: "User deleted",
        description: "User has been permanently removed.",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  }

  function handleDeactivateUser(id: string) {
    setUserToDeactivate(id);
    setDeactivateDialogOpen(true);
  }

  async function confirmDeactivate() {
    if (!userToDeactivate) return;
    
    const user = users.find(u => u.id === userToDeactivate);
    if (!user) return;

    const newStatus = user.status === "Active" ? false : true;
    
    try {
      // Update user status in database
      const { error } = await supabase
        .from('users')
        .update({ is_active: newStatus })
        .eq('id', userToDeactivate);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => 
        u.id === userToDeactivate 
          ? { ...u, status: newStatus ? "Active" : "Inactive" }
          : u
      ));
      
      toast({
        title: newStatus ? "User activated" : "User deactivated",
        description: newStatus 
          ? "User can now access the platform." 
          : "User access has been disabled.",
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeactivateDialogOpen(false);
      setUserToDeactivate(null);
    }
  }

  const getRoleIcon = (role: string) => {
    switch(role) {
      case "Owner": return <UserCog className="w-4 h-4" />;
      case "Superadmin": return <Building2 className="w-4 h-4" />;
      case "Talent": return <Briefcase className="w-4 h-4" />;
      default: return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case "Owner": return "bg-purple-100 text-purple-700 border-purple-200";
      case "Superadmin": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Talent": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage all platform users from one place</p>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole} disabled={isLoading}>
            <SelectTrigger className="w-[200px]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Roles</SelectItem>
              <SelectItem value="Owner">Owner</SelectItem>
              <SelectItem value="Superadmin">Superadmins</SelectItem>
              <SelectItem value="Talent">Talents</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border-b w-full justify-start rounded-none h-auto p-0">
            <TabsTrigger
              value="all"
              className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 rounded-none px-6 py-3"
            >
              All Users <span className="ml-2 text-gray-500">{users.length}</span>
            </TabsTrigger>
            <TabsTrigger
              value="owner"
              className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:text-purple-600 rounded-none px-6 py-3"
            >
              Owner <span className="ml-2 text-gray-500">{users.filter(u => u.role === "Owner").length}</span>
            </TabsTrigger>
            <TabsTrigger
              value="superadmins"
              className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 rounded-none px-6 py-3"
            >
              Superadmins <span className="ml-2 text-gray-500">{users.filter(u => u.role === "Superadmin").length}</span>
            </TabsTrigger>
            <TabsTrigger
              value="talents"
              className="data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 rounded-none px-6 py-3"
            >
              Talents <span className="ml-2 text-gray-500">{users.filter(u => u.role === "Talent").length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Role</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Join Date</th>
                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{user.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={getRoleColor(user.role)}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {user.role}
                          </span>
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            user.status === "Active"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                          }
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{user.joinDate}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeactivateUser(user.id)}
                            title={user.status === "Active" ? "Deactivate" : "Activate"}
                          >
                            <Ban className={`w-4 h-4 ${user.status === "Active" ? "text-orange-600" : "text-green-600"}`} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <AlertDialogTitle className="text-xl">Delete User</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                Are you sure you want to delete this user? This action cannot be undone. All user data will be permanently removed from the system.
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

        {/* Deactivate/Activate Dialog */}
        <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-12 h-12 rounded-full ${users.find(u => u.id === userToDeactivate)?.status === "Active" ? "bg-orange-100" : "bg-green-100"} flex items-center justify-center`}>
                  {users.find(u => u.id === userToDeactivate)?.status === "Active" ? (
                    <Ban className="w-6 h-6 text-orange-600" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <AlertDialogTitle className="text-xl">
                  {users.find(u => u.id === userToDeactivate)?.status === "Active" ? "Deactivate" : "Activate"} User
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-base">
                {users.find(u => u.id === userToDeactivate)?.status === "Active" 
                  ? "Are you sure you want to deactivate this user? They will lose access to the platform but their data will be preserved."
                  : "Are you sure you want to activate this user? They will regain full access to the platform."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeactivate}
                className={users.find(u => u.id === userToDeactivate)?.status === "Active" 
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"}
              >
                {users.find(u => u.id === userToDeactivate)?.status === "Active" ? "Deactivate" : "Activate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </OwnerLayout>
  );
}
