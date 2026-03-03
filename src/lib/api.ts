import { supabase } from './supabase';
import type {
  User,
  Talent,
  Employer,
  Job,
  Application,
  Interview,
  Service,
  Ticket,
  Subscription,
  Plan,
  Notification,
  AuthUser,
  LoginCredentials,
  SignupData,
} from './types';
import bcrypt from 'bcryptjs';

// ============================================
// AUTH API
// ============================================

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthUser | null> {
    try {
      // First, get user by email (without is_active check to provide better error message)
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email)
        .single();

      if (error || !user) {
        throw new Error('Invalid credentials');
      }

      // Check if account is active
      if (!user.is_active) {
        throw new Error('ACCOUNT_INACTIVE');
      }

      // Verify password (in production, this should be done server-side)
      const isValid = await bcrypt.compare(credentials.password, user.password_hash);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Get profile based on role
      let profile = null;
      if (user.user_role === 'talent') {
        const { data } = await supabase
          .from('talents')
          .select('*')
          .eq('user_id', user.id)
          .single();
        profile = data;
      } else if (user.user_role === 'employer' || user.user_role === 'superadmin' || user.user_role === 'admin') {
        const { data } = await supabase
          .from('employers')
          .select('*')
          .eq('user_id', user.id)
          .single();
        profile = data;
      } else if (user.user_role === 'interviewer') {
        const { data } = await supabase
          .from('interviewers')
          .select('*')
          .eq('user_id', user.id)
          .single();
        profile = data;
      } else if (user.user_role === 'owner') {
        const { data } = await supabase
          .from('owners')
          .select('*')
          .eq('user_id', user.id)
          .single();
        profile = data;
      }

      return { ...user, profile };
    } catch (error: any) {
      console.error('Login error:', error);
      // Re-throw specific errors for better handling
      if (error?.message === 'ACCOUNT_INACTIVE') {
        throw error;
      }
      return null;
    }
  },

  async signup(signupData: SignupData): Promise<AuthUser | null> {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(signupData.password, 10);

      // Create user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email: signupData.email,
          password_hash: hashedPassword,
          user_role: signupData.user_role,
          is_active: true,
          email_verified: false,
          profile_completed: false,
        })
        .select()
        .single();

      if (userError || !user) {
        throw new Error('Failed to create user');
      }

      // Create profile based on role
      let profile = null;
      if (signupData.user_role === 'talent' && signupData.profile_data) {
        const { data } = await supabase
          .from('talents')
          .insert({
            user_id: user.id,
            ...signupData.profile_data,
          })
          .select()
          .single();
        profile = data;
      } else if ((signupData.user_role === 'employer' || signupData.user_role === 'superadmin' || signupData.user_role === 'admin') && signupData.profile_data) {
        const { data } = await supabase
          .from('employers')
          .insert({
            user_id: user.id,
            ...signupData.profile_data,
          })
          .select()
          .single();
        profile = data;
      }

      return { ...user, profile };
    } catch (error) {
      console.error('Signup error:', error);
      return null;
    }
  },

  async getCurrentUser(userId: string): Promise<AuthUser | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) return null;

      // Get profile
      let profile = null;
      if (user.user_role === 'talent') {
        const { data } = await supabase
          .from('talents')
          .select('*')
          .eq('user_id', user.id)
          .single();
        profile = data;
      } else if (user.user_role === 'employer' || user.user_role === 'superadmin' || user.user_role === 'admin') {
        const { data } = await supabase
          .from('employers')
          .select('*')
          .eq('user_id', user.id)
          .single();
        profile = data;
      } else if (user.user_role === 'interviewer') {
        const { data } = await supabase
          .from('interviewers')
          .select('*')
          .eq('user_id', user.id)
          .single();
        profile = data;
      }

      return { ...user, profile };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },
};

// ============================================
// JOBS API
// ============================================

