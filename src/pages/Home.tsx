import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";
import { Briefcase, Users, Zap, Globe, Shield, TrendingUp, Rocket, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Home = () => {
  const { user } = useAuth();

  const getRoleSpace = (role: string) => {
    switch (role) {
      case "talent":
        return { path: "/talent/overview", label: "Talent Space", icon: Users };
      case "recruiter":
        return { path: "/recruiter/overview", label: "Recruiter Space", icon: Briefcase };
      case "superadmin":
        return { path: "/recruiter-admin/overview", label: "Company Admin Space", icon: Briefcase };
      case "owner":
        return { path: "/owner/dashboard", label: "Owner Space", icon: Briefcase };
      case "technical-interviewer":
        return { path: "/technical-interviewer/overview", label: "Technical Interviewer Space", icon: Briefcase };
      case "leadership-interviewer":
        return { path: "/leadership-interviewer/overview", label: "Leadership Interviewer Space", icon: Briefcase };
      default:
        return { path: "/", label: "Dashboard", icon: Briefcase };
    }
  };

  const roleSpace = user ? getRoleSpace(user.role) : null;

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Matching",
      description: "Smart algorithms connect the right talent with the right opportunities instantly.",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Access talent from around the world or find opportunities across borders.",
    },
    {
      icon: Shield,
      title: "Verified Profiles",
      description: "Trust and transparency with verified recruiters and talent profiles.",
    },
    {
      icon: TrendingUp,
      title: "Career Growth",
      description: "Tools and resources to help talents and companies grow together.",
    },
  ];

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen relative bg-gradient-hero">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 overflow-hidden flex items-center min-h-[80vh] sm:min-h-[90vh]">
        {/* Floating accents */}
        <div className="accent-bg">
          <span className="accent-circle w-[220px] h-[220px] top-10 left-10 animate-float" />
          <span className="accent-circle w-[180px] h-[180px] bottom-14 left-1/3 animate-float" />
          <span className="accent-circle w-[140px] h-[140px] top-1/3 right-8 animate-float" />
          <span className="accent-circle w-[100px] h-[100px] bottom-24 right-24 animate-float" />
          <span className="accent-circle w-[90px] h-[90px] top-24 left-1/2 animate-float" />
          <span className="accent-circle w-[70px] h-[70px] bottom-10 left-10 animate-float" />
          <span className="accent-circle w-[60px] h-[60px] top-12 right-1/3 animate-float" />
        </div>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 relative z-10">
          <div className="grid grid-cols-1 gap-6 lg:gap-12 place-items-center">
            <div className={`text-center space-y-6 mt-8 sm:mt-12 transition-all duration-[1500ms] ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" aria-hidden="true" />
                <span className="text-orange-500 text-sm font-medium">Raniah Sahnoune</span>
              </div>

              {/* Title */}
              <h1 className="text-5xl sm:text-6xl md:text-9xl font-bold tracking-tighter">
                <span className="inline-block text-orange-600">TalenTek</span>
              </h1>

              {/* Separator with rocket */}
              <div className="flex items-center justify-center gap-3" aria-hidden="true">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-orange-500" />
                <Rocket className="w-8 h-8 text-orange-500 animate-bounce" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-orange-500" />
              </div>

              {/* Subtitle and lead */}
              <div className="space-y-3 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900">Identify top tech talent, without the guesswork.</h2>
                <p className="text-lg md:text-xl text-gray-600">
                  The platform that combines rigorous technical testing with seamless candidate tracking for demanding tech teams.
                </p>
              </div>

              {/* CTAs */}
              <div className="pt-4 flex flex-row gap-4 justify-center items-center">
                {user ? (
                  roleSpace && (
                    <Link
                      to={roleSpace.path}
                      className="group inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-lg text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50"
                    >
                      <roleSpace.icon className="w-5 h-5 transition-transform group-hover:rotate-12" aria-hidden="true" />
                      Go to {roleSpace.label}
                    </Link>
                  )
                ) : (
                  <>
                    <Link
                      to="/get-started"
                      className="group inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-lg text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50"
                      aria-label="Hire with Talentek"
                    >
                      <Briefcase className="w-5 h-5 transition-transform group-hover:rotate-12" aria-hidden="true" />
                      Hire with Talentek
                    </Link>
                    <Link
                      to="/signup/talent"
                      className="group inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-lg text-white bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-slate-500/50"
                      aria-label="Join as a Talent"
                    >
                      <Users className="w-5 h-5 transition-transform group-hover:rotate-12" aria-hidden="true" />
                      Join as a Talent
                    </Link>
                  </>
                )}
              </div>

              {/* Pulsing dots removed as requested */}
            </div>
          </div>
          {/* Bottom accent line removed as requested */}
        </div>
      </section>

      {/* For Employer & Talents Section */}
      <section className="py-8 sm:py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="rounded-lg sm:rounded-2xl border-2 border-orange-200 bg-white p-6 transition-all duration-300 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-100">
              <Briefcase className="w-12 h-12 text-orange-600 mb-4" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Company Space</h2>
              <p className="text-sm sm:text-base leading-relaxed text-gray-700 mb-6">
                Post jobs, run technical and leadership evaluations, and track your entire hiring pipeline in one place.
              </p>
              <Button asChild variant="outline" className="rounded-full px-8 py-4">
                <Link to="/for-company">Learn More</Link>
              </Button>
            </div>

            <div className="rounded-lg sm:rounded-2xl border-2 border-orange-200 bg-white p-6 transition-all duration-300 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-100">
              <Users className="w-12 h-12 text-orange-600 mb-4" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Talent Space</h2>
              <p className="text-sm sm:text-base leading-relaxed text-gray-700 mb-6">
                Validate your tech skills, apply to top companies, and track every application — all in one dashboard.
              </p>
              <Button asChild variant="outline" className="rounded-full px-8 py-4">
                <Link to="/for-talents">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-sm sm:text-base leading-relaxed text-gray-700 max-w-2xl mx-auto">
              From posting your first Tech hiring campaign to making a confident hire — in three steps.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: "1", title: "Publish", description: "Post your tech hiring campaign and define the skills you need" },
              { step: "2", title: "Evaluate", description: "Run rigorous developer assessments and technical interviews" },
              { step: "3", title: "Hire", description: "Select top-scoring candidates with confidence and speed" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-primary text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 animate-pulse-scale">
                  {item.step}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm sm:text-base leading-relaxed text-gray-700">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 sm:py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Why Choose TalenTek</h2>
            <p className="text-sm sm:text-base leading-relaxed text-gray-700 max-w-2xl mx-auto">
              Built for tech teams that take Developer assessment seriously — not just resume screening.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="bg-gradient-primary rounded-3xl p-12 text-center text-white">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Ready to build your dream tech team?</h2>
            <p className="text-sm sm:text-base leading-relaxed mb-0 opacity-90">
              Join companies already using Talentek for smarter Tech hiring and Developer assessment.
            </p>
          </div>
          <div className="text-center mt-6 sm:mt-8">
            <Button
              size="lg"
              asChild
              className="rounded-full px-8 py-4"
            >
              <Link to="/get-started">Create Your Account</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
