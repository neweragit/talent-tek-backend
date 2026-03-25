import { useState } from "react";
import RecruiterAdminLayout from "@/components/layouts/RecruiterAdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Check, 
  Calendar, 
  AlertCircle, 
  Download,
  Crown,
  Zap,
  Building,
  FileText,
  Plus,
  Edit3,
  Sparkles,
} from "lucide-react";

export default function EmployerAdminPayment() {
  const [currentPlan, setCurrentPlan] = useState("professional");
  const { toast } = useToast();

  const handleUpgrade = (planId: string, planName: string) => {
    setCurrentPlan(planId);
    toast({
      title: "Plan Updated",
      description: `Successfully upgraded to ${planName} plan.`,
    });
  };

  const handleUpdatePayment = () => {
    toast({
      title: "Payment Method",
      description: "Payment method update form will open here.",
    });
  };

  const handleAddPayment = () => {
    toast({
      title: "Add Payment Method",
      description: "Add new payment method form will open here.",
    });
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast({
      title: "Downloading Invoice",
      description: `Invoice ${invoiceId} is being downloaded.`,
    });
  };

  const handleContactSupport = () => {
    toast({
      title: "Contact Support",
      description: "Opening support contact form...",
    });
  };

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "15,000",
      currency: "DZD",
      period: "month",
      icon: Zap,
      features: [
        "Up to 3 recruiters",
        "10 job postings",
        "Basic analytics",
        "Email support",
        "Standard templates"
      ],
    },
    {
      id: "professional",
      name: "Professional",
      price: "35,000",
      currency: "DZD",
      period: "month",
      icon: Crown,
      features: [
        "Up to 10 recruiters",
        "Unlimited job postings",
        "Advanced analytics",
        "Priority support",
        "Custom templates",
        "Interview scheduling",
        "Talent acquisition tools"
      ],
      popular: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "75,000",
      currency: "DZD",
      period: "month",
      icon: Building,
      features: [
        "Unlimited recruiters",
        "Unlimited job postings",
        "Enterprise analytics",
        "24/7 dedicated support",
        "White-label solution",
        "API access",
        "Custom integrations",
        "Training & onboarding"
      ],
    }
  ];

  const invoices = [
    { id: "INV-2025-001", date: "Nov 1, 2025", amount: "35,000 DZD", status: "paid", plan: "Professional" },
    { id: "INV-2025-002", date: "Oct 1, 2025", amount: "35,000 DZD", status: "paid", plan: "Professional" },
    { id: "INV-2025-003", date: "Sep 1, 2025", amount: "35,000 DZD", status: "paid", plan: "Professional" },
    { id: "INV-2025-004", date: "Aug 1, 2025", amount: "15,000 DZD", status: "paid", plan: "Starter" },
  ];

  return (
    <RecruiterAdminLayout>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-12 sm:px-4 sm:py-20">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-orange-50 p-6 shadow-xl sm:p-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Subscription & Billing
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tighter leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Payment & Billing
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
              Control plans, payment methods, and invoice history from the same workspace.
            </p>
          </div>
        </section>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center shadow-lg">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Current Plan</p>
                <p className="text-2xl font-bold text-slate-900">Professional</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Monthly Cost</p>
                <p className="text-2xl font-bold text-slate-900">35,000 DZD</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-400 flex items-center justify-center shadow-lg">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Next Billing</p>
                <p className="text-2xl font-bold text-slate-900">Dec 1, 2025</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="mb-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-lg">
          <div className="flex items-center gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="font-bold text-orange-900">Subscription Active</p>
              <p className="text-sm text-orange-700">Your subscription is active and will renew automatically on December 1, 2025</p>
            </div>
          </div>
        </div>

        {/* Available Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`relative rounded-3xl border bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  plan.popular ? 'border-orange-400 border-2' : 'border-orange-100'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="rounded-full bg-orange-600 px-4 py-1 text-white shadow-lg">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <div className="text-center pt-4">
                  <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg ${
                    plan.popular 
                      ? 'bg-orange-600' 
                      : 'bg-orange-400'
                  }`}>
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="ml-2 text-orange-600">{plan.currency}/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-orange-600" />
                      </div>
                      <span className="text-sm text-orange-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full rounded-full shadow-lg ${
                    currentPlan === plan.id 
                        ? 'cursor-not-allowed bg-orange-100 text-orange-700' 
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                  disabled={currentPlan === plan.id}
                  onClick={() => handleUpgrade(plan.id, plan.name)}
                >
                  {currentPlan === plan.id ? "Current Plan" : "Upgrade Now"}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-lg sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-600" />
            Payment Method
          </h2>
          
          <div className="rounded-2xl bg-orange-50 p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center shadow-lg">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">CIB Bank Card</p>
                  <p className="text-sm text-orange-700">•••• •••• •••• 4532</p>
                  <p className="text-xs text-orange-600">Expires 12/26</p>
                </div>
              </div>
              <Button 
                className="gap-2 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700"
                onClick={handleUpdatePayment}
              >
                <Edit3 className="w-4 h-4" />
                Update
              </Button>
            </div>
          </div>

          <Button 
            className="mt-4 gap-2 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700"
            onClick={handleAddPayment}
          >
            <Plus className="w-4 h-4" />
            Add New Payment Method
          </Button>
        </div>

        {/* Billing History */}
        <div className="mb-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-lg sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Billing History
          </h2>
          
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div 
                key={invoice.id} 
                className="flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl hover:bg-orange-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{invoice.id}</p>
                    <p className="text-sm text-orange-700">{invoice.date} • {invoice.plan}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{invoice.amount}</p>
                    <Badge className="border border-orange-200 bg-orange-100 text-orange-700">
                      {invoice.status}
                    </Badge>
                  </div>
                  <Button 
                    size="icon"
                    variant="ghost"
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={() => handleDownloadInvoice(invoice.id)}
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-lg sm:p-8">
          <div className="flex items-start gap-4 p-5 bg-orange-50 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">Need help with billing?</h3>
              <p className="mb-4 text-sm text-orange-700">
                Our support team is available to assist you with any billing questions or concerns.
              </p>
              <Button 
                className="gap-2 rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700"
                onClick={handleContactSupport}
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </RecruiterAdminLayout>
  );
}
