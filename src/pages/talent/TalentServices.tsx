import { useState, useEffect } from "react";
import TalentLayout from "@/components/layouts/TalentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Clock, 
  Code,
  Palette,
  PenTool,
  Megaphone,
  TrendingUp,
  FileText,
  Languages,
  Video,
  Smartphone,
  MapPin,
  Plus,
  X,
  Trash2,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { servicesApi } from "@/lib/api";
import type { Service, Talent } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const TalentServices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  
  const talentProfile = user?.profile as Talent;

  const plans = [
    {
      id: 1,
      name: "Free",
      price: "$0",
      period: "/month",
      features: ["Basic job matching", "5 applications/month", "Support Ticket access"],
      current: false,
    },
    {
      id: 2,
      name: "Premium Freelancer",
      price: "$29",
      period: "/month",
      features: ["All Free features", "Unlimited applications", "Priority job matching", "Invoice management", "Contract templates", "24/7 Support Ticket access"],
      current: true,
      popular: true,
    },
    {
      id: 3,
      name: "Elite Professional",
      price: "$99",
      period: "/month",
      features: ["All Premium features", "Featured profile", "Analytics dashboard", "Insurance & protection", "Dedicated account manager", "Custom branding"],
      current: false,
    },
  ];

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    deliveryTime: "",
    tags: "",
    category: "",
  });

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, [talentProfile?.id]);

  const loadServices = async () => {
    if (!talentProfile?.id) return;
    
    try {
      setLoading(true);
      const data = await servicesApi.getAll(talentProfile.id);
      setMyServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
      toast({
        title: "Error",
        description: "Failed to load services. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSubscription = async () => {
    if (!talentProfile?.id) return;
    
    try {
      const { subscriptionsApi } = await import('@/lib/api');
      const data = await subscriptionsApi.getByUserId(talentProfile.id, 'talent');
      setSubscription(data);
      if (data) {
        setAutoRenew(data.auto_renew);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleCreateService = async () => {
    if (!talentProfile?.id) {
      toast({
        title: "Error",
        description: "User profile not found",
        variant: "destructive",
      });
      return;
    }

    if (
      !formData.title ||
      !formData.description ||
      !formData.price ||
      !formData.deliveryTime
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const newService = await servicesApi.create(talentProfile.id, {
        title: formData.title,
        description: formData.description,
        starting_price: parseFloat(formData.price),
        delivery_time: formData.deliveryTime,
        category: formData.category || 'Development',
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        icon: 'Code',
      });

      setMyServices([newService, ...myServices]);
      setFormData({
        title: "",
        description: "",
        price: "",
        deliveryTime: "",
        tags: "",
        category: "",
      });
      setShowCreateDialog(false);
      
      toast({
        title: "Success",
        description: "Service created successfully!",
      });
    } catch (error) {
      console.error('Failed to create service:', error);
      toast({
        title: "Error",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditService = async () => {
    if (!editingService) return;

    if (
      !formData.title ||
      !formData.description ||
      !formData.price ||
      !formData.deliveryTime
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const updatedService = await servicesApi.update(editingService.id, {
        title: formData.title,
        description: formData.description,
        starting_price: parseFloat(formData.price),
        delivery_time: formData.deliveryTime,
        category: formData.category || editingService.category,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      });

      setMyServices(
        myServices.map((service) =>
          service.id === updatedService.id ? updatedService : service
        )
      );
      
      setFormData({
        title: "",
        description: "",
        price: "",
        deliveryTime: "",
        tags: "",
        category: "",
      });
      setEditingService(null);
      setShowEditDialog(false);
      
      toast({
        title: "Success",
        description: "Service updated successfully!",
      });
    } catch (error) {
      console.error('Failed to update service:', error);
      toast({
        title: "Error",
        description: "Failed to update service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await servicesApi.delete(id);
      setMyServices(myServices.filter((service) => service.id !== id));
      
      toast({
        title: "Success",
        description: "Service deleted successfully!",
      });
    } catch (error) {
      console.error('Failed to delete service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description || "",
      price: service.starting_price?.toString() || "",
      deliveryTime: service.delivery_time || "",
      tags: service.tags?.join(", ") || "",
      category: service.category || "",
    });
    setShowEditDialog(true);
  };

  const getIconComponent = (iconName?: string) => {
    const iconMap: { [key: string]: any } = {
      Code,
      Palette,
      PenTool,
      Megaphone,
      TrendingUp,
      FileText,
      Languages,
      Video,
      Smartphone,
    };
    return iconMap[iconName || 'Code'] || Code;
  };

  return (
    <TalentLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Services</h1>
            <p className="text-gray-600 mt-1">Manage and showcase your professional services</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2 px-6 py-2 rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Create Service
          </Button>
        </div>

        {/* Subscription Card */}
        <div className="w-full mb-8">
          <div
            className="rounded-2xl shadow-xl p-8 w-full"
            style={{
              background: 'linear-gradient(90deg, #f93712 0%, #ff6a3c 100%)',
              color: '#fff',
              boxShadow: '0 4px 24px 0 rgba(249,55,18,0.15)',
            }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8" style={{ color: '#fff' }} />
                <span className="text-2xl font-bold tracking-tight">Subscription Status</span>
              </div>
              <Badge style={{ background: '#fff', color: '#f93712', fontWeight: 600, fontSize: '1rem', padding: '0.5rem 1.25rem' }}>Active</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-xs opacity-80">Current Plan</p>
                <p className="font-bold text-lg">{loadingSubscription ? 'Loading...' : subscription?.plan?.display_name || 'Free'}</p>
              </div>
              <div>
                <p className="text-xs opacity-80">Renewal Date</p>
                <p className="font-bold text-lg">{loadingSubscription ? 'Loading...' : subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs opacity-80">Auto-Renewal</p>
                <p className="font-bold text-lg">{loadingSubscription ? 'Loading...' : subscription?.auto_renew ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3 md:gap-6">
              <Button
                style={{ background: '#fff', color: '#f93712', border: 'none', fontWeight: 600, fontSize: '1rem', padding: '0.75rem 2rem', boxShadow: '0 2px 8px 0 #f9371233' }}
                className="rounded-xl shadow hover:bg-[#ffe5e0] focus:ring-2 focus:ring-[#f93712] transition"
                onClick={() => setShowUpgradeDialog(true)}
              >
                Upgrade Plan
              </Button>
              <Button
                style={{ background: '#fff', color: '#f93712', border: 'none', fontWeight: 600, fontSize: '1rem', padding: '0.75rem 2rem', boxShadow: '0 2px 8px 0 #f9371233' }}
                className="rounded-xl shadow hover:bg-[#ffe5e0] focus:ring-2 focus:ring-[#f93712] transition"
                onClick={() => setShowManageDialog(true)}
              >
                Manage Subscription
              </Button>
            </div>
          </div>
        </div>

        {/* Upgrade Plan Dialog */}
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-2xl border-0 p-0 flex flex-col">
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-bold" style={{ color: '#222' }}>Choose Your Perfect Plan</h2>
                <p className="text-gray-500 mt-2">Unlock premium features and grow your business</p>
              </div>
              <button
                onClick={() => setShowUpgradeDialog(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            {/* Plans Grid */}
            <div className="p-8 flex-1">
              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div key={plan.id} className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${plan.popular ? 'md:scale-105 ring-2 ring-[#f93712]' : ''}`}>
                    <div className={`absolute inset-0 -z-10 rounded-2xl ${plan.popular ? 'bg-gradient-to-br from-[#f93712]/5 to-transparent' : 'bg-white'}`} />
                    <div className={`bg-white border rounded-2xl p-8 flex flex-col gap-6 h-full shadow-lg hover:shadow-2xl transition`} style={{ borderColor: plan.popular ? '#f93712' : '#e5e7eb' }}>
                      {plan.popular && (
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                          <Badge style={{ background: '#f93712', color: '#fff' }} className="px-3 py-1 text-sm font-bold">POPULAR</Badge>
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-bold mb-2" style={{ color: '#222' }}>{plan.name}</h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold" style={{ color: '#f93712' }}>{plan.price}</span>
                          <span className="text-gray-500 text-sm">{plan.period}</span>
                        </div>
                      </div>
                      <ul className="space-y-3 flex-grow">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-3 text-gray-700">
                            <CheckCircle2 className="w-5 h-5" style={{ color: '#f93712' }} />
                            <span className="text-sm">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        style={{
                          background: plan.current ? '#e0e0e0' : '#f93712',
                          color: plan.current ? '#999' : '#fff',
                          fontWeight: 700,
                          fontSize: '1rem',
                          borderRadius: '1rem',
                          padding: '1rem',
                          boxShadow: plan.current ? 'none' : '0 4px 12px 0 #f9371244',
                        }}
                        className="w-full hover:opacity-90 transition font-bold"
                        disabled={plan.current}
                      >
                        {plan.current ? '✓ Current Plan' : 'Upgrade to ' + plan.name}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manage Subscription Dialog */}
        <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-2xl border-0 p-0 flex flex-col">
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-bold" style={{ color: '#222' }}>Manage Your Subscription</h2>
                <p className="text-gray-500 mt-2">View and control your subscription settings</p>
              </div>
              <button
                onClick={() => setShowManageDialog(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            {/* Content */}
            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
              {/* Current Plan Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold" style={{ color: '#222' }}>Current Plan</h3>
                  <Badge style={{ background: '#f93712', color: '#fff' }} className="px-4 py-1 font-bold text-sm">ACTIVE</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Plan Name</p>
                    <p className="text-lg font-bold" style={{ color: '#f93712' }}>{subscription?.plan?.display_name || 'Free'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Renewal Date</p>
                    <p className="text-lg font-bold text-gray-800">{subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Billing Cycle</p>
                    <p className="text-lg font-bold text-gray-800">{subscription?.plan?.billing_cycle ? subscription.plan.billing_cycle.charAt(0).toUpperCase() + subscription.plan.billing_cycle.slice(1) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Monthly Cost</p>
                    <p className="text-lg font-bold text-gray-800">$29.00</p>
                  </div>
                </div>
              </div>
              {/* Settings Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Auto-Renewal Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-6 h-6" style={{ color: '#f93712' }} />
                      <h3 className="text-lg font-bold" style={{ color: '#222' }}>Auto-Renewal</h3>
                    </div>
                    <Switch
                      id="auto-renew"
                      checked={autoRenew}
                      onCheckedChange={setAutoRenew}
                    />
                  </div>
                  <p className="text-sm text-gray-600">Your subscription will automatically renew each month. Disable to prevent renewal.</p>
                </div>
                {/* Payment Method Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition">
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="w-6 h-6" style={{ color: '#f93712' }} />
                    <h3 className="text-lg font-bold" style={{ color: '#222' }}>Payment Method</h3>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
                    <div>
                      <p className="font-semibold text-sm text-gray-800">•••• •••• •••• 4242</p>
                      <p className="text-xs text-gray-500">Expires 12/2026</p>
                    </div>
                    <Button style={{ background: '#f93712', color: '#fff', fontWeight: 600, fontSize: '0.9rem', borderRadius: '0.75rem' }} className="px-4 py-2 hover:opacity-90 transition">Update</Button>
                  </div>
                </div>
              </div>
            </div>
            {/* Footer Actions */}
            <div className="bg-white border-t border-gray-200 px-8 py-6 flex gap-3 justify-end sticky bottom-0">
              <Button
                style={{ background: '#f0f0f0', color: '#333', fontWeight: 600, fontSize: '1rem', borderRadius: '0.75rem' }}
                className="px-6 py-2 hover:bg-gray-200 transition"
                onClick={() => setShowManageDialog(false)}
              >
                Close
              </Button>
              <Button
                style={{ background: '#f93712', color: '#fff', fontWeight: 600, fontSize: '1rem', borderRadius: '0.75rem', boxShadow: '0 4px 12px 0 #f9371244' }}
                className="px-6 py-2 hover:opacity-90 transition"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel your subscription?')) {
                    alert('Subscription cancelled successfully');
                    setShowManageDialog(false);
                  }
                }}
              >
                Cancel Subscription
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-orange-100 p-0 flex flex-col">
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-orange-100 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create New Service</h2>
                <p className="text-gray-600 mt-1">Add a new service to your profile</p>
              </div>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">Service Title *</Label>
                <Input
                  placeholder="e.g., React Web Development"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">Description *</Label>
                <textarea
                  placeholder="Describe your service in detail..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border border-orange-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">Category</Label>
                <Input
                  placeholder="e.g., Development, Design, Marketing"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Starting Price ($) *</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 150"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="border-orange-200 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Delivery Time *</Label>
                  <Input
                    placeholder="e.g., 7 days"
                    value={formData.deliveryTime}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryTime: e.target.value })
                    }
                    className="border-orange-200 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">Tags (comma-separated)</Label>
                <Input
                  placeholder="e.g., React, TypeScript, Tailwind"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-orange-100 px-8 py-6 flex gap-3 justify-end sticky bottom-0">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="border-orange-200 text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateService}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Service'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Service Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-orange-100 p-0 flex flex-col">
            {/* Header */}
            <div className="bg-white px-8 py-6 border-b border-orange-100 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Service</h2>
                <p className="text-gray-600 mt-1">Update your service details</p>
              </div>
              <button
                onClick={() => setShowEditDialog(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">Service Title *</Label>
                <Input
                  placeholder="e.g., React Web Development"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">Description *</Label>
                <textarea
                  placeholder="Describe your service in detail..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border border-orange-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">Category</Label>
                <Input
                  placeholder="e.g., Development, Design, Marketing"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Starting Price ($) *</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 150"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="border-orange-200 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900">Delivery Time *</Label>
                  <Input
                    placeholder="e.g., 7 days"
                    value={formData.deliveryTime}
                    onChange={(e) =>
                      setFormData({ ...formData, deliveryTime: e.target.value })
                    }
                    className="border-orange-200 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">Tags (comma-separated)</Label>
                <Input
                  placeholder="e.g., React, TypeScript, Tailwind"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-orange-100 px-8 py-6 flex gap-3 justify-end sticky bottom-0">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="border-orange-200 text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditService}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Service'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Services Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                {loading ? "Loading..." : myServices.length === 0 ? "No Services Yet" : "My Services"}
              </h2>
              <p className="text-gray-600 mt-1">
                {loading 
                  ? "Fetching your services..."
                  : myServices.length === 0
                  ? "Create your first service to get started"
                  : `You have ${myServices.length} active service${myServices.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : myServices.length === 0 ? (
            <Card className="border-orange-100 shadow-sm hover:shadow-lg transition-all duration-200 bg-white rounded-xl">
              <CardContent className="p-12 text-center">
                <Code className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No services yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start by creating your first service to showcase your expertise
                </p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myServices.map((service) => {
                const Icon = getIconComponent(service.icon);
                return (
                  <Card
                    key={service.id}
                    className="group border border-orange-100 shadow-sm hover:shadow-lg transition-all duration-200 bg-white rounded-xl h-full flex flex-col overflow-hidden relative"
                  >
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-red-50 hover:bg-red-100 transition opacity-0 group-hover:opacity-100 z-10"
                      aria-label="Delete service"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>

                    <CardHeader className="p-6 pb-4 border-b border-orange-100 bg-white">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-7 h-7 text-orange-500" />
                        </div>
                      </div>
                      <CardTitle className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                        {service.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600 line-clamp-3">
                        {service.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>Remote</span>
                        <span className="mx-2">·</span>
                        <Clock className="w-3 h-3" />
                        <span>{service.delivery_time || 'TBD'}</span>
                      </div>

                      {service.tags && service.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {service.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md text-xs font-medium border border-orange-100"
                            >
                              {tag}
                            </span>
                          ))}
                          {service.tags.length > 3 && (
                            <span className="text-xs text-gray-400 pt-1">
                              +{service.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-orange-100">
                        <div>
                          <span className="text-2xl font-bold text-orange-600">
                            ${service.starting_price || 0}
                          </span>
                          <span className="text-xs text-gray-500 block">starting at</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-200 text-orange-700 hover:bg-orange-50 px-3"
                            onClick={() => openEditDialog(service)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            className="bg-orange-500 text-white hover:bg-orange-600 px-3"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </TalentLayout>
  );
};

export default TalentServices;