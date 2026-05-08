import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Briefcase, Users, Share2, Globe, Search, RefreshCw, Building2, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import citiesData from "../../cities.json";

const professionOptions = ["Design", "Product", "Engineering"];
const workplaceOptions = ["On-site", "Hybrid", "Remote"];
const employmentTypeOptions = ["Full-time", "Part-time", "Contract", "Internship"];
const contractTypeOptions = ["Permanent (CDI)", "Fixed-term (CDD)", "Freelance", "Self-Entrepreneur (auto-entrepreneur)"];
const experienceLevelOptions = ["0-1 years", "1-3 years", "3-5 years", "5-8 years", "8+ years"];

const wilayaOptions = (() => {
  const wilayas = Array.isArray((citiesData as any)?.wilayas) ? (citiesData as any).wilayas : [];
  return wilayas
    .filter((item: any) => Number(item?.wilaya_id) >= 1 && Number(item?.wilaya_id) <= 58)
    .map((item: any) => ({
      id: Number(item.wilaya_id),
      name: String(item.wilaya_name_latin || "").trim(),
    }))
    .filter((item: any) => item.name);
})();

interface Job {
	id: string;
	title: string;
	company_name: string;
	description: string;
	location: string;
	employment_type: string;
	contract_type: string;
	workplace: string;
	profession: string;
	industry: string;
	skills_required: string[];
	experience_level: string;
	what_you_will_do?: string[];
	requirements?: string[];
	positions_available?: number;
	posted_at?: string;
	logo_url?: string;
}

