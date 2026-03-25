
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";
import { Rocket, Star, Shield, TrendingUp, FileText, Globe2 } from "lucide-react";


const ForTalents = () => {
  const features = [
    {
      icon: Star,
      title: "Smart Matching",
      description: "Get matched with jobs that truly fit your skills and career goals.",
    },
    {
      icon: Shield,
      title: "Verified Employers",
      description: "Apply only to verified companies with transparent hiring processes.",
    },
    {
      icon: TrendingUp,
      title: "Career Insights",
      description: "Access data-driven insights to advance your career strategically.",
    },
    {
      icon: FileText,
      title: "AI Resume Optimizer",
      description: "Optimize your profile and resume with AI-powered suggestions.",
    },
    {
      icon: Globe2,
      title: "Global Opportunities",
      description: "Access remote and international job opportunities worldwide.",
    },
    {
      icon: Rocket,
      title: "Fast Applications",
      description: "Apply to multiple jobs quickly with your saved profile.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="py-12 sm:py-20 bg-gradient-to-br from-orange-100 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex flex-col items-center justify-center text-center mb-8 mt-8 sm:mt-12 md:mt-16 lg:mt-20">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-tight mb-4 text-slate-900">
              Find Your Dream Job, <span className="text-orange-600">Globally</span>
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-orange-600 max-w-2xl mx-auto mb-8">
              Get matched with verified employers, showcase your unique skills, and land opportunities that accelerate your career growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="rounded-full border-2 border-orange-500 bg-white text-white font-bold px-8 py-4 hover:bg-orange-50 transition-all duration-300">
                <Link to="/signup/talent" className="text-white hover:text-white">Create Talent Profile</Link>
              </Button>
              <Button asChild className="rounded-full border-2 border-orange-500 bg-white text-white font-bold px-8 py-4 hover:bg-orange-50 transition-all duration-300">
                <Link to="/pricing" className="text-white hover:text-white">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Why Talents Choose Us</h2>
            <p className="text-sm sm:text-base leading-relaxed text-gray-700 max-w-2xl mx-auto">
              Tools and features designed to help you succeed
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Your Journey to Success</h2>
            <p className="text-sm sm:text-base leading-relaxed text-gray-700 max-w-2xl mx-auto">
              Four simple steps to your dream career
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {[
              { step: "1", title: "Create Profile", description: "Build a compelling profile highlighting your skills" },
              { step: "2", title: "Get Matched", description: "Our AI finds perfect job opportunities for you" },
              { step: "3", title: "Apply & Interview", description: "Connect with employers and showcase your talent" },
              { step: "4", title: "Start Your Dream Job", description: "Land the role and advance your career" },
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

      {/* Benefits Section */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Stand Out From the Crowd</h2>
            <p className="text-sm sm:text-base leading-relaxed text-gray-700 max-w-2xl mx-auto">
              Get noticed by top employers with our talent platform
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "Skill-Based Ranking",
                description: "Your experience and skills determine your matches, not just keywords.",
                stat: "95% Match Rate",
              },
              {
                title: "Direct Communication",
                description: "Message employers directly and build relationships before applying.",
                stat: "50% Faster Response",
              },
              {
                title: "Career Resources",
                description: "Access interview tips, salary guides, and career development content.",
                stat: "1000+ Resources",
              },
            ].map((benefit) => (
              <div key={benefit.title} className="rounded-lg sm:rounded-2xl border-2 border-orange-200 bg-white transition-all duration-300 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-100 p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{benefit.stat}</div>
                <h3 className="text-base sm:text-lg font-bold mb-3 text-slate-900">{benefit.title}</h3>
                <p className="text-xs font-medium text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-8 sm:py-12 bg-orange-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">Success Stories</h2>
            <p className="text-sm sm:text-base leading-relaxed text-gray-700 max-w-2xl mx-auto">
              Hear from talents who found their dream jobs
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                name: "Sarah M.",
                role: "Software Engineer",
                quote: "Found my dream remote job in 2 weeks. The matching was incredibly accurate!",
              },
              {
                name: "James L.",
                role: "Product Designer",
                quote: "TalenTek helped me transition from freelance to a full-time role at a top company.",
              },
              {
                name: "Maria K.",
                role: "Data Scientist",
                quote: "The AI matching really works. Got multiple interviews with companies I actually wanted to work for.",
              },
            ].map((testimonial) => (
              <div key={testimonial.name} className="rounded-lg sm:rounded-2xl border-2 border-orange-200 bg-white transition-all duration-300 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-100 p-6">
                <p className="text-xs font-medium text-gray-600 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold text-base sm:text-lg text-slate-900">{testimonial.name}</p>
                  <p className="text-xs font-medium text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-3xl p-12 text-center text-white">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Ready to Launch Your Career?</h2>
            <p className="text-sm sm:text-base leading-relaxed mb-0 opacity-90">
              Join thousands of professionals who found their dream jobs on TalenTek
            </p>
          </div>
          <div className="text-center mt-6 sm:mt-8">
            <Button asChild className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4 shadow-xl hover:from-orange-500 hover:to-orange-400 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300">
              <Link to="/get-started" className="text-white hover:text-white">Create Your Profile</Link>
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default ForTalents;
