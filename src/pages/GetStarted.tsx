import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Briefcase, UserCircle } from "lucide-react";

const GetStarted = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-100 via-white to-orange-50">
      <Navbar />
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-4 pt-32 pb-12 flex flex-col items-center justify-center">
          <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4">
                Get Started — Choose Your <span className="text-orange-600">Account Type</span>
              </h1>
              <p className="text-xl text-gray-700">
                Select how you'd like to use TalenTek
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Talent Card */}
              <Card className="rounded-[28px] border-2 border-orange-500 bg-white shadow-2xl transition-all duration-300 overflow-hidden hover:shadow-orange-100">
                <CardHeader className="text-center p-8 pb-2 bg-white">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center mx-auto mb-4">
                    <UserCircle className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900">Sign Up as Talent</CardTitle>
                  <CardDescription className="text-base text-gray-700">
                    Looking for opportunities? Create your talent profile and connect with leading companies.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-8">
                  <ul className="space-y-3 mb-6">
                    {[
                      "Build your professional profile",
                      "Get matched with dream jobs",
                      "Access global opportunities",
                      "Apply with one click",
                      "Track your applications",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-2 shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup/talent" className="w-full">
                    <Button className="w-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4 transition-all duration-300 hover:from-orange-500 hover:to-orange-400 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 text-base">
                      Create Talent Account
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              {/* Employer Card */}
              <Card className="rounded-[28px] border-2 border-orange-500 bg-white shadow-2xl transition-all duration-300 overflow-hidden hover:shadow-orange-100">
                <CardHeader className="text-center p-8 pb-2 bg-white">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900">Sign Up as Employer</CardTitle>
                  <CardDescription className="text-base text-gray-700">
                    Hiring top talent? Create your employer account and access our global talent pool.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-8">
                  <ul className="space-y-3 mb-6">
                    {[
                      "Post unlimited job listings",
                      "AI-powered candidate matching",
                      "Schedule and manage interviews",
                      "Access verified talent profiles",
                      "Analytics and insights dashboard",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-2 shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup/company" className="w-full">
                    <Button className="w-full rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4 transition-all duration-300 hover:from-orange-500 hover:to-orange-400 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 text-base">
                      Create Employer Account
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
            <p className="text-center text-gray-600 mt-8">
              Already have an account?{" "}
              <Link to="/login" className="text-orange-600 hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GetStarted;
