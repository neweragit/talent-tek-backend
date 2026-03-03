import { useState, useEffect } from "react";
import OwnerLayout from "@/components/layouts/OwnerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { 
  CreditCard, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Search, 
  Filter,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Settings,
  Package
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  price: number;
  billing_cycle: string;
  features: string[];
  target_user_type: 'employer' | 'talent';
  is_active: boolean;
  is_featured: boolean;
  max_job_posts?: number;
  max_active_jobs?: number;
  max_users?: number;
  max_service_posts?: number;
  max_active_services?: number;
  subscribers: number;
}

interface Subscription {
  id: string;
  name: string;
  email: string;
  plan: string;
  price: string;
  startDate: string;
  nextBilling: string;
  status: string;
  autoRenew: boolean;
  paymentMethod: string;
  totalPaid: string;
}

export default function OwnerSubscriptions() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editSubscriptionDialog, setEditSubscriptionDialog] = useState(false);
  const [cancelSubscriptionDialog, setCancelSubscriptionDialog] = useState(false);
  const [addSubscriptionDialog, setAddSubscriptionDialog] = useState(false);
  const [managePlansDialog, setManagePlansDialog] = useState(false);
  const [editPlanDialog, setEditPlanDialog] = useState(false);
  const [addPlanDialog, setAddPlanDialog] = useState(false);
  const [deletePlanDialog, setDeletePlanDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [selectedPlanType, setSelectedPlanType] = useState<'employer' | 'talent'>('employer');
  const [activeTab, setActiveTab] = useState("subscriptions");

  // Plans and subscriptions state
  const [employerPlans, setEmployerPlans] = useState<Plan[]>([]);
  const [talentPlans, setTalentPlans] = useState<Plan[]>([]);
  const [employerSubscriptions, setEmployerSubscriptions] = useState<Subscription[]>([]);
  const [talentSubscriptions, setTalentSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: "0",
    monthlyRevenue: "0",
    activeEmployers: 0,
    activeTalents: 0,
    employerSubscriptions: 0,
    talentSubscriptions: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      await Promise.all([
        loadPlans(),
        loadSubscriptions(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadPlans() {
    const { data: plansData, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    // Count subscribers for each plan
    const plansWithSubscribers = await Promise.all(
      plansData.map(async (plan) => {
        const { count } = await supabase
          .from('subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('plan_id', plan.id)
          .eq('status', 'active');

        // Convert features from object to array for display
        let featuresArray: string[] = [];
        if (plan.features) {
          if (Array.isArray(plan.features)) {
            featuresArray = plan.features;
          } else if (typeof plan.features === 'object') {
            // Convert object to descriptive strings
            featuresArray = Object.entries(plan.features).map(([key, value]) => {
              const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return `${formattedKey}: ${value}`;
            });
          }
        }

        return {
          id: plan.id,
          name: plan.name,
          display_name: plan.display_name,
          description: plan.description,
          price: plan.price,
          billing_cycle: plan.billing_cycle,
          features: featuresArray,
          target_user_type: plan.target_user_type,
          is_active: plan.is_active,
          is_featured: plan.is_featured,
          max_job_posts: plan.max_job_posts,
          max_active_jobs: plan.max_active_jobs,
          max_users: plan.max_users,
          max_service_posts: plan.max_service_posts,
          max_active_services: plan.max_active_services,
          subscribers: count || 0
        };
      })
    );

    const employers = plansWithSubscribers.filter(p => p.target_user_type === 'employer');
    const talents = plansWithSubscribers.filter(p => p.target_user_type === 'talent');

    setEmployerPlans(employers);
    setTalentPlans(talents);
  }

  async function loadSubscriptions() {
    // Load employer subscriptions
    const { data: empSubs, error: empError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        started_at,
        expires_at,
        auto_renew,
        plan_id,
        plans (name, display_name, price),
        employers (
          company_name,
          users (email)
        )
      `)
      .not('employer_id', 'is', null)
      .order('created_at', { ascending: false });

    if (empError) throw empError;

    const formattedEmpSubs: Subscription[] = (empSubs || []).map((sub: any) => ({
      id: sub.id,
      name: sub.employers?.company_name || 'Unknown',
      email: sub.employers?.users?.email || 'No email',
      plan: sub.plans?.display_name || sub.plans?.name || 'Unknown Plan',
      price: `${sub.plans?.price || 0} DZD`,
      startDate: new Date(sub.started_at).toISOString().split('T')[0],
      nextBilling: sub.expires_at ? new Date(sub.expires_at).toISOString().split('T')[0] : '-',
      status: sub.status,
      autoRenew: sub.auto_renew,
      paymentMethod: 'N/A',
      totalPaid: '0 DZD'
    }));

    // Load talent subscriptions
    const { data: talSubs, error: talError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        status,
        started_at,
        expires_at,
        auto_renew,
        plan_id,
        plans (name, display_name, price),
        talents (
          full_name,
          users (email)
        )
      `)
      .not('talent_id', 'is', null)
      .order('created_at', { ascending: false });

    if (talError) throw talError;

    const formattedTalSubs: Subscription[] = (talSubs || []).map((sub: any) => ({
      id: sub.id,
      name: sub.talents?.full_name || 'Unknown',
      email: sub.talents?.users?.email || 'No email',
      plan: sub.plans?.display_name || sub.plans?.name || 'Unknown Plan',
      price: `$${sub.plans?.price || 0}`,
      startDate: new Date(sub.started_at).toISOString().split('T')[0],
      nextBilling: sub.expires_at ? new Date(sub.expires_at).toISOString().split('T')[0] : '-',
      status: sub.status,
      autoRenew: sub.auto_renew,
      paymentMethod: 'N/A',
      totalPaid: '$0'
    }));

    setEmployerSubscriptions(formattedEmpSubs);
    setTalentSubscriptions(formattedTalSubs);
  }

  async function loadStats() {
    // Count active subscriptions
    const { count: activeEmpCount } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .not('employer_id', 'is', null)
      .eq('status', 'active');

    const { count: activeTalCount } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .not('talent_id', 'is', null)
      .eq('status', 'active');

    const { count: totalEmpSubs } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .not('employer_id', 'is', null);

    const { count: totalTalSubs } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .not('talent_id', 'is', null);

    setStats({
      totalRevenue: "0", // Would need payments table data
      monthlyRevenue: "0", // Would need payments table data
      activeEmployers: activeEmpCount || 0,
      activeTalents: activeTalCount || 0,
      employerSubscriptions: totalEmpSubs || 0,
      talentSubscriptions: totalTalSubs || 0,
    });
  }

  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setEditSubscriptionDialog(true);
  };

  const handleCancelSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setCancelSubscriptionDialog(true);
  };

  const confirmCancelSubscription = () => {
    toast({
      title: "Subscription Cancelled",
      description: `${selectedSubscription?.name}'s subscription has been cancelled.`,
    });
    setCancelSubscriptionDialog(false);
    setSelectedSubscription(null);
  };

  const handleSaveEdit = () => {
    toast({
      title: "Subscription Updated",
      description: "Subscription details have been updated successfully.",
    });
    setEditSubscriptionDialog(false);
    setSelectedSubscription(null);
  };

  const handleAddSubscription = () => {
    toast({
      title: "Subscription Added",
      description: "New subscription has been created successfully.",
    });
    setAddSubscriptionDialog(false);
  };

  const handleEditPlan = (plan: Plan) => {
    if (plan.subscribers > 0) {
      toast({
        title: "Cannot Edit Plan",
        description: `This plan has ${plan.subscribers} active subscriber(s). Plans with subscribers cannot be edited.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedPlan(plan);
    setEditPlanDialog(true);
  };

  const handleAddPlan = (type: 'employer' | 'talent') => {
    setSelectedPlanType(type);
    setSelectedPlan(null);
    setAddPlanDialog(true);
  };

  async function handleSavePlan(planData: any) {
    try {
      const { error } = await supabase
        .from('plans')
        .update({
          name: planData.name,
          display_name: planData.displayName,
          description: planData.description,
          price: planData.price,
          billing_cycle: planData.billingCycle || 'monthly',
          features: planData.features, // Array will be auto-converted to JSONB
          max_job_posts: planData.maxJobPosts || null,
          max_active_jobs: planData.maxActiveJobs || null,
          max_users: planData.maxUsers || null,
          max_service_posts: planData.maxServicePosts || null,
          max_active_services: planData.maxActiveServices || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedPlan?.id);

      if (error) throw error;

      toast({
        title: "Plan Updated",
        description: "The subscription plan has been updated successfully.",
      });
      setEditPlanDialog(false);
      loadPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Error",
        description: "Failed to update plan. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleDeletePlan(plan: Plan) {
    if (plan.subscribers > 0) {
      toast({
        title: "Cannot Delete Plan",
        description: `This plan has ${plan.subscribers} active subscribers. Please migrate them to another plan first.`,
        variant: "destructive",
      });
      return;
    }

    setPlanToDelete(plan);
    setDeletePlanDialog(true);
  }

  async function confirmDeletePlan() {
    if (!planToDelete) return;

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planToDelete.id);

      if (error) throw error;

      toast({
        title: "Plan Deleted",
        description: "The subscription plan has been deleted successfully.",
      });
      setDeletePlanDialog(false);
      setPlanToDelete(null);
      loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete plan. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleCreatePlan(planData: any) {
    try {
      const { error } = await supabase
        .from('plans')
        .insert({
          name: planData.name,
          display_name: planData.displayName,
          description: planData.description,
          target_user_type: selectedPlanType,
          price: planData.price,
          billing_cycle: planData.billingCycle || 'monthly',
          features: planData.features, // Array will be auto-converted to JSONB by Supabase
          is_active: true,
          is_featured: false,
          sort_order: 0,
          max_job_posts: planData.maxJobPosts || null,
          max_active_jobs: planData.maxActiveJobs || null,
          max_users: planData.maxUsers || null,
          max_service_posts: planData.maxServicePosts || null,
          max_active_services: planData.maxActiveServices || null,
        });

      if (error) throw error;

      toast({
        title: "Plan Created",
        description: "New subscription plan has been created successfully.",
      });
      setAddPlanDialog(false);
      loadPlans();
    } catch (error) {
      console.error('Error creating plan:', error);
      toast({
        title: "Error",
        description: "Failed to create plan. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleExportToPDF = async () => {
    try {
      // Dynamically import jsPDF and autoTable
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // TalenTek brand colors
      const primaryColor: [number, number, number] = [255, 87, 34]; // Orange
      const darkColor: [number, number, number] = [33, 33, 33];
      const lightGray: [number, number, number] = [240, 240, 240];
      
      // Header with logo area
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Company name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('TalenTek', 15, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Subscriptions Report', 15, 30);
      
      // Report date
      doc.setFontSize(9);
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(`Generated: ${today}`, pageWidth - 15, 20, { align: 'right' });
      doc.text('OFFICIAL DOCUMENT', pageWidth - 15, 30, { align: 'right' });
      
      // Stats Summary
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 15, 50);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Active Employers: ${stats.activeEmployers}`, 15, 58);
      doc.text(`Active Talents: ${stats.activeTalents}`, 15, 64);
      doc.text(`Total Subscriptions: ${stats.employerSubscriptions + stats.talentSubscriptions}`, 15, 70);
      
      // Employer Subscriptions Table
      if (employerSubscriptions.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Employer Subscriptions', 15, 85);
        
        autoTable(doc, {
          startY: 90,
          head: [['Company', 'Plan', 'Price', 'Status', 'Next Billing']],
          body: employerSubscriptions.map(sub => [
            sub.name,
            sub.plan,
            sub.price,
            sub.status.charAt(0).toUpperCase() + sub.status.slice(1),
            sub.nextBilling
          ]),
          theme: 'grid',
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: lightGray
          },
          styles: {
            fontSize: 9,
            cellPadding: 4
          }
        });
      }
      
      // Talent Subscriptions Table
      if (talentSubscriptions.length > 0) {
        const finalY = (doc as any).lastAutoTable?.finalY || 90;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Talent Subscriptions', 15, finalY + 15);
        
        autoTable(doc, {
          startY: finalY + 20,
          head: [['Talent', 'Plan', 'Price', 'Status', 'Next Billing']],
          body: talentSubscriptions.map(sub => [
            sub.name,
            sub.plan,
            sub.price,
            sub.status.charAt(0).toUpperCase() + sub.status.slice(1),
            sub.nextBilling
          ]),
          theme: 'grid',
          headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: lightGray
          },
          styles: {
            fontSize: 9,
            cellPadding: 4
          }
        });
      }
      
      // Footer
      const finalY = (doc as any).lastAutoTable?.finalY || pageHeight - 30;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('This is an official document from TalenTek', pageWidth / 2, pageHeight - 15, { align: 'center' });
      const year = new Date().getFullYear();
      doc.text(`Page 1 | (c) ${year} TalenTek. All rights reserved.`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Save PDF
      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`TalenTek_Subscriptions_${dateStr}.pdf`);
      
      toast({
        title: "Export Successful",
        description: "Subscriptions report exported to PDF.",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { className: "bg-green-100 text-green-700", icon: CheckCircle, label: "Active" },
      cancelled: { className: "bg-gray-100 text-gray-700", icon: XCircle, label: "Cancelled" },
      past_due: { className: "bg-red-100 text-red-700", icon: AlertCircle, label: "Past Due" }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;
    return (
      <Badge className={`${config.className} hover:${config.className} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const SubscriptionTable = ({ subscriptions, type }: { subscriptions: Subscription[], type: string }) => {
    const filtered = subscriptions.filter(sub => {
      const matchesSearch = type === "employer" 
        ? sub.name.toLowerCase().includes(searchQuery.toLowerCase())
        : sub.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || sub.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-orange-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                {type === "employer" ? "Company" : "Talent"}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Plan</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Next Billing</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Paid</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 text-sm font-medium text-gray-900">{sub.id}</td>
                <td className="px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {sub.name}
                    </p>
                    <p className="text-xs text-gray-500">{sub.email}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge variant="outline" className="border-orange-300 text-orange-700">
                    {sub.plan}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-gray-900">{sub.price}</td>
                <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                  {sub.nextBilling === "-" ? (
                    <span className="text-gray-400">-</span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      {sub.nextBilling}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">{getStatusBadge(sub.status)}</td>
                <td className="px-4 py-4 text-sm font-semibold text-green-600">{sub.totalPaid}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-primary hover:bg-orange-50 hover:text-primary"
                      onClick={() => handleEditSubscription(sub)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {sub.status === "active" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleCancelSubscription(sub)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No subscriptions found</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <OwnerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Subscriptions Management</h1>
            <p className="text-gray-600 mt-2">Manage subscription plans and subscribers</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setManagePlansDialog(true)}
              variant="outline"
              className="gap-2"
            >
              <Settings className="w-5 h-5" />
              Manage Plans
            </Button>
            <Button
              onClick={() => setAddSubscriptionDialog(true)}
              className="bg-gradient-primary text-white hover:opacity-90 gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Subscriber
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-orange-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900">{stats.totalRevenue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                  <p className="text-xl font-bold text-gray-900">{stats.monthlyRevenue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Employers</p>
                  <p className="text-xl font-bold text-gray-900">{stats.activeEmployers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Talents</p>
                  <p className="text-xl font-bold text-gray-900">{stats.activeTalents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Subscriptions</p>
                  <p className="text-xl font-bold text-gray-900">{stats.employerSubscriptions + stats.talentSubscriptions}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.employerSubscriptions} Employers, {stats.talentSubscriptions} Talents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs - Plans vs Subscriptions */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full md:w-96 grid-cols-2 bg-orange-50">
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Subscribers
            </TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" />
              Plans
            </TabsTrigger>
          </TabsList>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            {/* Filters */}
            <Card className="border-orange-200 shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search by company or talent name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-orange-200 focus:ring-orange-500"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-48 border-orange-200">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    className="border-orange-300 text-primary hover:bg-orange-50"
                    onClick={handleExportToPDF}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export to PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

        {/* Subscriptions Tabs */}
        <Tabs defaultValue="employers" className="space-y-6">
          <TabsList className="grid w-full md:w-96 grid-cols-2 bg-orange-50">
            <TabsTrigger value="employers" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Briefcase className="w-4 h-4 mr-2" />
              Employers
            </TabsTrigger>
            <TabsTrigger value="talents" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Talents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employers">
            <Card className="border-orange-200 shadow-md">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Briefcase className="w-6 h-6 text-primary" />
                  Employer Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <SubscriptionTable subscriptions={employerSubscriptions} type="employer" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="talents">
            <Card className="border-orange-200 shadow-md">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="w-6 h-6 text-primary" />
                  Talent Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <SubscriptionTable subscriptions={talentSubscriptions} type="talent" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <Tabs defaultValue="employer-plans" className="space-y-6">
              <TabsList className="grid w-full md:w-96 grid-cols-2 bg-orange-50">
                <TabsTrigger value="employer-plans" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Employer Plans
                </TabsTrigger>
                <TabsTrigger value="talent-plans" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Talent Plans
                </TabsTrigger>
              </TabsList>

              <TabsContent value="employer-plans">
                <div className="mb-4 flex justify-end">
                  <Button
                    onClick={() => handleAddPlan('employer')}
                    className="bg-gradient-primary text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Employer Plan
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {employerPlans.map((plan) => (
                    <Card key={plan.id} className="border-orange-200 shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">{plan.display_name || plan.name}</CardTitle>
                            {plan.is_featured && (
                              <Badge className="bg-yellow-500">Featured</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPlan(plan)}
                              disabled={plan.subscribers > 0}
                              title={plan.subscribers > 0 ? "Cannot edit plan with active subscribers" : "Edit plan"}
                              className={plan.subscribers > 0 ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePlan(plan)}
                              disabled={plan.subscribers > 0}
                              title={plan.subscribers > 0 ? "Cannot delete plan with active subscribers" : "Delete plan"}
                              className={plan.subscribers > 0 ? "opacity-50 cursor-not-allowed" : "border-red-300 text-red-600 hover:bg-red-50"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {plan.description && (
                          <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                        )}
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-primary">{plan.price.toLocaleString()}</span>
                          <span className="text-sm text-gray-600">DZD</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {plan.billing_cycle || 'monthly'}
                          </Badge>
                          <Badge className={plan.is_active ? "bg-green-600" : "bg-gray-400"}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b">
                          <span className="text-sm text-gray-600">Active Subscribers</span>
                          <Badge className="bg-primary text-white">{plan.subscribers}</Badge>
                        </div>
                        
                        {/* Limits Section */}
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                            <Settings className="w-3.5 h-3.5 text-primary" />
                            Plan Limits
                          </p>
                          <div className="space-y-2">
                            {plan.max_job_posts && (
                              <div className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <Briefcase className="w-4 h-4 text-primary" />
                                  <span className="text-xs text-gray-700">Job Posts</span>
                                </div>
                                <span className="text-sm font-bold text-primary">{plan.max_job_posts}</span>
                              </div>
                            )}
                            {plan.max_active_jobs && (
                              <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-blue-600" />
                                  <span className="text-xs text-gray-700">Active Jobs</span>
                                </div>
                                <span className="text-sm font-bold text-blue-600">{plan.max_active_jobs}</span>
                              </div>
                            )}
                            {plan.max_service_posts && (
                              <div className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-purple-600" />
                                  <span className="text-xs text-gray-700">Service Posts</span>
                                </div>
                                <span className="text-sm font-bold text-purple-600">{plan.max_service_posts}</span>
                              </div>
                            )}
                            {plan.max_active_services && (
                              <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                                  <span className="text-xs text-gray-700">Active Services</span>
                                </div>
                                <span className="text-sm font-bold text-indigo-600">{plan.max_active_services}</span>
                              </div>
                            )}
                            {plan.max_users && (
                              <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-gray-700">Team Members</span>
                                </div>
                                <span className="text-sm font-bold text-green-600">{plan.max_users}</span>
                              </div>
                            )}
                            {!plan.max_job_posts && !plan.max_active_jobs && !plan.max_service_posts && !plan.max_active_services && !plan.max_users && (
                              <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                                <p className="text-xs text-gray-500 italic">No limits - Unlimited access</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Features Section */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Features:</p>
                          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="talent-plans">
                <div className="mb-4 flex justify-end">
                  <Button
                    onClick={() => handleAddPlan('talent')}
                    className="bg-gradient-primary text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Talent Plan
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {talentPlans.map((plan) => (
                    <Card key={plan.id} className="border-orange-200 shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">{plan.display_name || plan.name}</CardTitle>
                            {plan.is_featured && (
                              <Badge className="bg-yellow-500">Featured</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPlan(plan)}
                              disabled={plan.subscribers > 0}
                              title={plan.subscribers > 0 ? "Cannot edit plan with active subscribers" : "Edit plan"}
                              className={plan.subscribers > 0 ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeletePlan(plan)}
                              disabled={plan.subscribers > 0}
                              title={plan.subscribers > 0 ? "Cannot delete plan with active subscribers" : "Delete plan"}
                              className={plan.subscribers > 0 ? "opacity-50 cursor-not-allowed" : "border-red-300 text-red-600 hover:bg-red-50"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {plan.description && (
                          <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
                        )}
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-primary">${plan.price.toLocaleString()}</span>
                          <span className="text-sm text-gray-600">USD</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {plan.billing_cycle || 'monthly'}
                          </Badge>
                          <Badge className={plan.is_active ? "bg-green-600" : "bg-gray-400"}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b">
                          <span className="text-sm text-gray-600">Active Subscribers</span>
                          <Badge className="bg-primary text-white">{plan.subscribers}</Badge>
                        </div>
                        
                        {/* Limits Section */}
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                            <Settings className="w-3.5 h-3.5 text-primary" />
                            Plan Limits
                          </p>
                          <div className="space-y-2">
                            {plan.max_job_posts && (
                              <div className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <Briefcase className="w-4 h-4 text-primary" />
                                  <span className="text-xs text-gray-700">Job Posts</span>
                                </div>
                                <span className="text-sm font-bold text-primary">{plan.max_job_posts}</span>
                              </div>
                            )}
                            {plan.max_active_jobs && (
                              <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-blue-600" />
                                  <span className="text-xs text-gray-700">Active Jobs</span>
                                </div>
                                <span className="text-sm font-bold text-blue-600">{plan.max_active_jobs}</span>
                              </div>
                            )}
                            {plan.max_service_posts && (
                              <div className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-purple-600" />
                                  <span className="text-xs text-gray-700">Service Posts</span>
                                </div>
                                <span className="text-sm font-bold text-purple-600">{plan.max_service_posts}</span>
                              </div>
                            )}
                            {plan.max_active_services && (
                              <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                                  <span className="text-xs text-gray-700">Active Services</span>
                                </div>
                                <span className="text-sm font-bold text-indigo-600">{plan.max_active_services}</span>
                              </div>
                            )}
                            {plan.max_users && (
                              <div className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-gray-700">Team Members</span>
                                </div>
                                <span className="text-sm font-bold text-green-600">{plan.max_users}</span>
                              </div>
                            )}
                            {!plan.max_job_posts && !plan.max_active_jobs && !plan.max_service_posts && !plan.max_active_services && !plan.max_users && (
                              <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                                <p className="text-xs text-gray-500 italic">No limits - Unlimited access</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Features Section */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Features:</p>
                          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Edit Subscription Dialog */}
        <Dialog open={editSubscriptionDialog} onOpenChange={setEditSubscriptionDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Subscription</DialogTitle>
              <DialogDescription>
                Update subscription details for {selectedSubscription?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Plan</label>
                  <Select defaultValue={selectedSubscription?.plan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Free">Free</SelectItem>
                      <SelectItem value="Starter">Starter</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Premium Freelancer">Premium Freelancer</SelectItem>
                      <SelectItem value="Elite Professional">Elite Professional</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                  <Select defaultValue={selectedSubscription?.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Next Billing Date</label>
                <Input type="date" defaultValue={selectedSubscription?.nextBilling} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="autoRenew" defaultChecked={selectedSubscription?.autoRenew} />
                <label htmlFor="autoRenew" className="text-sm text-gray-700">Enable auto-renewal</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditSubscriptionDialog(false)}>
                Cancel
              </Button>
              <Button className="bg-gradient-primary text-white" onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Subscription Dialog */}
        <Dialog open={cancelSubscriptionDialog} onOpenChange={setCancelSubscriptionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Subscription</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel the subscription for {selectedSubscription?.name}?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  This action will immediately cancel the subscription. The user will lose access to premium features.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelSubscriptionDialog(false)}>
                Keep Subscription
              </Button>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={confirmCancelSubscription}>
                Cancel Subscription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Subscription Dialog */}
        <Dialog open={addSubscriptionDialog} onOpenChange={setAddSubscriptionDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Subscription</DialogTitle>
              <DialogDescription>
                Create a new subscription for an employer or talent
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">User Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employer">Employer</SelectItem>
                    <SelectItem value="talent">Talent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                <Input placeholder="user@example.com" type="email" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Plan</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter - 15,000 DZD</SelectItem>
                      <SelectItem value="professional">Professional - 35,000 DZD</SelectItem>
                      <SelectItem value="enterprise">Enterprise - 75,000 DZD</SelectItem>
                      <SelectItem value="free">Free - $0</SelectItem>
                      <SelectItem value="premium">Premium Freelancer - $29</SelectItem>
                      <SelectItem value="elite">Elite Professional - $99</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Start Date</label>
                  <Input type="date" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="addAutoRenew" defaultChecked />
                <label htmlFor="addAutoRenew" className="text-sm text-gray-700">Enable auto-renewal</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddSubscriptionDialog(false)}>
                Cancel
              </Button>
              <Button className="bg-gradient-primary text-white" onClick={handleAddSubscription}>
                Create Subscription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Plan Dialog */}
        <Dialog open={editPlanDialog} onOpenChange={setEditPlanDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Plan</DialogTitle>
              <DialogDescription>
                Update plan details for {selectedPlan?.display_name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const features = (formData.get('features') as string).split('\n').filter(f => f.trim());
              handleSavePlan({
                name: formData.get('name'),
                displayName: formData.get('displayName'),
                description: formData.get('description'),
                price: parseFloat(formData.get('price') as string),
                billingCycle: formData.get('billingCycle'),
                maxJobPosts: formData.get('maxJobPosts') ? parseInt(formData.get('maxJobPosts') as string) : null,
                maxActiveJobs: formData.get('maxActiveJobs') ? parseInt(formData.get('maxActiveJobs') as string) : null,
                maxUsers: formData.get('maxUsers') ? parseInt(formData.get('maxUsers') as string) : null,
                maxServicePosts: formData.get('maxServicePosts') ? parseInt(formData.get('maxServicePosts') as string) : null,
                maxActiveServices: formData.get('maxActiveServices') ? parseInt(formData.get('maxActiveServices') as string) : null,
                features
              });
            }}>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Plan Name (Internal)*</label>
                    <Input name="name" required defaultValue={selectedPlan?.name} placeholder="e.g., professional" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Display Name*</label>
                    <Input name="displayName" required defaultValue={selectedPlan?.display_name} placeholder="e.g., Professional" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                  <Input name="description" defaultValue={selectedPlan?.description || ''} placeholder="Brief plan description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Price*</label>
                    <Input name="price" type="number" step="0.01" required defaultValue={selectedPlan?.price} placeholder="e.g., 35000" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Billing Cycle*</label>
                    <select 
                      name="billingCycle" 
                      required
                      defaultValue={selectedPlan?.billing_cycle || 'monthly'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                      <option value="one-time">One-Time</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Max Job Posts</label>
                    <Input name="maxJobPosts" type="number" defaultValue={selectedPlan?.max_job_posts || ''} placeholder="empty = unlimited" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Max Active Jobs</label>
                    <Input name="maxActiveJobs" type="number" defaultValue={selectedPlan?.max_active_jobs || ''} placeholder="e.g., 5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Max Service Posts</label>
                    <Input name="maxServicePosts" type="number" defaultValue={selectedPlan?.max_service_posts || ''} placeholder="e.g., 10" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Max Active Services</label>
                    <Input name="maxActiveServices" type="number" defaultValue={selectedPlan?.max_active_services || ''} placeholder="e.g., 3" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Max Users</label>
                  <Input name="maxUsers" type="number" defaultValue={selectedPlan?.max_users || ''} placeholder="e.g., 10 team members" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Features (one per line)*</label>
                  <textarea 
                    name="features"
                    required
                    className="w-full min-h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    defaultValue={Array.isArray(selectedPlan?.features) ? selectedPlan.features.join('\n') : ''}
                    placeholder="Enter features, one per line"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedPlan?.subscribers}</strong> subscribers are currently on this plan
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditPlanDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-primary text-white">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Plan Dialog */}
        <Dialog open={addPlanDialog} onOpenChange={setAddPlanDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New {selectedPlanType === 'employer' ? 'Employer' : 'Talent'} Plan</DialogTitle>
              <DialogDescription>
                Add a new subscription plan for {selectedPlanType}s
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const features = (formData.get('features') as string).split('\n').filter(f => f.trim());
              handleCreatePlan({
                name: formData.get('name'),
                displayName: formData.get('displayName'),
                description: formData.get('description'),
                price: parseFloat(formData.get('price') as string),
                billingCycle: formData.get('billingCycle'),
                maxJobPosts: formData.get('maxJobPosts') ? parseInt(formData.get('maxJobPosts') as string) : null,
                maxActiveJobs: formData.get('maxActiveJobs') ? parseInt(formData.get('maxActiveJobs') as string) : null,
                maxUsers: formData.get('maxUsers') ? parseInt(formData.get('maxUsers') as string) : null,
                maxServicePosts: formData.get('maxServicePosts') ? parseInt(formData.get('maxServicePosts') as string) : null,
                maxActiveServices: formData.get('maxActiveServices') ? parseInt(formData.get('maxActiveServices') as string) : null,
                features
              });
            }}>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Plan Name (Internal)*</label>
                    <Input name="name" required placeholder="e.g., professional" />
                    <p className="text-xs text-gray-500 mt-1">Lowercase, no spaces</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Display Name*</label>
                    <Input name="displayName" required placeholder="e.g., Professional" />
                    <p className="text-xs text-gray-500 mt-1">Shown to users</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
                  <Input name="description" placeholder="Brief plan description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Price* ({selectedPlanType === 'employer' ? 'DZD' : 'USD'})
                    </label>
                    <Input name="price" type="number" step="0.01" required placeholder="e.g., 35000" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Billing Cycle*</label>
                    <select 
                      name="billingCycle" 
                      required
                      defaultValue="monthly"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                      <option value="one-time">One-Time</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Max Job Posts</label>
                    <Input name="maxJobPosts" type="number" placeholder="e.g., 20 (empty = unlimited)" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Max Active Jobs</label>
                    <Input name="maxActiveJobs" type="number" placeholder="e.g., 5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Max Service Posts</label>
                    <Input name="maxServicePosts" type="number" placeholder="e.g., 10" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Max Active Services</label>
                    <Input name="maxActiveServices" type="number" placeholder="e.g., 3" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Max Users</label>
                  <Input name="maxUsers" type="number" placeholder="e.g., 10 team members" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Features (one per line)*</label>
                  <textarea 
                    name="features"
                    required
                    className="w-full min-h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="20 Job Posts&#10;Unlimited Applications&#10;Priority Support&#10;Analytics"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddPlanDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-primary text-white">
                  Create Plan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Plan Confirmation Dialog */}
        <Dialog open={deletePlanDialog} onOpenChange={setDeletePlanDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Delete Plan
              </DialogTitle>
              <DialogDescription className="pt-4">
                Are you sure you want to delete the <strong>"{planToDelete?.display_name}"</strong> plan?
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-semibold">
                    ⚠️ This action cannot be undone.
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    The plan will be permanently removed from the system.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setDeletePlanDialog(false);
                  setPlanToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDeletePlan}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </OwnerLayout>
  );
}
