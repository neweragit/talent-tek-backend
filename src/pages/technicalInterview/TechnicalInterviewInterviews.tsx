import TechnicalInterviewLayout from "@/components/layouts/technicalInterview/TechnicalInterviewLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Clock, Calendar, User, Search, Code, Users, CheckCircle } from "lucide-react";
import { useState } from "react";

const TechnicalInterviewInterviews = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const interviews = [
    {
      id: 1,
      candidateName: "Alex Chen",
      position: "Senior Backend Engineer",
      date: "2025-11-20",
      time: "10:00 AM",
      status: "Pending Review",
      meetLink: "https://meet.google.com/abc-defg-hij",
      type: "Technical",
      focus: "System Design & Algorithms"
    },
    {
      id: 2,
      candidateName: "Sarah Miller",
      position: "Full Stack Developer",
      date: "2025-11-21",
      time: "2:00 PM",
      status: "Completed",
      meetLink: "https://meet.google.com/xyz-qrst-uvw",
      type: "Technical",
      focus: "Data Structures & Coding"
    },
    {
      id: 3,
      candidateName: "David Park",
      position: "Frontend Engineer",
      date: "2025-11-22",
      time: "11:30 AM",
      status: "Upcoming",
      meetLink: "https://meet.google.com/lmn-opqr-stu",
      type: "Technical",
      focus: "Problem Solving & Architecture"
    },
    {
      id: 4,
      candidateName: "Emma Wilson",
      position: "DevOps Engineer",
      date: "2025-11-23",
      time: "3:00 PM",
      status: "Upcoming",
      meetLink: "https://meet.google.com/abc-xyz-123",
      type: "Technical",
      focus: "Cloud & Infrastructure"
    },
  ];

  const filteredInterviews = interviews.filter(interview =>
    interview.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    interview.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: interviews.length,
    upcoming: interviews.filter(i => i.status === "Upcoming").length,
    pendingReview: interviews.filter(i => i.status === "Pending Review").length,
    completed: interviews.filter(i => i.status === "Completed").length,
  };

  return (
    <TechnicalInterviewLayout>
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-12 sm:py-20">
        {/* Header */}
        <div className="mb-10">
          <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 backdrop-blur-sm px-4 py-1 text-orange-600 font-semibold text-sm mb-4">
            TalenTek Technical Interviewer
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight text-slate-900 mb-4">
            Interviews
          </h1>
          <p className="text-lg font-semibold text-gray-700 leading-relaxed">
            Assess coding skills, algorithms, and system design
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-3xl border border-orange-100 shadow-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center shadow-lg">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-orange-100 shadow-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Upcoming</p>
                <p className="text-2xl font-bold text-slate-900">{stats.upcoming}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-orange-100 shadow-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending</p>
                <p className="text-2xl font-bold text-slate-900">{stats.pendingReview}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-orange-100 shadow-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Completed</p>
                <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-400" />
            <Input
              placeholder="Search by candidate or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white border-orange-200 focus:border-orange-400 focus:ring-orange-400 rounded-full h-12"
            />
          </div>
        </div>

        {/* Interview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredInterviews.map((interview) => (
            <div 
              key={interview.id}
              className="bg-white rounded-3xl border border-orange-100 shadow-xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center shadow-lg text-white font-bold text-lg">
                    {interview.candidateName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{interview.candidateName}</h3>
                    <p className="text-sm text-gray-600">{interview.position}</p>
                  </div>
                </div>
                <Badge className={`${
                  interview.status === 'Completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                  interview.status === 'Pending Review' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                  'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {interview.status}
                </Badge>
              </div>

              {/* Info Section */}
              <div className="bg-orange-50/50 rounded-2xl p-4 mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    Date
                  </span>
                  <span className="font-semibold text-slate-900">{interview.date}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                    Time
                  </span>
                  <span className="font-semibold text-slate-900">{interview.time}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Code className="w-4 h-4 text-orange-400" />
                    Focus
                  </span>
                  <span className="font-semibold text-slate-900">{interview.focus}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button 
                  className="flex-1 gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-lg"
                  asChild
                >
                  <a href={interview.meetLink} target="_blank" rel="noopener noreferrer">
                    <Video className="w-4 h-4" />
                    Join Meeting
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredInterviews.length === 0 && (
          <div className="bg-white rounded-3xl border border-orange-100 shadow-xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Search className="w-8 h-8 text-white" />
            </div>
            <p className="text-lg font-bold text-slate-900">No interviews found</p>
            <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </TechnicalInterviewLayout>
  );
};

export default TechnicalInterviewInterviews;
