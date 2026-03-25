import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Briefcase, Users, Star, Share2, Bookmark, Filter, ChevronRight, Award, Globe, Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Job {
	id: string;
	title: string;
	company_name: string;
	description: string;
	location: string;
	employment_type: string;
	industry: string;
	skills_required: string[];
	what_you_will_do?: string[];
	requirements?: string[];
	positions_available?: number;
	posted_at?: string;
	logo_url?: string;
}

const Jobs = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [jobs, setJobs] = useState<Job[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedIndustry, setSelectedIndustry] = useState("all");
	const [selectedLevel, setSelectedLevel] = useState("all");
	const [selectedType, setSelectedType] = useState("all");
	const [viewCounts, setViewCounts] = useState<Record<string, number>>({});


	useEffect(() => {
		const fetchJobs = async () => {
			try {
				setLoading(true);
				const { data, error } = await supabase
					.from('jobs')
					.select(`
						id,
						title,
						description,
						location,
						employment_type,
						skills_required,
						what_you_will_do,
						requirements,
						positions_available,
						created_at,
						views_count,
						employers (
							company_name,
							industry,
							logo_url
						)
					`)
					.order('created_at', { ascending: false });

				if (error) throw error;

				const formattedJobs: Job[] = (data || []).map((job: any) => ({
					id: job.id,
					title: job.title || 'Untitled Position',
					company_name: job.employers?.company_name || 'Unknown Company',
					description: job.description || '',
					location: job.location || 'Not specified',
					employment_type: job.employment_type || 'Full-Time',
					industry: job.employers?.industry || '',
					skills_required: job.skills_required || [],
					what_you_will_do: job.what_you_will_do || [],
					requirements: job.requirements || [],
					positions_available: job.positions_available || 1,
					posted_at: job.created_at,
					logo_url: job.employers?.logo_url || '',
				}));

				setJobs(formattedJobs);
				
				// Initialize view counts from database
				const counts: Record<string, number> = {};
				data?.forEach((job: any) => {
					counts[job.id] = job.views_count || 0;
				});
				setViewCounts(counts);
			} catch (error) {
				console.error('Error fetching jobs:', error);
				setJobs([]);
			} finally {
				setLoading(false);
			}
		};

		fetchJobs();
	}, []);

	const handleViewDetails = async (job: Job) => {
		// Increment view count
		const newCount = (viewCounts[job.id] || 0) + 1;
		setViewCounts(prev => ({ ...prev, [job.id]: newCount }));
		
		// Update view count in database
		try {
			await supabase
				.from('jobs')
				.update({ views_count: newCount })
				.eq('id', job.id);
		} catch (error) {
			console.error('Error updating view count:', error);
		}
		
		navigate(`/jobs/${job.id}`);
	};

	const handleShare = (job: Job, e: React.MouseEvent) => {
		e.stopPropagation();
		const jobUrl = `${window.location.origin}/jobs/${job.id}`;
		
		if (navigator.share) {
			navigator.share({
				title: job.title,
				text: `Check out this job: ${job.title} at ${job.company_name}`,
				url: jobUrl,
			}).catch(err => console.log('Share failed:', err));
		} else {
			// Fallback: copy to clipboard
			navigator.clipboard.writeText(jobUrl);
			alert('Job link copied to clipboard!');
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50">
			<Navbar />
			{/* Hero Section */}
			<div className="bg-gradient-to-br from-orange-100 via-white to-orange-50 py-12 sm:py-20">
				<div className="max-w-7xl mx-auto px-3 sm:px-4">
					<div className="flex flex-col items-center justify-center text-center mb-8 mt-8 sm:mt-12 md:mt-16 lg:mt-20">
						<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-tight mb-4 text-slate-900">
							Find Your Next Job
						</h1>
						<p className="text-sm sm:text-base leading-relaxed text-orange-600 max-w-2xl mx-auto">
							Discover top opportunities and connect with leading employers for your next career move
						</p>
					</div>
					{/* Search Bar */}
					<div className="flex justify-center w-full">
						<div className="w-full max-w-2xl md:max-w-3xl lg:max-w-4xl bg-white rounded-2xl p-6 shadow-xl border-2 border-orange-100 flex items-center gap-4">
							<div className="flex-1 relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
								<Input
									placeholder="Search for job titles, skills, or keywords..."
									className="pl-10 h-12 text-sm sm:text-base border-0 focus:ring-2 focus:ring-orange-500"
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
								/>
							</div>
							<button className="h-12 px-8 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold transition-all duration-300 hover:from-orange-500 hover:to-orange-400 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50">
								Search
							</button>
						</div>
					</div>
				</div>
			</div>
			<div className="pt-20">
				<div className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
					<div className="flex gap-6 sm:gap-8">
						{/* Sidebar Filters */}
						<aside className="w-80 bg-white rounded-2xl shadow-sm p-6 h-fit sticky top-24 border-2 border-orange-100">
							<div className="flex items-center gap-2 mb-6">
								<Filter className="w-5 h-5 text-orange-600" />
								<h3 className="text-base sm:text-lg font-bold">Filters</h3>
							</div>
							{/* Location */}
							<div className="mb-6">
								<h4 className="font-bold mb-3 text-sm">Location</h4>
								<Input
									className="rounded-full border-2 border-orange-100 px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500"
									placeholder="e.g. Algiers, Algeria"
								/>
							</div>
							{/* Job Type */}
							<div className="mb-6">
								<h4 className="font-bold mb-3 text-sm">Job Type</h4>
								<div className="space-y-2">
									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 ${selectedType === "all" ? 'bg-orange-100 border-orange-500' : 'border-transparent'} border-2`}>
										<input type="radio" name="type" value="all" checked={selectedType === "all"} onChange={() => setSelectedType("all") } className="hidden" />
										<span className="text-xs sm:text-sm font-medium">All Types</span>
									</label>
									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 ${selectedType === "Full-Time" ? 'bg-orange-100 border-orange-500' : 'border-transparent'} border-2`}>
										<input type="radio" name="type" value="Full-Time" checked={selectedType === "Full-Time"} onChange={() => setSelectedType("Full-Time") } className="hidden" />
										<span className="text-xs sm:text-sm font-medium">Full-Time</span>
									</label>
									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 border-2 border-transparent`}>
										<input type="radio" name="type" value="Part-Time" checked={selectedType === "Part-Time"} onChange={() => setSelectedType("Part-Time") } className="hidden" />
										<span className="text-xs sm:text-sm font-medium">Part-Time</span>
									</label>
									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 border-2 border-transparent`}>
										<input type="radio" name="type" value="Contract" checked={selectedType === "Contract"} onChange={() => setSelectedType("Contract") } className="hidden" />
										<span className="text-xs sm:text-sm font-medium">Contract</span>
									</label>
								</div>
							</div>
							{/* Experience Level */}
							<div className="mb-6">
								<h4 className="font-bold mb-3 text-sm">Experience Level</h4>
								<div className="space-y-2">
									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 ${selectedLevel === "all" ? 'bg-orange-100 border-orange-500' : 'border-transparent'} border-2`}>
										<input type="radio" name="level" value="all" checked={selectedLevel === "all"} onChange={() => setSelectedLevel("all") } className="hidden" />
										<span className="text-xs sm:text-sm font-medium">All Levels</span>
									</label>
									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 ${selectedLevel === "Entry Level" ? 'bg-orange-100 border-orange-500' : 'border-transparent'} border-2`}>
										<input type="radio" name="level" value="Entry Level" checked={selectedLevel === "Entry Level"} onChange={() => setSelectedLevel("Entry Level") } className="hidden" />
										<span className="text-xs sm:text-sm font-medium">Entry Level</span>
									</label>
									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 ${selectedLevel === "Mid Level" ? 'bg-orange-100 border-orange-500' : 'border-transparent'} border-2`}>
										<input type="radio" name="level" value="Mid Level" checked={selectedLevel === "Mid Level"} onChange={() => setSelectedLevel("Mid Level") } className="hidden" />
										<span className="text-xs sm:text-sm font-medium">Mid Level</span>
									</label>
									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 ${selectedLevel === "Senior Level" ? 'bg-orange-100 border-orange-500' : 'border-transparent'} border-2`}>
										<input type="radio" name="level" value="Senior Level" checked={selectedLevel === "Senior Level"} onChange={() => setSelectedLevel("Senior Level") } className="hidden" />
										<span className="text-xs sm:text-sm font-medium">Senior Level</span>
									</label>
								</div>
							</div>
							{/* Industry */}
							<div className="mb-6">
								<h4 className="font-bold mb-3 text-sm">Industry</h4>
								<div className="space-y-2">
									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 ${selectedIndustry === "all" ? 'bg-orange-100 border-orange-500' : 'border-transparent'} border-2`}>
										<input type="radio" name="industry" value="all" checked={selectedIndustry === "all"} onChange={() => setSelectedIndustry("all") } className="hidden" />
										<span className="text-xs sm:text-sm font-medium">All Industries</span>
									</label>
									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 ${selectedIndustry === "It consulting" ? 'bg-orange-100 border-orange-500' : 'border-transparent'} border-2`}>
										<input type="radio" name="industry" value="It consulting" checked={selectedIndustry === "It consulting"} onChange={() => setSelectedIndustry("It consulting") } className="hidden" />
										<span className="text-xs sm:text-sm font-medium">It consulting</span>
									</label>
									<label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 ${selectedIndustry === "Technology" ? 'bg-orange-100 border-orange-500' : 'border-transparent'} border-2`}>
										<input type="radio" name="industry" value="Technology" checked={selectedIndustry === "Technology"} onChange={() => setSelectedIndustry("Technology") } className="hidden" />
										<span className="text-xs sm:text-sm font-medium">Technology</span>
									</label>
								</div>
							</div>
							{/* Date Posted */}
							<div className="mb-6">
								<h4 className="font-bold mb-3 text-sm">Date Posted</h4>
								<div className="space-y-2">
									<label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 border-2 border-transparent">
										<input type="radio" name="date" value="any" className="hidden" />
										<span className="text-xs sm:text-sm font-medium">Any time</span>
									</label>
									<label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 border-2 border-transparent">
										<input type="radio" name="date" value="24h" className="hidden" />
										<span className="text-xs sm:text-sm font-medium">Last 24 hours</span>
									</label>
									<label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 border-2 border-transparent">
										<input type="radio" name="date" value="7d" className="hidden" />
										<span className="text-xs sm:text-sm font-medium">Last 7 days</span>
									</label>
									<label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 border-2 border-transparent">
										<input type="radio" name="date" value="14d" className="hidden" />
										<span className="text-xs sm:text-sm font-medium">Last 14 days</span>
									</label>
									<label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-orange-50 border-2 border-transparent">
										<input type="radio" name="date" value="30d" className="hidden" />
										<span className="text-xs sm:text-sm font-medium">Last 30 days</span>
									</label>
								</div>
							</div>
							{/* Company */}
							<div className="mb-6">
								<h4 className="font-bold mb-3 text-sm">Company</h4>
								<Input
									className="rounded-full border-2 border-orange-100 px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500"
									placeholder="e.g. TalenTek, Talent Hub"
								/>
							</div>
						</aside>
						{/* Jobs List */}
						<div className="flex-1">
							<div className="flex items-center justify-between mb-6">
								<div>
									<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900">All Jobs</h2>
									<p className="text-gray-600 mt-1 text-sm sm:text-base">{jobs.length} jobs found</p>
								</div>
							</div>
							{loading ? (
								<div className="flex items-center justify-center py-12">
									<div className="text-center">
										<p className="text-gray-600 font-semibold">Loading jobs...</p>
									</div>
								</div>
							) : jobs.length === 0 ? (
								<div className="flex items-center justify-center py-12">
									<div className="text-center">
										<p className="text-gray-600 font-semibold">No jobs available</p>
									</div>
								</div>
							) : (
								<div className="grid grid-cols-1 gap-4 sm:gap-6">
									{jobs.map((job) => (
									<Card
										key={job.id}
										className="border-2 border-orange-200 bg-white rounded-2xl h-full flex flex-col overflow-hidden transition-all duration-300 hover:border-orange-500 hover:shadow-lg p-0"
									>
										{/* Header with Logo and Action Buttons */}
										<div className="p-6 pb-4 flex items-start justify-between border-b-2 border-orange-100">
											<div className="flex items-center gap-3 min-w-0">
												<div className="w-16 h-16 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 text-orange-600 font-bold text-2xl overflow-hidden">
													{job.logo_url ? (
														<img src={job.logo_url} alt={job.company_name} className="w-full h-full object-cover" />
													) : (
														job.company_name.slice(0, 2).toUpperCase()
													)}
												</div>
												<span className="text-base sm:text-lg font-semibold text-slate-900 truncate">
													{job.company_name}
												</span>
											</div>
											<div className="flex gap-3">
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleShare(job, e);
													}}
													className="p-2 rounded-lg hover:bg-orange-100 transition-colors text-orange-600"
													title="Share job"
												>
													<Share2 className="w-5 h-5" />
												</button>
												<button
													className="p-2 rounded-lg hover:bg-orange-100 transition-colors text-orange-600"
													title="Bookmark job"
												>
													<Bookmark className="w-5 h-5" />
												</button>
											</div>
										</div>

										{/* Content */}
										<div className="p-6 space-y-4 flex-1 flex flex-col">
											{/* Title */}
											<div>
												<CardTitle className="text-2xl font-bold text-slate-900 mb-2">{job.title}</CardTitle>
												<p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{job.description}</p>
											</div>

											{/* Company Info Row */}
											<div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 py-3 border-y border-orange-100">
												<div className="flex items-center gap-1">
													<Users className="w-4 h-4" />
													<span className="font-medium">{job.company_name}</span>
												</div>
												<span>•</span>
												<div className="flex items-center gap-1">
													<Clock className="w-4 h-4" />
													<span>{job.posted_at}</span>
												</div>
												<span>•</span>
												<div className="flex items-center gap-1">
													<MapPin className="w-4 h-4" />
													<span>{job.location}</span>
												</div>
												{job.industry && (
													<>
														<span>•</span>
														<div className="flex items-center gap-1">
															<Globe className="w-4 h-4" />
															<span>{job.industry}</span>
														</div>
													</>
												)}
												<span>•</span>
												<div className="flex items-center gap-1">
													<Briefcase className="w-4 h-4" />
													<span>{job.employment_type}</span>
												</div>
											</div>

											{/* All Skills */}
											<div className="flex flex-wrap gap-2 pt-2">
												{job.skills_required?.map((skill, idx) => (
													<span key={idx} className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-medium border border-orange-100 hover:bg-orange-100 transition-colors">{skill}</span>
												))}
											</div>

											{/* Buttons */}
											<div className="mt-auto pt-4 flex gap-3">
												<button 
													onClick={() => handleViewDetails(job)}
													className="flex-1 bg-orange-600 text-white font-bold text-sm py-3 px-4 rounded-lg hover:bg-orange-700 transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
												>
													View Details <ChevronRight className="w-4 h-4" />
												</button>
												<button 
													onClick={() => handleViewDetails(job)}
													className="flex-1 border-2 border-orange-600 text-orange-600 font-bold text-sm py-3 px-4 rounded-lg hover:bg-orange-50 transition-all duration-200"
												>
													Apply Now
												</button>
											</div>
										</div>
									</Card>
								))}
							</div>							)}							{/* Pagination */}
							<div className="flex justify-center items-center gap-3 mt-12 mb-16">
								<button className="rounded-full border-2 border-orange-500 bg-orange-500 text-white font-bold px-8 py-4 hover:bg-orange-400 transition-all duration-300 disabled:opacity-60 disabled:text-white">← Previous</button>
								<button className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4 transition-all duration-300 hover:from-orange-500 hover:to-orange-400 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50">1</button>
								<button className="rounded-full border-2 border-orange-500 bg-orange-500 text-white font-bold px-8 py-4 hover:bg-orange-400 transition-all duration-300">2</button>
								<button className="rounded-full border-2 border-orange-500 bg-orange-500 text-white font-bold px-8 py-4 hover:bg-orange-400 transition-all duration-300">Next →</button>
							</div>
						</div>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	);
};

export default Jobs;