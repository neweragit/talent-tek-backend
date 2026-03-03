import { useState, useEffect } from "react";
import EmployerAdminLayout from "@/components/layouts/EmployerAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { CreditCard, Check, AlertCircle, Loader2, CheckCircle, Settings, Briefcase, TrendingUp, Package, Users } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: string[];
  max_job_posts: number | null;
  max_active_jobs: number | null;
  max_service_posts: number | null;
  max_active_services: number | null;
  max_users: number | null;
  is_featured: boolean;
  is_active: boolean;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
  plans: Plan;
}

export default function EmployerAdminPayment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [employerId, setEmployerId] = useState<string>("");
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get employer ID
      const { data: employerData, error: employerError } = await supabase
        .from('employers')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      if (employerError || !employerData) {
        console.error('Employer not found:', employerError);
        setLoading(false);
        return;
      }
      setEmployerId(employerData.id);
      // Load current subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select(`
          id,
          plan_id,
          status,
          started_at,
          expires_at,
          auto_renew,
          plans (
            id,
            name,
            display_name,
            description,
            price,
            billing_cycle,
            features,
            max_job_posts,
            max_users,
            is_featured
          )
        `)
        .eq('employer_id', employerData.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (subscriptionError) {
        console.error('Error loading subscription:', subscriptionError);
      } else if (subscriptionData) {
        setCurrentSubscription(subscriptionData as any);
      }
      // Load available plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('target_user_type', 'employer')
        .eq('is_active', true)
        .order('price', { ascending: true });
      if (plansError) {
        console.error('Error loading plans:', plansError);
      } else {
        // Convert features from object to array if needed
        const processedPlans = (plansData || []).map(plan => {
          let featuresArray: string[] = [];
          if (plan.features) {
            if (Array.isArray(plan.features)) {
              featuresArray = plan.features;
            } else if (typeof plan.features === 'object') {
              featuresArray = Object.entries(plan.features).map(([key, value]) => `${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}`);
            }
          }
          return { ...plan, features: featuresArray };
        });
        setAvailablePlans(processedPlans);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string, planName: string) => {
    if (!employerId) return;
    try {
      // In a real app, you'd handle payment processing here
      // For now, we'll just create/update the subscription
      if (currentSubscription) {
        // Update existing subscription
        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan_id: planId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentSubscription.id);
        if (error) throw error;
      } else {
        // Create new subscription
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            plan_id: planId,
            employer_id: employerId,
            status: 'active',
            expires_at: expiresAt.toISOString(),
            auto_renew: true,
          });
        if (error) throw error;
      }
      toast({
        title: "Plan Updated",
        description: `Successfully upgraded to ${planName} plan.`,
      });
      loadData();
    } catch (error: any) {
      console.error('Error upgrading plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upgrade plan.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'DZD') => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  if (loading) {
    return (
      <EmployerAdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </EmployerAdminLayout>
    );
  }

  const handleContactSupport = () => {
    toast({
      title: "Contact Support",
      description: "Opening support contact form...",
    });
  };

  return (
    <EmployerAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Payment & Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and billing information</p>
        </div>
        {/* Current Subscription */}
        <Card className="border-orange-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="w-6 h-6 text-primary" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {currentSubscription ? (
              <>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Plan</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currentSubscription.plans.display_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Monthly Cost</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(currentSubscription.plans.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Next Billing Date</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatDate(currentSubscription.expires_at)}
                    </p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Subscription Active</p>
                    <p className="text-sm text-green-700">
                      Your subscription is active and will {currentSubscription.auto_renew ? 'renew automatically' : 'expire on ' + formatDate(currentSubscription.expires_at)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-600 mb-4">You don't have an active subscription</p>
                <p className="text-sm text-gray-500">Choose a plan below to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Available Plans */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Plans</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePlans.length > 0 ? (
              availablePlans.map((plan) => {
                const isCurrentPlan = currentSubscription?.plan_id === plan.id;
                return (
                  <Card key={plan.id} className="border-orange-200 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{plan.display_name || plan.name}</CardTitle>
                          {plan.is_featured && (
                            <Badge className="bg-yellow-500">Featured</Badge>
                          )}
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
                        {isCurrentPlan && (
                          <Badge className="bg-green-600">Current Plan</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
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
                      {/* Action Button */}
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        disabled={isCurrentPlan}
                        onClick={() => handleUpgrade(plan.id, plan.display_name)}
                      >
                        {isCurrentPlan ? "Current Plan" : "Upgrade"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-600">
                No plans available at the moment
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <Card className="border-orange-200 shadow-sm bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Need help with billing?</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Our support team is available to assist you with any billing questions or concerns.
                </p>
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                  onClick={handleContactSupport}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </EmployerAdminLayout>
  );
}