export const jobsApi = {
  async getAll(filters?: { status?: string; employer_id?: string }) {
    let query = supabase.from('jobs').select('*, employers(company_name, logo_url, industry)');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.employer_id) {
      query = query.eq('employer_id', filters.employer_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, employers(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(job: Partial<Job>) {
    const { data, error } = await supabase.from('jobs').insert(job).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, job: Partial<Job>) {
    const { data, error } = await supabase
      .from('jobs')
      .update(job)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) throw error;
  },

  async incrementViewCount(id: string) {
    const { error } = await supabase.rpc('increment_view_count', { job_id: id });
    if (error) console.error('Failed to increment view count:', error);
  },
};

// ============================================
// APPLICATIONS API
// ============================================

export const applicationsApi = {
  async getAll(filters?: { job_id?: string; talent_id?: string; employer_id?: string; status?: string }) {
    let query = supabase
      .from('applications')
      .select('*, jobs(title, location), talents(full_name, phone_number, skills), employers(company_name)');

    if (filters?.job_id) query = query.eq('job_id', filters.job_id);
    if (filters?.talent_id) query = query.eq('talent_id', filters.talent_id);
    if (filters?.employer_id) query = query.eq('employer_id', filters.employer_id);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query.order('applied_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('*, jobs(*), talents(*), employers(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(application: Partial<Application>) {
    const { data, error } = await supabase
      .from('applications')
      .insert(application)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, application: Partial<Application>) {
    const { data, error } = await supabase
      .from('applications')
      .update(application)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStage(id: string, stage: string, status: string) {
    const { data, error } = await supabase
      .from('applications')
      .update({ stage, status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================
// INTERVIEWS API
// ============================================

export const interviewsApi = {
  async getAll(filters?: { employer_id?: string; talent_id?: string; interviewer_id?: string; status?: string }) {
    let query = supabase
      .from('interviews')
      .select('*, applications(*), talents(full_name), interviewers(full_name), employers(company_name)');

    if (filters?.employer_id) query = query.eq('employer_id', filters.employer_id);
    if (filters?.talent_id) query = query.eq('talent_id', filters.talent_id);
    if (filters?.interviewer_id) query = query.eq('interviewer_id', filters.interviewer_id);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query.order('scheduled_date', { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(interview: Partial<Interview>) {
    const { data, error } = await supabase
      .from('interviews')
      .insert(interview)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, interview: Partial<Interview>) {
    const { data, error } = await supabase
      .from('interviews')
      .update(interview)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================
// TALENTS API
// ============================================

export const talentsApi = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('talents')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, talent: Partial<Talent>) {
    const { data, error } = await supabase
      .from('talents')
      .update(talent)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getServices(talentId: string) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('talent_id', talentId)
      .eq('is_active', true);
    if (error) throw error;
    return data;
  },
};

// ============================================
// SERVICES API
// ============================================

export const servicesApi = {
  async getAll(talentId: string) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('talent_id', talentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Service[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Service;
  },

  async create(talentId: string, service: Partial<Service>) {
    const { data, error } = await supabase
      .from('services')
      .insert({
        talent_id: talentId,
        ...service,
        is_active: true,
        reviews_count: 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Service;
  },

  async update(id: string, service: Partial<Service>) {
    const { data, error } = await supabase
      .from('services')
      .update({
        ...service,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Service;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async toggleActive(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('services')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Service;
  },
};

// ============================================
// EMPLOYERS API
// ============================================

export const employersApi = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('employers')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, employer: Partial<Employer>) {
    const { data, error } = await supabase
      .from('employers')
      .update(employer)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getSubscription(employerId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq('employer_id', employerId)
      .eq('status', 'active')
      .maybeSingle();
    if (error) return null;
    return data;
  },
};

// ============================================
// PLANS API
// ============================================

export const plansApi = {
  async getAll(filters?: { target_user_type?: 'employer' | 'talent'; is_active?: boolean }) {
    let query = supabase.from('plans').select('*');

    if (filters?.target_user_type) query = query.eq('target_user_type', filters.target_user_type);
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);

    const { data, error } = await query.order('sort_order', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================
// SUBSCRIPTIONS API
// ============================================

export const subscriptionsApi = {
  async getByUserId(userId: string, userType: 'employer' | 'talent') {
    const column = userType === 'employer' ? 'employer_id' : 'talent_id';
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(*)')
      .eq(column, userId)
      .eq('status', 'active')
      .maybeSingle();
    if (error) return null;
    return data;
  },

  async create(subscription: Partial<Subscription>) {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscription)
      .select('*, plan:plans(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, subscription: Partial<Subscription>) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(subscription)
      .eq('id', id)
      .select('*, plan:plans(*)')
      .single();
    if (error) throw error;
    return data;
  },

  async cancel(id: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled', auto_renew: false })
      .eq('id', id)
      .select('*, plan:plans(*)')
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================
// TICKETS API
// ============================================

export const ticketsApi = {
  async getAll(filters?: { user_id?: string; status?: string }) {
    let query = supabase.from('tickets').select('*');

    if (filters?.user_id) query = query.eq('user_id', filters.user_id);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(ticket: Partial<Ticket>) {
    const { data, error } = await supabase
      .from('tickets')
      .insert(ticket)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, ticket: Partial<Ticket>) {
    const { data, error } = await supabase
      .from('tickets')
      .update(ticket)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================
// NOTIFICATIONS API
// ============================================

export const notificationsApi = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  },
};

// ============================================
// SAVED JOBS API
// ============================================

export const savedJobsApi = {
  async getAll(talentId: string) {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*, jobs(*, employers(company_name, logo_url))')
      .eq('talent_id', talentId);
    if (error) throw error;
    return data;
  },

  async save(talentId: string, jobId: string) {
    const { data, error } = await supabase
      .from('saved_jobs')
      .insert({ talent_id: talentId, job_id: jobId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async unsave(talentId: string, jobId: string) {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('talent_id', talentId)
      .eq('job_id', jobId);
    if (error) throw error;
  },
};
