// Database Types
export type UserRole = 'superadmin' | 'admin' | 'owner' | 'talent' | 'employer' | 'interviewer';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  user_role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Talent {
  id: string;
  user_id: string;
  full_name: string;
  phone_number?: string;
  city?: string;
  current_position?: string;
  years_of_experience?: string;
  education_level?: string;
  job_types?: string[];
  work_location?: string[];
  short_bio?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  has_carte_entrepreneur: boolean;
  skills?: string[];
  profile_photo_url?: string;
  resume_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Employer {
  id: string;
  user_id: string;
  company_name: string;
  tagline?: string;
  description?: string;
  industry?: string;
  website?: string;
  company_size?: string;
  year_founded?: string;
  address?: string;
  city?: string;
  country?: string;
  zip_code?: string;
  linkedin_url?: string;
  facebook_url?: string;
  logo_url?: string;
  rep_first_name?: string;
  rep_last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Interviewer {
  id: string;
  user_id: string;
  full_name: string;
  department?: string;
  expertise?: string[];
  availability?: any;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface Owner {
  id: string;
  user_id: string;
  full_name: string;
  phone_number?: string;
  city?: string;
  country?: string;
  bio?: string;
  profile_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  profession?: string;
  description?: string;
  location?: string;
  workplace?: 'on-site' | 'remote' | 'hybrid';
  employment_type?: 'full-time' | 'part-time' | 'contract' | 'internship';
  contract_type?: string;
  experience_level?: string;
  job_level?: string;
  education_required?: string;
  skills_required?: string[];
  salary_min?: number;
  salary_max?: number;
  positions_available: number;
  status: 'draft' | 'published' | 'closed' | 'archived';
  applicants_count: number;
  views_count: number;
  published_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  talent_id: string;
  employer_id: string;
  status: 'pending' | 'in-progress' | 'shortlisted' | 'interview-scheduled' | 'offered' | 'hired' | 'rejected' | 'maybe' | 'archived';
  stage?: 'to-contact' | 'talent-acquisition' | 'technical' | 'leadership' | 'offer' | 'rejected-offer' | 'hired';
  match_score?: number;
  cover_letter?: string;
  resume_url?: string;
  applied_at: string;
  reviewed_at?: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  interviewer_id?: string;
  employer_id: string;
  talent_id: string;
  interview_type?: 'technical' | 'leadership' | 'talent-acquisition' | 'final';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'no-show';
  scheduled_date: string;
  duration_minutes: number;
  meeting_link?: string;
  location?: string;
  notes?: string;
  feedback?: string;
  rating?: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  talent_id: string;
  title: string;
  description?: string;
  category?: string;
  starting_price?: number;
  delivery_time?: string;
  rating?: number;
  reviews_count: number;
  tags?: string[];
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  sender_name: string;
  subject: string;
  message: string;
  ticket_type: 'Technical' | 'Bug Report' | 'Feature Request' | 'Billing' | 'General';
  status: 'open' | 'viewed' | 'in-progress' | 'solved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface Plan {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  target_user_type: 'employer' | 'talent';
  price: number;
  billing_cycle?: 'monthly' | 'quarterly' | 'annually' | 'one-time';
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  max_job_posts?: number;
  max_active_jobs?: number;
  max_users?: number;
  max_service_posts?: number;
  max_active_services?: number;
  features?: any;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  plan_id: string;
  employer_id?: string;
  talent_id?: string;
  status: 'active' | 'cancelled' | 'expired' | 'suspended' | 'trial';
  started_at: string;
  expires_at?: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  plan?: Plan; // Optional joined plan data
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type?: 'application' | 'interview' | 'job' | 'message' | 'system';
  related_id?: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

// Auth Types
export interface AuthUser extends User {
  profile?: Talent | Employer | Interviewer | Owner;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  user_role: UserRole;
  profile_data?: Partial<Talent | Employer>;
}