const Jobs = () => {
	const { toast } = useToast();
	const navigate = useNavigate();
	const [jobs, setJobs] = useState<Job[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [professionFilter, setProfessionFilter] = useState(" ");
	const [locationFilter, setLocationFilter] = useState(" ");
	const [employmentFilter, setEmploymentFilter] = useState(" ");
	const [contractTypeFilter, setContractTypeFilter] = useState(" ");
	const [workplaceFilter, setWorkplaceFilter] = useState(" ");
	const [experienceFilter, setExperienceFilter] = useState(" ");
	const [postedFilter, setPostedFilter] = useState(" ");
	const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
	const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

	const filterOptions = useMemo(() => {
		const sortValues = (values: string[]) =>
			[...values]
				.map((v) => v.trim())
				.filter(Boolean)
				.sort((a, b) => a.localeCompare(b));

		return {
			professions: sortValues(professionOptions),
			locations: sortValues(wilayaOptions.map((w) => w.name)),
			employments: sortValues(employmentTypeOptions),
			contractTypes: sortValues(contractTypeOptions),
			workplaces: sortValues(workplaceOptions),
			experiences: sortValues(experienceLevelOptions),
			skills: Array.from(new Set(jobs.flatMap(j => j.skills_required || []).filter(Boolean)))
		};
	}, [jobs]);

	const toggleSkillFilter = (skill: string) => {
		setSelectedSkills((prev) =>
			prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
		);
	};

	const filteredJobs = useMemo(() => {
		return jobs.filter((job) => {
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const matchesSearch =
					job.title.toLowerCase().includes(query) ||
					job.company_name.toLowerCase().includes(query) ||
					(job.skills_required && job.skills_required.some((s) => s.toLowerCase().includes(query)));
				if (!matchesSearch) return false;
			}
			if (professionFilter !== " " && job.profession !== professionFilter) return false;
			if (locationFilter !== " " && job.location !== locationFilter) return false;
			if (employmentFilter !== " " && job.employment_type !== employmentFilter) return false;
			if (contractTypeFilter !== " " && job.contract_type !== contractTypeFilter) return false;
			if (workplaceFilter !== " " && job.workplace !== workplaceFilter) return false;
			if (experienceFilter !== " " && job.experience_level !== experienceFilter) return false;
			
			if (selectedSkills.length > 0) {
				const hasAllSkills = selectedSkills.every(s => job.skills_required?.includes(s));
				if (!hasAllSkills) return false;
			}

			if (postedFilter !== " " && job.posted_at) {
				const postedDate = new Date(job.posted_at);
				const daysAgo = (Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
				if (daysAgo > parseInt(postedFilter)) return false;
			}
			return true;
		});
	}, [jobs, searchQuery, professionFilter, locationFilter, employmentFilter, contractTypeFilter, workplaceFilter, experienceFilter, postedFilter, selectedSkills]);
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
						profession,
						workplace,
						contract_type,
						experience_level,
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
					.eq("status", "published")
					.order('created_at', { ascending: false });

				if (error) throw error;

				const formattedJobs: Job[] = (data || []).map((job: any) => ({
					id: job.id,
					title: job.title || 'Untitled Position',
					company_name: job.employers?.company_name || 'Unknown Company',
					description: job.description || '',
					location: job.location || 'Not specified',
					employment_type: job.employment_type || 'Full-Time',
					contract_type: job.contract_type || '',
					workplace: job.workplace || '',
					profession: job.profession || '',
					experience_level: job.experience_level || '',
					industry: job.employers?.industry || '',
					skills_required: job.skills_required || [],
					what_you_will_do: job.what_you_will_do || [],
					requirements: job.requirements || [],
					positions_available: job.positions_available || 1,
					posted_at: job.created_at,
					logo_url: job.employers?.logo_url || '',
				}));

				setJobs(formattedJobs);
				
			} catch (error) {
				console.error('Error fetching jobs:', error);
				setJobs([]);
			} finally {
				setLoading(false);
			}
		};

		fetchJobs();
	}, []);

	const handleShare = (job: Job, e: React.MouseEvent) => {
		e.stopPropagation();
		const jobUrl = `${window.location.origin}/jobs/${job.id}`;

		navigator.clipboard
			.writeText(jobUrl)
			.then(() => {
				toast({ title: "Link copied to clipboard" });
			})
			.catch((error) => {
				toast({
					title: "Copy failed",
					description: error?.message || "Could not copy the link.",
					variant: "destructive",
				});
			});
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
						<p className="mt-3 text-xs sm:text-sm font-semibold text-slate-600 max-w-2xl mx-auto">
							To apply, use your Talent dashboard.
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
									value={searchQuery}
									onChange={e => setSearchQuery(e.target.value)}
								/>
							</div>
							<button onClick={() => {}} className="h-12 px-8 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold transition-all duration-300 hover:from-orange-500 hover:to-orange-400 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50">
								Search
							</button>
						</div>
					</div>
				</div>
			</div>
			<div className="pt-8 sm:pt-12">
				<div className="max-w-7xl mx-auto px-3 sm:px-4 pb-12">
					<div className="flex items-center justify-between mb-6">
						<div>
							<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">All Jobs</h2>
							<p className="text-gray-600 mt-1 text-sm sm:text-base">{filteredJobs.length} jobs found</p>
						</div>
					</div>

					<div className="mb-4 flex flex-col gap-3 rounded-3xl border border-orange-100 bg-white p-4 shadow-sm">
						<div className="grid w-full gap-3 md:grid-cols-3">
							<Select value={professionFilter} onValueChange={setProfessionFilter}>
								<SelectTrigger className="h-12 rounded-2xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
									<SelectValue placeholder="All professions" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value=" ">All professions</SelectItem>
									{filterOptions.professions.map((v, i) => <SelectItem key={i} value={v}>{v}</SelectItem>)}
								</SelectContent>
							</Select>

							<Select value={locationFilter} onValueChange={setLocationFilter}>
								<SelectTrigger className="h-12 rounded-2xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
									<SelectValue placeholder="All locations" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value=" ">All locations</SelectItem>
									{filterOptions.locations.map((v, i) => <SelectItem key={i} value={v}>{v}</SelectItem>)}
								</SelectContent>
							</Select>

							<Select value={employmentFilter} onValueChange={setEmploymentFilter}>
								<SelectTrigger className="h-12 rounded-2xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
									<SelectValue placeholder="All employment types" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value=" ">All employment types</SelectItem>
									{filterOptions.employments.map((v, i) => <SelectItem key={i} value={v}>{v}</SelectItem>)}
								</SelectContent>
							</Select>
						</div>

						<div className="grid w-full gap-3 md:grid-cols-4">

							<Select value={contractTypeFilter} onValueChange={setContractTypeFilter}>
								<SelectTrigger className="h-12 rounded-2xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
									<SelectValue placeholder="All contract types" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value=" ">All contract types</SelectItem>
									{filterOptions.contractTypes.map((v, i) => <SelectItem key={i} value={v}>{v}</SelectItem>)}
								</SelectContent>
							</Select>

							<Select value={workplaceFilter} onValueChange={setWorkplaceFilter}>
								<SelectTrigger className="h-12 rounded-2xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
									<SelectValue placeholder="All work modes" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value=" ">All work modes</SelectItem>
									{filterOptions.workplaces.map((v, i) => <SelectItem key={i} value={v}>{v}</SelectItem>)}
								</SelectContent>
							</Select>

							<Select value={experienceFilter} onValueChange={setExperienceFilter}>
								<SelectTrigger className="h-12 rounded-2xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
									<SelectValue placeholder="All experience levels" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value=" ">All experience levels</SelectItem>
									{filterOptions.experiences.map((v, i) => <SelectItem key={i} value={v}>{v}</SelectItem>)}
								</SelectContent>
							</Select>

							<Select value={postedFilter} onValueChange={setPostedFilter}>
								<SelectTrigger className="h-12 rounded-2xl border-orange-200 bg-white px-4 text-sm font-semibold text-slate-700">
									<SelectValue placeholder="Any time" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value=" ">Any time</SelectItem>
									<SelectItem value="1">Last 24 hours</SelectItem>
									<SelectItem value="3">Last 3 days</SelectItem>
									<SelectItem value="7">Last 7 days</SelectItem>
									<SelectItem value="14">Last 14 days</SelectItem>
									<SelectItem value="30">Last 30 days</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="mb-7 flex flex-col gap-3 rounded-3xl border border-orange-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
						<div className="relative w-full md:max-w-xl">
							<Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
							<Input 
								value={searchQuery} 
								onChange={(e) => setSearchQuery(e.target.value)} 
								placeholder="Search role, company, or skill..." 
								className="h-12 rounded-2xl border-orange-200 pl-11 focus:border-orange-400 focus:ring-orange-400" 
							/>
						</div>
						<div className="flex flex-wrap gap-2 sm:flex-nowrap">
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setProfessionFilter(" ");
									setLocationFilter(" ");
									setEmploymentFilter(" ");
									setContractTypeFilter(" ");
									setWorkplaceFilter(" ");
									setExperienceFilter(" ");
									setPostedFilter(" ");
									setSearchQuery("");
									setSelectedSkills([]);
								}}
								className="whitespace-nowrap rounded-full border-orange-600 bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600 hover:text-white"
							>
								<span className="flex items-center gap-2">
									<RefreshCw className="h-4 w-4" />
									Reset Filters
								</span>
							</Button>
							<Button
								type="button"
								onClick={() => setShowAdvancedFilters((s) => !s)}
								className="whitespace-nowrap rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-700 hover:to-orange-600"
							>
								<span className="flex items-center gap-2">
									<SlidersHorizontal className="h-4 w-4" />
									{showAdvancedFilters ? "Hide Advanced" : "Show Advanced"}
								</span>
							</Button>
						</div>
					</div>

					{showAdvancedFilters ? (
						<div className="mb-7 rounded-3xl border border-orange-100 bg-white p-5 shadow-lg">
							<p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Skill match</p>
							<div className="mt-4 flex flex-wrap gap-2">
								{filterOptions.skills.length > 0 ? (
									filterOptions.skills.map((skill) => (
										<button
											key={skill}
											type="button"
											onClick={() => toggleSkillFilter(skill)}
											className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
												selectedSkills.includes(skill)
													? "border-orange-600 bg-orange-600 text-white"
													: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
											}`}
										>
											{skill}
										</button>
									))
								) : (
									<span className="text-sm text-slate-600">No skills found yet.</span>
								)}
							</div>
						</div>
					) : null}



					{loading ? (
						<div className="flex items-center justify-center py-12">
							<div className="text-center">
								<p className="text-gray-600 font-semibold">Loading jobs...</p>
							</div>
						</div>
					) : filteredJobs.length === 0 ? (
						<div className="flex items-center justify-center py-12">
							<div className="text-center">
								<p className="text-gray-600 font-semibold">No jobs available matching your filters.</p>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
							{filteredJobs.map((job) => (
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
										</div>
									</div>

									{/* Content */}
									<div className="p-6 flex-1 flex flex-col">
										<div className="space-y-4">
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
													<span>{new Date(job.posted_at || Date.now()).toLocaleDateString()}</span>
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
										</div>

										<div className="mt-auto pt-6 space-y-3">
											<button
												onClick={() => navigate(`/jobs/${job.id}`)}
												className="w-full rounded-full border-2 border-orange-500 bg-white px-4 py-3 text-sm font-semibold text-orange-600 transition-all hover:bg-orange-50"
											>
												Job Details
											</button>
											<div className="rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm font-semibold text-slate-600">
												Log in to the Talent dashboard to view full details and apply.
											</div>
										</div>
									</div>
								</Card>
							))}
						</div>
					)}
					
					{/* Pagination */}
					{filteredJobs.length > 0 && (
						<div className="flex justify-center items-center gap-3 mt-12 mb-4">
							<button className="rounded-full border-2 border-orange-500 bg-orange-500 text-white font-bold px-8 py-4 hover:bg-orange-400 transition-all duration-300 disabled:opacity-60 disabled:text-white">← Previous</button>
							<button className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold px-8 py-4 transition-all duration-300 hover:from-orange-500 hover:to-orange-400 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50">1</button>
							<button className="rounded-full border-2 border-orange-500 bg-orange-500 text-white font-bold px-8 py-4 hover:bg-orange-400 transition-all duration-300">Next →</button>
						</div>
					)}
				</div>
			</div>
			<Footer />
		</div>
	);
};

export default Jobs;
