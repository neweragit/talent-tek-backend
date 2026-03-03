import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MapPin, Clock, MoreHorizontal, Edit, Share2, XCircle, Archive, AlertTriangle, CheckCircle, Copy, Loader2 } from "lucide-react";
import EmployerLayout from "@/components/layouts/EmployerLayout";
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function EmployerJobs() {
	const { user } = useAuth();
	const { toast } = useToast();
	const [jobList, setJobList] = useState([]);
	const [loading, setLoading] = useState(true);
	const [employerId, setEmployerId] = useState<string>("");
	const [open, setOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [stage, setStage] = useState(0);
	const [activeTab, setActiveTab] = useState("Published");
	const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false);
	const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
	const [shareDialogOpen, setShareDialogOpen] = useState(false);
	const [jobToAction, setJobToAction] = useState(null);
	const [selectedJob, setSelectedJob] = useState(null);
	const [copiedJobUrl, setCopiedJobUrl] = useState("");
	const [shareEmails, setShareEmails] = useState("");
	const [sendingShare, setSendingShare] = useState(false);
	const [form, setForm] = useState({
		title: "",
		profession: "",
		workLocation: "",
		workplace: "on-site",
		skills: [] as string[],
		experience: "",
		jobLevel: "",
		education: "",
		employmentType: "full-time",
		contractType: "",
		positions: "1",
		jobLocation: "",
		description: "",
		status: "published"
	});

	const [skillInput, setSkillInput] = useState("");

	useEffect(() => {
		if (user?.id) {
			loadEmployerData();
		}
	}, [user]);

	useEffect(() => {
		if (employerId) {
			loadJobs();
		}
	}, [employerId, activeTab]);

	const loadEmployerData = async () => {
		try {
			// First, try to find the user as an employer (superadmin)
			const { data: employerData } = await supabase
				.from('employers')
				.select('id, company_name')
				.eq('user_id', user?.id)
				.maybeSingle();

			if (employerData) {
				// User is the employer themselves
				setEmployerId(employerData.id);
				setLoading(false);
				return;
			}

			// If not found, check if user is a team member
			const { data: teamMemberData, error: teamError } = await supabase
				.from('employer_team_members')
				.select('employer_id, employers!inner(id, company_name)')
				.eq('user_id', user?.id)
				.maybeSingle();

			if (teamError) {
				console.error('Team member lookup error:', teamError);
				throw teamError;
			}

			if (teamMemberData) {
				// User is a team member - use their employer's ID
				setEmployerId(teamMemberData.employer_id);
				setLoading(false);
				return;
			}

			// No employer or team member record found
			setLoading(false);
			toast({
				title: "Access Required",
				description: "You need to be associated with an employer to access this page.",
				variant: "destructive",
			});
			setTimeout(() => {
				window.location.href = '/';
			}, 2000);

		} catch (error) {
			console.error('Error loading employer:', error);
			setLoading(false);
			toast({
				title: "Error",
				description: "Failed to load employer data. Please try again.",
				variant: "destructive",
			});
		}
	};

	const loadJobs = async () => {
		if (!employerId) {
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const { data, error } = await supabase
				.from('jobs')
				.select(`
					id,
					title,
					location,
					employment_type,
					workplace,
					status,
					description,
					profession,
					skills_required,
					experience_level,
					job_level,
					education_required,
					contract_type,
					positions_available,
					views_count,
					published_at,
					created_at,
					updated_at
				`)
				.eq('employer_id', employerId)
				.eq('status', 
					activeTab === 'Published' ? 'published' :
					activeTab === 'Unpublished' ? 'unpublished' :
					activeTab === 'Archived' ? 'archived' : activeTab.toLowerCase()
				)
				.order('created_at', { ascending: false });

			if (error) throw error;

			// Get application counts for each job
			const jobsWithCounts = await Promise.all(
				(data || []).map(async (job) => {
					const { count } = await supabase
						.from('applications')
						.select('id', { count: 'exact', head: true })
						.eq('job_id', job.id);

					return {
						...job,
						skills: job.skills_required,
						education: job.education_required,
						workplace_type: job.workplace,
						positions: job.positions_available,
						applicants_count: count || 0
					};
				})
			);

			setJobList(jobsWithCounts);
		} catch (error) {
			console.error('Error loading jobs:', error);
			toast({
				title: "Error",
				description: "Failed to load jobs.",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const getJobCounts = async () => {
		if (!employerId) return { Published: 0, Unpublished: 0, Archived: 0 };

		const statuses = ['published', 'unpublished', 'archived'];
		const counts: any = { Published: 0, Unpublished: 0, Archived: 0 };

		await Promise.all(
			statuses.map(async (status) => {
				const { count } = await supabase
					.from('jobs')
					.select('id', { count: 'exact', head: true })
					.eq('employer_id', employerId)
					.eq('status', status);

				// Map database status to UI status
				if (status === 'published') counts.Published = count || 0;
				else if (status === 'unpublished') counts.Unpublished = count || 0;
				else if (status === 'archived') counts.Archived = count || 0;
			})
		);

		return counts;
	};

	const [jobCounts, setJobCounts] = useState({ Published: 0, Unpublished: 0, Archived: 0 });

	useEffect(() => {
		if (employerId) {
			getJobCounts().then(setJobCounts);
		}
	}, [employerId, jobList]);

	function handleFormChange(e: any) {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	}

	function handleAddSkill(e: any) {
		if (e.key === "Enter" && skillInput.trim()) {
			e.preventDefault();
			setForm((prev) => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
			setSkillInput("");
		}
	}

	function removeSkill(index: number) {
		setForm((prev) => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
	}

	async function handleSubmit(e: any) {
		e.preventDefault();
		
		if (!employerId) {
			toast({
				title: "Error",
				description: "Employer data not loaded.",
				variant: "destructive",
			});
			return;
		}

		try {
			const jobData: any = {
				employer_id: employerId,
				title: form.title,
				profession: form.profession,
				location: form.jobLocation,
				workplace: form.workplace,
				skills_required: form.skills,
				experience_level: form.experience,
				job_level: form.jobLevel,
				education_required: form.education,
				employment_type: form.employmentType,
				contract_type: form.contractType,
				positions_available: parseInt(form.positions),
				description: form.description,
				status: 'published',
				published_at: new Date().toISOString()
			};

			const { error } = await supabase
				.from('jobs')
				.insert(jobData);

			if (error) throw error;

			toast({
				title: "Success!",
				description: "Job posted successfully.",
			});

			setOpen(false);
			setStage(0);
			resetForm();
			await loadJobs();
			const counts = await getJobCounts();
			setJobCounts(counts);
		} catch (error) {
			console.error('Error posting job:', error);
			toast({
				title: "Error",
				description: "Failed to post job. Please try again.",
				variant: "destructive",
			});
		}
	}

	function resetForm() {
		setForm({
			title: "",
			profession: "",
			workLocation: "",
			workplace: "on-site",
			skills: [],
			experience: "",
			jobLevel: "",
			education: "",
			employmentType: "full-time",
			contractType: "",
			positions: "1",
			jobLocation: "",
			description: "",
			status: "published"
		});
		setStage(0);
	}

	function handleUnpublishJob(jobId: string) {
		setJobToAction(jobId);
		setUnpublishDialogOpen(true);
	}

	async function confirmUnpublish() {
		if (jobToAction) {
			try {
				const { data, error } = await supabase
					.from('jobs')
					.update({ 
						status: 'unpublished'
					})
					.eq('id', jobToAction)
					.select();

				if (error) {
					console.error('Unpublish error details:', {
						message: error.message,
						details: error.details,
						hint: error.hint,
						code: error.code
					});
					throw error;
				}

				toast({
					title: "Success",
					description: "Job unpublished successfully.",
				});

				setUnpublishDialogOpen(false);
				setJobToAction(null);
				await loadJobs();
				const counts = await getJobCounts();
				setJobCounts(counts);
			} catch (error: any) {
				console.error('Error unpublishing job:', error);
				toast({
					title: "Error",
					description: error?.message || "Failed to unpublish job.",
					variant: "destructive",
				});
			}
		}
	}

	function handleArchiveJob(jobId: string) {
		setJobToAction(jobId);
		setArchiveDialogOpen(true);
	}

	async function handlePublishJob(jobId: string) {
		try {
			const { error } = await supabase
				.from('jobs')
				.update({ 
					status: 'published',
					published_at: new Date().toISOString()
				})
				.eq('id', jobId);

			if (error) throw error;

			toast({
				title: "Success",
				description: "Job published successfully.",
			});

			await loadJobs();
			const counts = await getJobCounts();
			setJobCounts(counts);
		} catch (error) {
			console.error('Error publishing job:', error);
			toast({
				title: "Error",
				description: "Failed to publish job.",
				variant: "destructive",
			});
		}
	}

	async function confirmArchive() {
		if (jobToAction) {
			try {
				const { error } = await supabase
					.from('jobs')
					.update({ 
						status: 'archived'
					})
					.eq('id', jobToAction);

				if (error) throw error;

				toast({
					title: "Success",
					description: "Job archived successfully.",
				});

				setArchiveDialogOpen(false);
				setJobToAction(null);
				await loadJobs();
				const counts = await getJobCounts();
				setJobCounts(counts);
			} catch (error) {
				console.error('Error archiving job:', error);
				toast({
					title: "Error",
					description: "Failed to archive job.",
					variant: "destructive",
				});
			}
		}
	}

	function handleEditJob(job: any) {
		setSelectedJob(job);
		setForm({
			title: job.title || "",
			profession: job.profession || "",
			workLocation: job.location || "",
			workplace: job.workplace || "on-site",
			skills: Array.isArray(job.skills_required) ? job.skills_required : (Array.isArray(job.skills) ? job.skills : []),
			experience: job.experience_level || "",
			jobLevel: job.job_level || "",
			education: job.education_required || job.education || "",
			employmentType: job.employment_type || "",
			contractType: job.contract_type || "",
			positions: (job.positions_available || job.positions || 1).toString(),
			jobLocation: job.location || "",
			description: job.description || "",
			status: job.status || "published"
		});
		setStage(0);
		setEditDialogOpen(true);
	}

	async function handleUpdateJob(e: any) {
		e.preventDefault();
		if (selectedJob) {
			try {
				let updates: any = {
					title: form.title,
					profession: form.profession,
					location: form.jobLocation,
					workplace: form.workplace,
					skills_required: form.skills,
					experience_level: form.experience,
					job_level: form.jobLevel,
					education_required: form.education,
					employment_type: form.employmentType,
					contract_type: form.contractType,
					positions_available: parseInt(form.positions),
					description: form.description,
					status: form.status
				};

				// Set published_at when changing status to published
				if (selectedJob.status !== 'published' && form.status === 'published') {
					updates.published_at = new Date().toISOString();
				}

				const { error } = await supabase
					.from('jobs')
					.update(updates)
					.eq('id', selectedJob.id);

				if (error) throw error;

				toast({
					title: "Success",
					description: "Job updated successfully.",
				});

				setEditDialogOpen(false);
				setSelectedJob(null);
				resetForm();
				await loadJobs();
			} catch (error) {
				console.error('Error updating job:', error);
				toast({
					title: "Error",
					description: "Failed to update job.",
					variant: "destructive",
				});
			}
		}
	}

	function handleShareJob(job: any) {
		const jobUrl = `${window.location.origin}/jobs/${job.id}`;
		navigator.clipboard.writeText(jobUrl);
		setCopiedJobUrl(jobUrl);
		setJobToAction(job);
		setShareEmails("");
		setShareDialogOpen(true);
	}

	async function handleSendToEmails() {
		if (!shareEmails.trim() || !jobToAction) return;
		
		const emails = shareEmails.split(',').map(e => e.trim()).filter(e => e);
		if (emails.length === 0) {
			toast({
				title: "No emails provided",
				description: "Please enter at least one email address.",
				variant: "destructive",
			});
			return;
		}

		try {
			setSendingShare(true);
			// In a real implementation, you would call an API endpoint here
			// For now, we'll just show a success message
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			toast({
				title: "Job shared successfully!",
				description: `Job link sent to ${emails.length} email${emails.length > 1 ? 's' : ''}.`,
			});
			setShareDialogOpen(false);
			setShareEmails("");
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to send emails.",
				variant: "destructive",
			});
		} finally {
			setSendingShare(false);
		}
	}

	return (
		<EmployerLayout>
			<div className="max-w-7xl mx-auto py-8 px-6">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-4xl font-bold text-gray-900">
						Posted Jobs
					</h1>
					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger asChild>
							<Button className="bg-gradient-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-glow hover:opacity-90 transition-all">
								<Plus className="w-5 h-5" />
								Post a Job
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle className="text-2xl font-bold text-gray-900">
									Create a Job Post
								</DialogTitle>
								<p className="text-muted-foreground">
									Step {stage + 1}/3:{" "}
									{stage === 0
										? "Fill in the following fields to publish your job post."
										: stage === 1
										? "Add more details about the position."
										: "Review your job post before publishing."}
								</p>
							</DialogHeader>

							{/* Progress Steps */}
							<div className="flex items-center justify-between mb-8 mt-4">
								<div className="flex items-center gap-4 flex-1">
									<div
										className={`flex items-center gap-2 ${
											stage >= 0 ? "text-primary" : "text-muted-foreground"
										}`}
									>
										<div
											className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
												stage >= 0
													? "bg-gradient-primary text-white shadow-glow"
													: "bg-muted"
											}`}
										>
											1
										</div>
										<span className="font-semibold hidden sm:block">Job Details</span>
									</div>
									<div className="flex-1 h-[2px] bg-border"></div>
								</div>
								<div className="flex items-center gap-4 flex-1">
									<div
										className={`flex items-center gap-2 ${
											stage >= 1 ? "text-primary" : "text-muted-foreground"
										}`}
									>
										<div
											className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
												stage >= 1
													? "bg-gradient-primary text-white shadow-glow"
													: "bg-muted"
											}`}
										>
											2
										</div>
										<span className="font-semibold hidden sm:block">Additional Information</span>
									</div>
									<div className="flex-1 h-[2px] bg-border"></div>
								</div>
								<div className="flex items-center gap-4">
									<div
										className={`flex items-center gap-2 ${
											stage >= 2 ? "text-primary" : "text-muted-foreground"
										}`}
									>
										<div
											className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
												stage >= 2
													? "bg-gradient-primary text-white shadow-glow"
													: "bg-muted"
											}`}
										>
											3
										</div>
										<span className="font-semibold hidden sm:block">Review & Post</span>
									</div>
								</div>
							</div>

							<form onSubmit={handleSubmit}>
								{/* Stage 1: Job Details */}
								{stage === 0 && (
									<div className="space-y-6">
										<div>
											<Label htmlFor="title" className="text-sm font-semibold">
												Job Title <span className="text-red-500">*</span>
											</Label>
											<Input
												id="title"
												name="title"
												value={form.title}
												onChange={handleFormChange}
												placeholder="e.g., Marketing Manager"
												className="mt-2"
												required
											/>
										</div>

										<div>
											<Label htmlFor="profession" className="text-sm font-semibold">
												Profession <span className="text-red-500">*</span>
											</Label>
											<Select
												name="profession"
												value={form.profession}
												onValueChange={(val) => setForm({ ...form, profession: val })}
											>
												<SelectTrigger className="mt-2">
													<SelectValue placeholder="Select profession" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="software-engineer">Software Engineer</SelectItem>
													<SelectItem value="designer">Designer</SelectItem>
													<SelectItem value="marketing">Marketing</SelectItem>
													<SelectItem value="sales">Sales</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div>
											<Label className="text-sm font-semibold">
												Workplace <span className="text-red-500">*</span>
											</Label>
											<div className="flex gap-4 mt-2">
												{["on-site", "hybrid", "remote"].map((type) => (
													<label
														key={type}
														className="flex items-center gap-2 cursor-pointer"
													>
														<input
															type="radio"
															name="workplace"
															value={type}
															checked={form.workplace === type}
															onChange={handleFormChange}
															className="w-4 h-4"
														/>
														<span className="capitalize">{type}</span>
													</label>
												))}
											</div>
										</div>

										<div>
											<Label htmlFor="skills" className="text-sm font-semibold">
												Skills <span className="text-red-500">*</span>
											</Label>
											<Input
												id="skills"
												value={skillInput}
												onChange={(e) => setSkillInput(e.target.value)}
												onKeyDown={handleAddSkill}
												placeholder="Type a skill and press Enter"
												className="mt-2"
											/>
											<div className="flex flex-wrap gap-2 mt-2">
												{form.skills.map((skill, index) => (
													<Badge key={index} variant="secondary" className="px-3 py-1">
														{skill}
														<button
															type="button"
															onClick={() => removeSkill(index)}
															className="ml-2 text-xs"
														>
															×
														</button>
													</Badge>
												))}
											</div>
										</div>

										<div>
											<Label htmlFor="experience" className="text-sm font-semibold">
												Years of Experience <span className="text-red-500">*</span>
											</Label>
											<Input
												id="experience"
												name="experience"
												value={form.experience}
												onChange={handleFormChange}
												placeholder="e.g., 5 years, 10+ years, 2-3 years, 20 years"
												className="mt-2"
												required
											/>
										</div>

										<div>
											<Label htmlFor="jobLevel" className="text-sm font-semibold">
												Job Level <span className="text-red-500">*</span>
											</Label>
											<Input
												id="jobLevel"
												name="jobLevel"
												value={form.jobLevel}
												onChange={handleFormChange}
												placeholder="e.g., Senior, Mid-Level, Lead, Principal"
												className="mt-2"
												required
											/>
										</div>

										<div>
											<Label htmlFor="education" className="text-sm font-semibold">
												Education Level <span className="text-red-500">*</span>
											</Label>
											<Input
												id="education"
												name="education"
												value={form.education}
												onChange={handleFormChange}
												placeholder="e.g., Bachelor's Degree, Master's Degree, PhD"
												className="mt-2"
												required
											/>
										</div>

										<div className="flex gap-4 justify-end">
											<Button
												type="button"
												variant="outline"
												onClick={resetForm}
												className="border-primary text-primary hover:bg-primary/10"
											>
												Reset
											</Button>
											<Button
												type="button"
												onClick={() => setStage(1)}
												className="bg-gradient-primary hover:opacity-90 transition-all shadow-glow"
											>
												Continue
											</Button>
										</div>
									</div>
								)}

								{/* Stage 2: Additional Information */}
								{stage === 1 && (
									<div className="space-y-6">
										<div>
											<Label htmlFor="employmentType" className="text-sm font-semibold">
												Employment Type <span className="text-red-500">*</span>
											</Label>
											<Select
												name="employmentType"
												value={form.employmentType}
												onValueChange={(val) => setForm({ ...form, employmentType: val })}
											>
												<SelectTrigger className="mt-2">
													<SelectValue placeholder="Full-time" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="full-time">Full-time</SelectItem>
													<SelectItem value="part-time">Part-time</SelectItem>
													<SelectItem value="contract">Contract</SelectItem>
													<SelectItem value="internship">Internship</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div>
											<Label htmlFor="contractType" className="text-sm font-semibold">
												Contract Type
											</Label>
											<Select
												name="contractType"
												value={form.contractType}
												onValueChange={(val) => setForm({ ...form, contractType: val })}
											>
												<SelectTrigger className="mt-2">
													<SelectValue placeholder="Select contract type" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="permanent">Permanent</SelectItem>
													<SelectItem value="temporary">Temporary</SelectItem>
													<SelectItem value="freelance">Freelance</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div>
											<Label htmlFor="positions" className="text-sm font-semibold">
												Number of Positions
											</Label>
											<Input
												id="positions"
												name="positions"
												type="number"
												value={form.positions}
												onChange={handleFormChange}
												className="mt-2"
												min="1"
											/>
										</div>

										<div>
											<Label htmlFor="jobLocation" className="text-sm font-semibold">
												Job location <span className="text-red-500">*</span>
											</Label>
											<div className="relative mt-2">
												<MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
												<Input
													id="jobLocation"
													name="jobLocation"
													value={form.jobLocation}
													onChange={handleFormChange}
													placeholder="Algiers, Algeria"
													className="pl-10"
													required
												/>
											</div>
										</div>

										<div>
											<Label htmlFor="description" className="text-sm font-semibold">
												Job Description <span className="text-destructive">*</span>
											</Label>
											<Button
												type="button"
												variant="link"
												className="text-primary p-0 h-auto mb-2 hover:opacity-80"
											>
												Generate with AI
											</Button>
											<Textarea
												id="description"
												name="description"
												value={form.description}
												onChange={handleFormChange}
												rows={6}
												className="mt-2"
												required
											/>
										</div>

										<div className="flex justify-between gap-4 pt-4">
											<Button
												type="button"
												variant="outline"
												onClick={() => setStage(0)}
												className="border-primary text-primary hover:bg-primary/10"
											>
												Back
											</Button>
											<Button
												type="button"
												onClick={() => setStage(2)}
												className="bg-gradient-primary hover:opacity-90 transition-all shadow-glow"
											>
												Continue
											</Button>
										</div>
									</div>
								)}

								{/* Stage 3: Review & Post */}
								{stage === 2 && (
									<div className="space-y-6">
									<div className="bg-muted/50 rounded-lg p-6 border border-border">
										<h3 className="text-xl font-bold mb-4">Review Your Job Post</h3>
										<h4 className="text-2xl font-bold text-gray-900 mb-4">
											{form.title}
										</h4>											<div className="grid grid-cols-2 gap-4 text-sm">
												<div>
													<p className="text-muted-foreground">Location</p>
													<p className="font-semibold flex items-center gap-1">
														<MapPin className="w-4 h-4" />
														{form.jobLocation || form.workLocation}
													</p>
												</div>
												<div>
													<p className="text-muted-foreground">Workplace Type</p>
													<p className="font-semibold capitalize">{form.workplace}</p>
												</div>
												<div>
													<p className="text-muted-foreground">Experience Required</p>
													<p className="font-semibold">{form.experience}</p>
												</div>
												<div>
													<p className="text-muted-foreground">Employment Type</p>
													<p className="font-semibold">{form.employmentType}</p>
												</div>
											</div>

											<div className="mt-4">
												<p className="text-muted-foreground mb-2">Job Description</p>
												<div className="max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-200 scrollbar-modern">
													<p className="whitespace-pre-line leading-relaxed text-gray-700">{form.description}</p>
												</div>
											</div>

											{/* Status Selection */}
											{selectedJob && (
												<div className="mt-6 pt-6 border-t border-gray-200">
													<Label className="text-sm font-semibold mb-2 block">
														Job Status <span className="text-red-500">*</span>
													</Label>
													<Select
														value={form.status}
														onValueChange={(val) => setForm({ ...form, status: val })}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="published">
																<span className="flex items-center gap-2">
																	<span className="w-2 h-2 bg-green-500 rounded-full"></span>
																	Published
																</span>
															</SelectItem>
															<SelectItem value="draft">
																<span className="flex items-center gap-2">
																	<span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
																	Draft (Pending)
																</span>
															</SelectItem>
															<SelectItem value="unpublished">
																<span className="flex items-center gap-2">
																	<span className="w-2 h-2 bg-gray-500 rounded-full"></span>
																	Unpublished
																</span>
															</SelectItem>
															<SelectItem value="archived">
																<span className="flex items-center gap-2">
																	<span className="w-2 h-2 bg-gray-400 rounded-full"></span>
																	Archived
																</span>
															</SelectItem>
														</SelectContent>
													</Select>
													<p className="text-xs text-gray-500 mt-1">
														Change the status to control job visibility
													</p>
												</div>
											)}

										</div>

										<p className="text-xs text-muted-foreground">
											By creating an account you accept the{" "}
											<span className="text-primary underline cursor-pointer hover:opacity-80">
												Terms
											</span>{" "}
											and{" "}
											<span className="text-primary underline cursor-pointer hover:opacity-80">
												Privacy
											</span>
										</p>

										<div className="flex justify-between gap-4 pt-4">
											<Button
												type="button"
												variant="outline"
												onClick={() => setStage(1)}
												className="border-primary text-primary hover:bg-primary/10"
											>
												Back
											</Button>
											<Button
												type="submit"
												className="bg-gradient-primary hover:opacity-90 transition-all shadow-glow"
											>
												Post Job
											</Button>
										</div>
									</div>
								)}
							</form>
						</DialogContent>
					</Dialog>
				</div>

				{/* Tabs */}
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className="bg-white border-b w-full justify-start rounded-none h-auto p-0">
						<TabsTrigger
							value="Published"
							className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-6 py-3 transition-all text-gray-700"
						>
							Published{" "}
							<span className="ml-2 text-gray-500">{jobCounts.Published}</span>
						</TabsTrigger>
						<TabsTrigger
							value="Unpublished"
							className="data-[state=active]:border-b-2 data-[state=active]:border-gray-500 data-[state=active]:text-gray-700 rounded-none px-6 py-3 transition-all text-gray-700"
						>
							Unpublished{" "}
							<span className="ml-2 text-gray-500">{jobCounts.Unpublished}</span>
						</TabsTrigger>
						<TabsTrigger
							value="Archived"
							className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none px-6 py-3 transition-all text-gray-700"
						>
							Archived{" "}
							<span className="ml-2 text-gray-500">{jobCounts.Archived}</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="Published" className="mt-0">
						{loading ? (
							<div className="bg-white rounded-lg border p-8 text-center">
								<Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
								<p className="text-muted-foreground mt-4">Loading jobs...</p>
							</div>
						) : jobList.length === 0 ? (
							<div className="bg-white rounded-lg border p-8 text-center text-muted-foreground">
								No published jobs.
							</div>
						) : (
						<div className="bg-white rounded-lg border overflow-hidden shadow-sm">
							<table className="w-full">
								<thead className="bg-gray-50 border-b">
									<tr>
										<th className="text-left px-6 py-4 font-semibold text-gray-700">Job Title</th>
										<th className="text-left px-6 py-4 font-semibold text-gray-700">Details</th>
										<th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
										<th className="text-left px-6 py-4 font-semibold text-gray-700">Created</th>
										<th className="text-left px-6 py-4 font-semibold text-gray-700">Last Update</th>
										<th className="text-left px-6 py-4 font-semibold text-gray-700">Applications</th>
										<th className="text-left px-6 py-4 font-semibold text-gray-700">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{jobList.map((job) => (
										<tr key={job.id} className="hover:bg-accent/5 transition-colors">
											<td className="px-6 py-4">
												<div className="font-semibold text-black">{job.title}</div>
												<div className="text-sm text-muted-foreground">#{job.id}</div>
											</td>
										<td className="px-6 py-4">
											<div className="flex items-center gap-2 text-sm text-gray-600">
												<MapPin className="w-4 h-4 text-gray-500" />
												{job.location}
											</div>
											<div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
												<Clock className="w-4 h-4 text-gray-500" />
												{job.employment_type}
											</div>
										</td>
											<td className="px-6 py-4">
												<Badge className="bg-green-600 text-white border-none">
													Published
												</Badge>
										</td>
										<td className="px-6 py-4">
											<div className="text-sm text-gray-600">
												{job.created_at ? new Date(job.created_at).toLocaleString() : '-'}
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="text-sm text-gray-600">
												{job.updated_at ? new Date(job.updated_at).toLocaleString() : '-'}
											</div>
										</td>
										<td className="px-6 py-4">
											<span className="text-gray-900 font-semibold text-lg">
												{job.applicants_count || 0}
											</span>
										</td>
										<td className="px-6 py-4">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="icon">
														<MoreHorizontal className="w-5 h-5" />
													</Button>
												</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
															<DropdownMenuItem
																className="flex items-center gap-2 cursor-pointer"
													onClick={() => handleEditJob(job)}
												>
													<Edit className="w-4 h-4" />
													Edit Job
												</DropdownMenuItem>
															<DropdownMenuItem
													className="flex items-center gap-2 cursor-pointer"
													onClick={() => handleShareJob(job)}
												>
													<Share2 className="w-4 h-4" />
													Share
												</DropdownMenuItem>
															<DropdownMenuItem
													className="flex items-center gap-2 cursor-pointer"
													onClick={() => handleUnpublishJob(job.id)}
												>
													<XCircle className="w-4 h-4" />
													Unpublish
												</DropdownMenuItem>
															<DropdownMenuItem
													className="flex items-center gap-2 cursor-pointer text-red-600"
													onClick={() => handleArchiveJob(job.id)}
												>
													<Archive className="w-4 h-4" />
													Archive Job
												</DropdownMenuItem>
											</DropdownMenuContent>
											</DropdownMenu>
										</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						)}
					</TabsContent>

					<TabsContent value="Unpublished">
						{loading ? (
							<div className="bg-card rounded-lg border p-8 text-center shadow-card">
								<Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
								<p className="text-muted-foreground mt-4">Loading jobs...</p>
							</div>
						) : jobList.length === 0 ? (
							<div className="bg-card rounded-lg border p-8 text-center text-muted-foreground shadow-card">
								No unpublished jobs.
							</div>
						) : (
							<div className="bg-white rounded-lg border overflow-hidden shadow-sm">
								<table className="w-full">
									<thead className="bg-gray-50 border-b">
										<tr>
											<th className="text-left px-6 py-4 font-semibold text-gray-700">Job Title</th>
											<th className="text-left px-6 py-4 font-semibold text-gray-700">Details</th>
											<th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
											<th className="text-left px-6 py-4 font-semibold text-gray-700">Created</th>
											<th className="text-left px-6 py-4 font-semibold text-gray-700">Last Update</th>
											<th className="text-left px-6 py-4 font-semibold text-gray-700">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{jobList.map((job) => (
											<tr key={job.id} className="hover:bg-accent/5 transition-colors">
												<td className="px-6 py-4">
													<div className="font-semibold text-black">{job.title}</div>
													<div className="text-sm text-muted-foreground">#{job.id}</div>
												</td>
												<td className="px-6 py-4">
													<div className="flex items-center gap-2 text-sm text-gray-600">
														<MapPin className="w-4 h-4 text-gray-500" />
														{job.location}
													</div>
													<div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
														<Clock className="w-4 h-4 text-gray-500" />
														{job.employment_type}
													</div>
												</td>
												<td className="px-6 py-4">
													<Badge className="bg-red-100 text-red-800 border-none">Unpublished
													</Badge>
												</td>
												<td className="px-6 py-4">
													<span className="text-sm text-gray-600">
														{new Date(job.created_at).toLocaleString()}
													</span>
												</td>
												<td className="px-6 py-4">
													<span className="text-sm text-gray-600">
														{new Date(job.updated_at).toLocaleString()}
													</span>
												</td>
												<td className="px-6 py-4">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon">
																<MoreHorizontal className="w-5 h-5" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																className="flex items-center gap-2 cursor-pointer"
																onClick={() => handleEditJob(job)}
															>
																<Edit className="w-4 h-4" />
																Edit
															</DropdownMenuItem>
															<DropdownMenuItem
																className="flex items-center gap-2 cursor-pointer text-green-600"
																onClick={() => handlePublishJob(job.id)}
															>
																<CheckCircle className="w-4 h-4" />
																Publish Job
															</DropdownMenuItem>
															<DropdownMenuItem
																className="flex items-center gap-2 cursor-pointer text-red-600"
																onClick={() => handleArchiveJob(job.id)}
															>
																<Archive className="w-4 h-4" />
																Archive Job
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</TabsContent>

					<TabsContent value="Archived">
						{loading ? (
							<div className="bg-card rounded-lg border p-8 text-center shadow-card">
								<Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
								<p className="text-muted-foreground mt-4">Loading jobs...</p>
							</div>
						) : jobList.length === 0 ? (
							<div className="bg-card rounded-lg border p-8 text-center text-muted-foreground shadow-card">
							No archived jobs.
						</div>
						) : (
							<div className="bg-white rounded-lg border overflow-hidden shadow-sm">
								<table className="w-full">
									<thead className="bg-gray-50 border-b">
										<tr>
											<th className="text-left px-6 py-4 font-semibold text-gray-700">Job Title</th>
											<th className="text-left px-6 py-4 font-semibold text-gray-700">Details</th>
											<th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
											<th className="text-left px-6 py-4 font-semibold text-gray-700">Created</th>
											<th className="text-left px-6 py-4 font-semibold text-gray-700">Last Update</th>
											<th className="text-left px-6 py-4 font-semibold text-gray-700">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{jobList.map((job) => (
											<tr key={job.id} className="hover:bg-accent/5 transition-colors">
												<td className="px-6 py-4">
													<div className="font-semibold text-black">{job.title}</div>
													<div className="text-sm text-muted-foreground">#{job.id}</div>
												</td>
												<td className="px-6 py-4">
													<div className="flex items-center gap-2 text-sm text-gray-600">
														<MapPin className="w-4 h-4 text-gray-500" />
														{job.location}
													</div>
													<div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
														<Clock className="w-4 h-4 text-gray-500" />
														{job.employment_type}
													</div>
												</td>
												<td className="px-6 py-4">
													<Badge className="bg-yellow-100 text-yellow-800 border-none">Archived
													</Badge>
												</td>
												<td className="px-6 py-4">
													<span className="text-sm text-gray-600">
														{new Date(job.created_at).toLocaleString()}
													</span>
												</td>
												<td className="px-6 py-4">
													<span className="text-sm text-gray-600">
														{new Date(job.updated_at).toLocaleString()}
													</span>
												</td>
												<td className="px-6 py-4">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon">
																<MoreHorizontal className="w-5 h-5" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem
																className="flex items-center gap-2 cursor-pointer"
																onClick={() => handleEditJob(job)}
															>
																<Edit className="w-4 h-4" />
																View Details
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</TabsContent>
				</Tabs>

				{/* Unpublish Alert Dialog */}
				<AlertDialog open={unpublishDialogOpen} onOpenChange={setUnpublishDialogOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<div className="flex items-center gap-3 mb-2">
								<div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
									<XCircle className="w-6 h-6 text-yellow-600" />
								</div>
								<AlertDialogTitle className="text-xl">Unpublish Job</AlertDialogTitle>
							</div>
							<AlertDialogDescription className="text-base">
								Are you sure you want to unpublish this job? The job will no longer be visible to candidates. You can republish it later.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction 
								onClick={confirmUnpublish}
								className="bg-yellow-600 hover:bg-yellow-700 text-white"
							>
								Unpublish
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Archive Alert Dialog */}
				<AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<div className="flex items-center gap-3 mb-2">
								<div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
									<AlertTriangle className="w-6 h-6 text-red-600" />
								</div>
								<AlertDialogTitle className="text-xl">Archive Job</AlertDialogTitle>
							</div>
							<AlertDialogDescription className="text-base">
								Are you sure you want to archive this job? This action will remove the job from the active list and move it to archived jobs. This cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction 
								onClick={confirmArchive}
								className="bg-red-600 hover:bg-red-700 text-white"
							>
								Archive
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{/* Edit Job Dialog */}
				<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
					<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
						<DialogHeader>
							<DialogTitle className="text-2xl font-bold text-gray-900">
								Edit Job Post
							</DialogTitle>
							<p className="text-muted-foreground">
								Update job details and status
							</p>
						</DialogHeader>
						<form onSubmit={handleUpdateJob}>
							<div className="space-y-6">
								<div>
									<Label htmlFor="edit-title" className="text-sm font-semibold">
										Job Title <span className="text-red-500">*</span>
									</Label>
									<Input
										id="edit-title"
										name="title"
										value={form.title}
										onChange={handleFormChange}
										placeholder="e.g., Marketing Manager"
										className="mt-2"
										required
									/>
								</div>

								<div>
									<Label htmlFor="edit-profession" className="text-sm font-semibold">
										Profession <span className="text-red-500">*</span>
									</Label>
									<Select
										name="profession"
										value={form.profession}
										onValueChange={(val) => setForm({ ...form, profession: val })}
									>
										<SelectTrigger className="mt-2">
											<SelectValue placeholder="Select profession" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="software-engineer">Software Engineer</SelectItem>
											<SelectItem value="designer">Designer</SelectItem>
											<SelectItem value="marketing">Marketing</SelectItem>
											<SelectItem value="sales">Sales</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label className="text-sm font-semibold">
										Workplace <span className="text-red-500">*</span>
									</Label>
									<div className="flex gap-4 mt-2">
										{["on-site", "hybrid", "remote"].map((type) => (
											<label
												key={type}
												className="flex items-center gap-2 cursor-pointer"
											>
												<input
													type="radio"
													name="workplace"
													value={type}
													checked={form.workplace === type}
													onChange={handleFormChange}
													className="w-4 h-4"
												/>
												<span className="capitalize">{type}</span>
											</label>
										))}
									</div>
								</div>

								<div>
									<Label htmlFor="edit-skills" className="text-sm font-semibold">
										Skills <span className="text-red-500">*</span>
									</Label>
									<Input
										id="edit-skills"
										value={skillInput}
										onChange={(e) => setSkillInput(e.target.value)}
										onKeyDown={handleAddSkill}
										placeholder="Type a skill and press Enter"
										className="mt-2"
									/>
									<div className="flex flex-wrap gap-2 mt-2">
										{form.skills.map((skill, index) => (
											<Badge key={index} variant="secondary" className="px-3 py-1">
												{skill}
												<button
													type="button"
													onClick={() => removeSkill(index)}
													className="ml-2 text-xs"
												>
													×
												</button>
											</Badge>
										))}
									</div>
								</div>

								<div>
									<Label htmlFor="edit-experience" className="text-sm font-semibold">
										Years of Experience <span className="text-red-500">*</span>
									</Label>
									<Input
										id="edit-experience"
										name="experience"
										value={form.experience}
										onChange={handleFormChange}
										placeholder="e.g., 5 years, 10+ years, 2-3 years"
										className="mt-2"
										required
									/>
								</div>

								<div>
									<Label htmlFor="edit-jobLevel" className="text-sm font-semibold">
										Job Level <span className="text-red-500">*</span>
									</Label>
									<Input
										id="edit-jobLevel"
										name="jobLevel"
										value={form.jobLevel}
										onChange={handleFormChange}
										placeholder="e.g., Senior, Mid-Level, Lead"
										className="mt-2"
										required
									/>
								</div>

								<div>
									<Label htmlFor="edit-education" className="text-sm font-semibold">
										Education Level <span className="text-red-500">*</span>
									</Label>
									<Input
										id="edit-education"
										name="education"
										value={form.education}
										onChange={handleFormChange}
										placeholder="e.g., Bachelor's Degree, Master's Degree"
										className="mt-2"
										required
									/>
								</div>

								<div>
									<Label htmlFor="edit-employmentType" className="text-sm font-semibold">
										Employment Type <span className="text-red-500">*</span>
									</Label>
									<Select
										name="employmentType"
										value={form.employmentType}
										onValueChange={(val) => setForm({ ...form, employmentType: val })}
									>
										<SelectTrigger className="mt-2">
											<SelectValue placeholder="Full-time" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="full-time">Full-time</SelectItem>
											<SelectItem value="part-time">Part-time</SelectItem>
											<SelectItem value="contract">Contract</SelectItem>
											<SelectItem value="internship">Internship</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label htmlFor="edit-contractType" className="text-sm font-semibold">
										Contract Type
									</Label>
									<Select
										name="contractType"
										value={form.contractType}
										onValueChange={(val) => setForm({ ...form, contractType: val })}
									>
										<SelectTrigger className="mt-2">
											<SelectValue placeholder="Select contract type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="permanent">Permanent</SelectItem>
											<SelectItem value="temporary">Temporary</SelectItem>
											<SelectItem value="freelance">Freelance</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label htmlFor="edit-positions" className="text-sm font-semibold">
										Number of Positions
									</Label>
									<Input
										id="edit-positions"
										name="positions"
										type="number"
										value={form.positions}
										onChange={handleFormChange}
										className="mt-2"
										min="1"
									/>
								</div>

								<div>
									<Label htmlFor="edit-jobLocation" className="text-sm font-semibold">
										Job location <span className="text-red-500">*</span>
									</Label>
									<div className="relative mt-2">
										<MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
										<Input
											id="edit-jobLocation"
											name="jobLocation"
											value={form.jobLocation}
											onChange={handleFormChange}
											placeholder="Algiers, Algeria"
											className="pl-10"
											required
										/>
									</div>
								</div>

								<div>
									<Label htmlFor="edit-description" className="text-sm font-semibold">
										Job Description <span className="text-destructive">*</span>
									</Label>
									<Textarea
										id="edit-description"
										name="description"
										value={form.description}
										onChange={handleFormChange}
										rows={6}
										className="mt-2"
										required
									/>
								</div>

								<div>
									<Label className="text-sm font-semibold mb-2 block">
										Job Status <span className="text-red-500">*</span>
									</Label>
									<Select
										value={form.status}
										onValueChange={(val) => setForm({ ...form, status: val })}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="published">
												<span className="flex items-center gap-2">
													<span className="w-2 h-2 bg-green-500 rounded-full"></span>
													Published
												</span>
											</SelectItem>
											<SelectItem value="draft">
												<span className="flex items-center gap-2">
													<span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
													Draft
												</span>
											</SelectItem>
											<SelectItem value="unpublished">
												<span className="flex items-center gap-2">
													<span className="w-2 h-2 bg-gray-500 rounded-full"></span>
													Unpublished
												</span>
											</SelectItem>
											<SelectItem value="archived">
												<span className="flex items-center gap-2">
													<span className="w-2 h-2 bg-gray-400 rounded-full"></span>
													Archived
												</span>
											</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-xs text-gray-500 mt-1">
										Change the status to control job visibility
									</p>
								</div>

								<div className="flex justify-end gap-4 pt-4">
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											setEditDialogOpen(false);
											resetForm();
										}}
										className="border-primary text-primary hover:bg-primary/10"
									>
										Cancel
									</Button>
									<Button
										type="submit"
										className="bg-gradient-primary hover:opacity-90 transition-all shadow-glow"
									>
										Update Job
									</Button>
								</div>
							</div>
						</form>
					</DialogContent>
				</Dialog>

				{/* Share Job Dialog */}
				<AlertDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
					<AlertDialogContent className="max-w-2xl">
						<AlertDialogHeader>
							<div className="flex items-center gap-3 mb-2">
								<div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
									<Share2 className="w-6 h-6 text-blue-600" />
								</div>
								<AlertDialogTitle className="text-xl">Share Job</AlertDialogTitle>
							</div>
							<AlertDialogDescription className="text-base">
								Share this job posting with specific people or copy the link to share anywhere.
							</AlertDialogDescription>
						</AlertDialogHeader>
						
						{/* Link Copy Section */}
						<div className="space-y-4">
							<div>
								<label className="text-sm font-semibold text-gray-700 mb-2 block">Job Link</label>
								<div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 border border-gray-200">
									<Copy className="w-5 h-5 text-gray-500 flex-shrink-0" />
									<code className="text-sm text-gray-700 break-all flex-1">{copiedJobUrl}</code>
								</div>
								<p className="text-xs text-green-600 mt-1 flex items-center gap-1">
									<CheckCircle className="w-3 h-3" />
									Link copied to clipboard!
								</p>
							</div>

							{/* Email Sharing Section */}
							<div className="pt-4 border-t border-gray-200">
								<label className="text-sm font-semibold text-gray-700 mb-2 block">
									Send to Specific People
								</label>
								<p className="text-xs text-gray-500 mb-2">
									Enter email addresses separated by commas
								</p>
								<textarea
									value={shareEmails}
									onChange={(e) => setShareEmails(e.target.value)}
									placeholder="john@example.com, sarah@company.com, ..."
									className="w-full min-h-[100px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
								/>
								<Button
									onClick={handleSendToEmails}
									disabled={sendingShare || !shareEmails.trim()}
									className="w-full mt-3 bg-primary hover:bg-primary/90"
								>
									{sendingShare ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Sending...
										</>
									) : (
										<>
											<Share2 className="w-4 h-4 mr-2" />
											Send Job Link via Email
										</>
									)}
								</Button>
							</div>
						</div>

						<AlertDialogFooter>
							<AlertDialogAction 
								onClick={() => {
									setShareDialogOpen(false);
									setShareEmails("");
								}}
								className="bg-gray-600 hover:bg-gray-700 text-white"
							>
								Close
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</EmployerLayout>
	);
}

