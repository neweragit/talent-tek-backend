import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";
import { Briefcase, Target, Calendar, BarChart, Users2, Sparkles } from "lucide-react";

const ForEmployers = () => {
  const features = [
    {
      icon: Target,
      title: "AI Talent Matching",
      description: "Advanced algorithms find candidates that perfectly match your requirements.",
    },
    {
      icon: Calendar,
      title: "Interview Scheduling",
      description: "Streamlined scheduling tools that work across time zones.",
    },
    {
      icon: BarChart,
      title: "Analytics Dashboard",
      description: "Track hiring metrics and optimize your recruitment process.",
    },
    {
      icon: Users2,
      title: "Talent Pool Access",
      description: "Browse and connect with millions of verified professionals worldwide.",
    },
    {
      icon: Sparkles,
      title: "Smart Job Posting",
      description: "AI-optimized job descriptions that attract top candidates.",
    },
    {
      icon: Briefcase,
      title: "Onboarding Tools",
      description: "Seamless onboarding experience for new hires.",
    },
  ];

  const successStories = [
    { company: "TechCorp", hired: 50, time: "40% faster" },
    { company: "StartupXYZ", hired: 25, time: "30 days" },
    { company: "GlobalInc", hired: 100, time: "50% cost reduction" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50">
      <Navbar />

      {/* Hero Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-orange-100 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex flex-col items-center justify-center text-center mb-8 mt-8 sm:mt-12 md:mt-16 lg:mt-20">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-tight mb-4 text-slate-900">
              Hire Global Talent with <span className="text-orange-600">Confidence</span>
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-orange-600 max-w-2xl mx-auto mb-8">
              Access AI-powered tools to find, interview, and onboard the best candidates from around the world, faster than ever.
            </p>
            <Button asChild className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4 transition-all duration-300 hover:from-orange-500 hover:to-orange-400 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50">
              <Link to="/signup/company">Create Company Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Powerful Hiring Tools</h2>
            <p className="text-sm sm:text-base leading-relaxed text-gray-700 max-w-2xl mx-auto">
              Everything you need to build your dream team
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-8 sm:py-12 bg-orange-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">How Matching Works</h2>
            <p className="text-sm sm:text-base leading-relaxed text-gray-700 max-w-2xl mx-auto">
              Our AI-powered platform makes hiring efficient and accurate
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {[
              { step: "1", title: "Post Your Job", description: "Create detailed job postings with our AI assistant" },
              { step: "2", title: "AI Matching", description: "Our system finds the best candidates automatically" },
              { step: "3", title: "Review & Interview", description: "Schedule interviews with top-matched talent" },
              { step: "4", title: "Hire & Onboard", description: "Seamlessly onboard your new team member" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                  <span>{item.step}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold mb-2 text-slate-900">{item.title}</h3>
                <p className="text-xs font-medium text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Success Stories</h2>
            <p className="text-sm sm:text-base leading-relaxed text-gray-700 max-w-2xl mx-auto">
              See how companies are transforming their hiring with TalenTek
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {successStories.map((story) => (
              <div key={story.company} className="rounded-lg sm:rounded-2xl border-2 border-orange-200 bg-white transition-all duration-300 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-100 p-6 text-center">
                <h3 className="text-base sm:text-lg font-bold mb-2 text-slate-900">{story.company}</h3>
                <p className="text-4xl font-bold text-orange-600 mb-2">{story.hired}</p>
                <p className="text-xs font-medium text-gray-600 mb-4">Hires in {story.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-3xl p-12 text-center text-white">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Start Hiring Today</h2>
            <p className="text-sm sm:text-base leading-relaxed mb-0 opacity-90">
              Join leading companies building exceptional teams with TalenTek
            </p>
          </div>
          <div className="text-center mt-6 sm:mt-8">
            <Button asChild className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4 shadow-xl hover:from-orange-500 hover:to-orange-400 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300">
              <Link to="/get-started" className="text-white hover:text-white">Create Employer Account</Link>
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ForEmployers;
