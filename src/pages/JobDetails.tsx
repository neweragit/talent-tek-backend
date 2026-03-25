import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Briefcase, Award, ChevronLeft } from "lucide-react";
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
}

const formatDate = (dateString?: string): string => {
	if (!dateString) return 'Recently Posted';
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
	} catch {
		return 'Recently Posted';
	}
};

const JobDetails = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const { id } = useParams();
	const [job, setJob] = useState<Job | null>(null);
	const [loading, setLoading] = useState(true);
	const [applying, setApplying] = useState(false);

	useEffect(() => {
		const fetchJob = async () => {
			if (!id) {
				navigate('/jobs');
				return;
			}
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
						employers (
							company_name,
							industry
						)
					`)
					.eq('id', id)
					.single();

				if (error) {
					console.error('Job fetch error:', error);
					throw error;
				}
				
				if (!data) {
					console.error('Job not found:', id);
					navigate('/jobs');
					return;
				}

				const formattedJob: Job = {
					id: data.id,
					title: data.title || 'Untitled Position',
					company_name: data.employers?.company_name || 'Unknown Company',
					description: data.description || '',
					location: data.location || 'Not specified',
					employment_type: data.employment_type || 'Full-Time',
					industry: data.employers?.industry || '',
					skills_required: data.skills_required || [],
					what_you_will_do: data.what_you_will_do || [],
					requirements: data.requirements || [],
					positions_available: data.positions_available || 1,
					posted_at: data.created_at,
				};

				setJob(formattedJob);
			} catch (error) {
				console.error('Error fetching job:', error);
				navigate('/jobs');
			} finally {
				setLoading(false);
			}
		};

		fetchJob();
	}, [id, navigate]);

	const handleApply = async () => {
		if (user?.role !== 'talent') {
			navigate('/login');
			return;
		}

		try {
			setApplying(true);
			// TODO: Create application record in database
			// const { error } = await supabase
			//   .from('applications')
			//   .insert([{ job_id: job?.id, talent_id: user.id }]);
			// if (error) throw error;
			
			alert('Application submitted successfully!');
			navigate('/jobs');
		} catch (error) {
			console.error('Error applying to job:', error);
			alert('Failed to apply for this job. Please try again.');
		} finally {
			setApplying(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<p className="text-gray-600 font-semibold">Loading job details...</p>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	if (!job) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col">
				<Navbar />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center">
						<p className="text-gray-600 font-semibold">Job not found</p>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Navbar />

			<main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Back Button */}
				<button
					onClick={() => navigate('/jobs')}
					className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold mb-6 transition"
				>
					<ChevronLeft className="w-5 h-5" />
					Back to Jobs
				</button>

				<Card className="border-2 border-orange-200 rounded-2xl overflow-hidden">
					{/* Header */}
					<CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b-2 border-orange-200 p-6 sm:p-8">
						<div className="flex items-start gap-4">
							<div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
								{job.company_name.slice(0, 2).toUpperCase()}
							</div>
							<div className="flex-1">
								<h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">{job.title}</h1>
								<p className="text-lg text-orange-600 font-semibold">{job.company_name}</p>
							</div>
						</div>
					</CardHeader>

					{/* Content */}
					<CardContent className="p-6 sm:p-8 space-y-8">
						{/* Job Meta Info */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
							<div className="bg-orange-50 rounded-lg p-4">
								<div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
									<MapPin className="w-4 h-4" />
									<span>Location</span>
								</div>
								<p className="font-bold text-sm text-slate-900">{job.location}</p>
							</div>
							<div className="bg-orange-50 rounded-lg p-4">
								<div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
									<Briefcase className="w-4 h-4" />
									<span>Type</span>
								</div>
								<p className="font-bold text-sm text-slate-900">{job.employment_type}</p>
							</div>
							<div className="bg-orange-50 rounded-lg p-4">
								<div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
									<Award className="w-4 h-4" />
									<span>Industry</span>
								</div>
								<p className="font-bold text-sm text-slate-900">{job.industry}</p>
							</div>
							<div className="bg-orange-50 rounded-lg p-4">
								<div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
									<Clock className="w-4 h-4" />
									<span>Posted</span>
								</div>
								<p className="font-bold text-sm text-slate-900">{formatDate(job.posted_at)}</p>
							</div>
						</div>

						{/* Description */}
						<div>
							<h2 className="text-2xl font-bold text-slate-900 mb-4">About This Job</h2>
							<p className="text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</p>
						</div>

						{/* What You'll Do */}
						{job.what_you_will_do && job.what_you_will_do.length > 0 && (
							<div>
								<h2 className="text-2xl font-bold text-slate-900 mb-4">What You'll Do</h2>
								<ul className="space-y-3">
									{job.what_you_will_do.map((item, idx) => (
										<li key={idx} className="flex gap-3">
											<span className="text-orange-500 font-bold flex-shrink-0">•</span>
											<span className="text-gray-700">{item}</span>
										</li>
									))}
								</ul>
							</div>
						)}

						{/* Requirements */}
						{job.requirements && job.requirements.length > 0 && (
							<div>
								<h2 className="text-2xl font-bold text-slate-900 mb-4">Requirements</h2>
								<ul className="space-y-3">
									{job.requirements.map((req, idx) => (
										<li key={idx} className="flex gap-3">
											<span className="text-orange-500 font-bold flex-shrink-0">•</span>
											<span className="text-gray-700">{req}</span>
										</li>
									))}
								</ul>
							</div>
						)}

						{/* Required Skills */}
						{job.skills_required && job.skills_required.length > 0 && (
							<div>
								<h2 className="text-2xl font-bold text-slate-900 mb-4">Required Skills</h2>
								<div className="flex flex-wrap gap-3">
									{job.skills_required.map((skill, idx) => (
										<span key={idx} className="bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-medium border border-orange-200">
											{skill}
										</span>
									))}
								</div>
							</div>
						)}

						{/* Positions Available */}
						{job.positions_available && job.positions_available > 0 && (
							<div className="bg-blue-50 border-l-4 border-blue-500 p-4">
								<p className="text-blue-900 font-semibold">
									{job.positions_available} position{job.positions_available > 1 ? 's' : ''} available
								</p>
							</div>
						)}

						{/* Apply Button */}
						<div className="border-t-2 border-orange-100 pt-6">
							{user?.role === 'talent' ? (
								<Button
									onClick={handleApply}
									disabled={applying}
									className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold py-4 px-6 rounded-lg hover:from-orange-500 hover:to-orange-400 transition text-lg"
								>
									{applying ? 'Applying...' : 'Apply Now'}
								</Button>
							) : user ? (
								<div className="w-full bg-gray-100 text-gray-600 font-bold py-4 px-6 rounded-lg cursor-not-allowed flex items-center justify-center text-lg">
									Only Talents Can Apply
								</div>
							) : (
								<Button
									onClick={() => navigate('/login')}
									className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold py-4 px-6 rounded-lg hover:from-orange-500 hover:to-orange-400 transition text-lg"
								>
									Login to Apply
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</main>

			<Footer />
		</div>
	);
};

export default JobDetails;
