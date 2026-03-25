import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingCard from "@/components/PricingCard";

const Pricing = () => {
  const pricingPlans = [
    {
      title: "Free",
      price: "$0",
      description: "Perfect for getting started",
      features: [
        "Create talent or employer profile",
        "Basic job matching",
        "Up to 5 applications/postings per month",
        "Support Ticket access",
        "Access to community resources",
      ],
    },
    {
      title: "Pro",
      price: "$49",
      description: "For serious job seekers and growing companies",
      features: [
        "Everything in Free",
        "Advanced AI matching",
        "Unlimited applications/postings",
        "Priority Support Ticket access",
        "Analytics dashboard",
        "Interview scheduling tools",
        "Resume optimization",
        "Featured profile/listings",
      ],
      popular: true,
    },
    {
      title: "Enterprise",
      price: "Custom",
      description: "For large organizations with unique needs",
      features: [
        "Everything in Pro",
        "Dedicated account manager",
        "Custom integrations",
        "API access",
        "Advanced analytics & reporting",
        "Custom branding",
        "SLA guarantees",
        "Onboarding & training",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50">
      <Navbar />

      {/* Hero Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-orange-100 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex flex-col items-center justify-center text-center mb-8 mt-8 sm:mt-12 md:mt-16 lg:mt-20">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-tight mb-4 text-slate-900">
              Simple, Transparent <span className="text-orange-600">Pricing</span>
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-orange-600 max-w-2xl mx-auto mb-8">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.title} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-8 sm:py-12 bg-orange-50">
        <div className="max-w-5xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Compare Plans</h2>
            <p className="text-sm sm:text-base leading-relaxed text-gray-700">
              See what's included in each plan
            </p>
          </div>
          <div className="rounded-2xl border-2 border-orange-200 bg-white p-8 overflow-x-auto transition-all duration-300 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-100">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-orange-100">
                  <th className="text-left py-4 px-4">Feature</th>
                  <th className="text-center py-4 px-4">Free</th>
                  <th className="text-center py-4 px-4">Pro</th>
                  <th className="text-center py-4 px-4">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {[
                  { feature: "Profile/Listing Creation", free: "✓", pro: "✓", enterprise: "✓" },
                  { feature: "AI Matching", free: "Basic", pro: "Advanced", enterprise: "Advanced" },
                  { feature: "Applications/Postings", free: "5/month", pro: "Unlimited", enterprise: "Unlimited" },
                  { feature: "Analytics", free: "—", pro: "✓", enterprise: "Advanced" },
                  { feature: "Priority Support Ticket access", free: "—", pro: "✓", enterprise: "✓" },
                  { feature: "API Access", free: "—", pro: "—", enterprise: "✓" },
                ].map((row) => (
                  <tr key={row.feature}>
                    <td className="py-4 px-4 font-medium text-xs sm:text-sm text-gray-700">{row.feature}</td>
                    <td className="py-4 px-4 text-center text-xs sm:text-sm text-gray-600">{row.free}</td>
                    <td className="py-4 px-4 text-center text-xs sm:text-sm text-gray-700">{row.pro}</td>
                    <td className="py-4 px-4 text-center text-xs sm:text-sm text-gray-700">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-3 sm:px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-12 text-center text-slate-900">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "Can I switch plans anytime?",
                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
              },
              {
                q: "Is there a free trial for Pro?",
                a: "We offer a 14-day free trial of Pro features. No credit card required.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.",
              },
              {
                q: "Do you offer discounts for annual billing?",
                a: "Yes! Save 20% when you choose annual billing on Pro or Enterprise plans.",
              },
            ].map((faq, i) => (
              <div key={i} className="rounded-lg sm:rounded-2xl border-2 border-orange-200 bg-white transition-all duration-300 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-100 p-6">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-slate-900">{faq.q}</h3>
                <p className="text-xs font-medium text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
