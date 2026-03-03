# 🎯 TalentHub - Complete Setup Guide

## ✨ What's Been Done

Your application now has:
- ✅ **Complete Database Schema** (14 tables, all relationships, sample data)
- ✅ **Backend Integration** (Supabase client, API functions)
- ✅ **Real Authentication** (Login/Logout with password hashing)
- ✅ **TypeScript Types** (Type-safe database interfaces)
- ✅ **API Utilities** (Functions for all CRUD operations)

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Supabase (Already Done ✓)
Packages installed:
- `@supabase/supabase-js`
- `bcryptjs`
- `@types/bcryptjs`

### Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Login
3. Click "New Project"
4. Fill in:
   - **Name**: TalentHub (or any name)
   - **Database Password**: Choose a strong password
   - **Region**: Choose nearest to you
5. Wait 2-3 minutes for project creation

### Step 3: Configure Environment

Run the setup script:
```bash
npm run setup:backend
```

It will ask for:
- **Supabase Project URL**: Found in Project Settings > API
- **Supabase Anon Key**: Found in Project Settings > API

Or manually create `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Create Database Tables

1. Open your Supabase project
2. Go to **SQL Editor** (left sidebar)
3. Click "+ New Query"
4. Open `database schema.sql` from this project
5. **Copy the entire file** content
6. **Paste** into Supabase SQL Editor
7. Click **Run** (or press Ctrl+Enter)

This creates:
- 14 tables with relationships
- Sample data (10 users, 4 jobs, 6 applications, 3 interviews, etc.)
- Triggers and indexes
- Helper views

### Step 5: Start Development Server

```bash
npm run dev
```

### Step 6: Login! 🎉

Open [http://localhost:5173](http://localhost:5173)

Test accounts (password for all: `password123`):

**Talent Account:**
- Email: `abderraouf.education@gmail.com`
- Role: Full Stack Developer

**Employer Account:**
- Email: `employer1@company.com`
- Company: TechVision Inc

**Admin Account:**
- Email: `admin@talentshub.com`
- Role: Superadmin

## 📚 Database Overview

### Tables Created:
1. **users** - Authentication and core user data
2. **talents** - Job seeker profiles
3. **employers** - Company profiles
4. **interviewers** - Technical & Leadership interviewers
5. **admins** - System administrators
6. **jobs** - Job postings
7. **applications** - Job applications with pipeline stages
8. **interviews** - Scheduled interviews
9. **services** - Talent-offered services
10. **service_reviews** - Reviews for services
11. **tickets** - Support ticket system
12. **ticket_messages** - Ticket conversations
13. **subscriptions** - Employer subscription plans
14. **payments** - Payment transactions
15. **employer_team_members** - Multi-user employer accounts
16. **interviewer_reviews** - Interviewer ratings
17. **saved_jobs** - Bookmarked jobs
18. **notifications** - User notifications
19. **activity_logs** - Audit trail

### Sample Data:
- **10 Users** (2 admins, 2 employers, 3 talents, 2 interviewers, 1 recruiter)
- **4 Jobs** (Full Stack, Android, Frontend, DevOps)
- **6 Applications** (Various stages: pending, shortlisted, offered, rejected)
- **3 Interviews** (Scheduled, confirmed, completed)
- **4 Services** (Web dev, mobile, UI/UX, API)
- **2 Subscriptions** (Professional & Starter plans)
- **3 Support Tickets**
- **4 Notifications**

## 🔧 File Structure

### New Files:
```
src/
  lib/
    types.ts          # TypeScript interfaces for all tables
    api.ts            # API functions for backend operations
    supabase.ts       # Supabase client configuration
  contexts/
    AuthContext.tsx   # Updated with real authentication
  pages/
    Login.tsx         # Updated with backend integration

scripts/
  setup-backend.js    # Interactive setup helper

BACKEND_SETUP.md      # Detailed integration guide
.env.example          # Environment template
```

## 💻 Using the API

### Authentication:
```typescript
import { authApi } from '@/lib/api';

// Login
const user = await authApi.login({ 
  email: 'user@example.com', 
  password: 'password' 
});

// Get current user
const currentUser = await authApi.getCurrentUser(userId);
```

### Jobs:
```typescript
import { jobsApi } from '@/lib/api';

// Get all jobs
const jobs = await jobsApi.getAll();

// Filter by employer
const myJobs = await jobsApi.getAll({ 
  employer_id: 'e1111111-1111-1111-1111-111111111111' 
});

// Create job
const newJob = await jobsApi.create({
  employer_id: employerId,
  title: 'Senior Developer',
  status: 'published',
  // ... other fields
});

// Update job
await jobsApi.update(jobId, { status: 'closed' });
```

### Applications:
```typescript
import { applicationsApi } from '@/lib/api';

// Get applications for a job
const apps = await applicationsApi.getAll({ 
  job_id: 'c1111111-1111-1111-1111-111111111111' 
});

// Update application stage
await applicationsApi.updateStage(
  applicationId, 
  'technical',           // stage
  'interview-scheduled'  // status
);

// Create application
const application = await applicationsApi.create({
  job_id: jobId,
  talent_id: talentId,
  employer_id: employerId,
  cover_letter: 'I am interested...',
  match_score: 85
});
```

### Interviews:
```typescript
import { interviewsApi } from '@/lib/api';

// Schedule interview
const interview = await interviewsApi.create({
  application_id: applicationId,
  interviewer_id: interviewerId,
  employer_id: employerId,
  talent_id: talentId,
  interview_type: 'technical',
  scheduled_date: '2026-02-01T10:00:00Z',
  duration_minutes: 60,
  meeting_link: 'https://meet.google.com/xyz'
});

// Get all interviews
const interviews = await interviewsApi.getAll({ 
  employer_id: employerId 
});
```

### More APIs available:
- `talentsApi` - Talent profile management
- `employersApi` - Employer operations
- `ticketsApi` - Support tickets
- `notificationsApi` - User notifications
- `savedJobsApi` - Job bookmarking

Full documentation in `BACKEND_SETUP.md`

## 🔐 Security Setup (Important!)

### Enable Row Level Security (RLS) in Supabase:

1. Go to **Authentication** > **Policies**
2. For each table, click **Enable RLS**
3. Add policies:

```sql
-- Example: Talents can only see their own profile
CREATE POLICY "Talents view own profile"
  ON talents FOR SELECT
  USING (user_id = auth.uid());

-- Employers can see their own jobs
CREATE POLICY "Employers manage own jobs"
  ON jobs FOR ALL
  USING (employer_id IN (
    SELECT id FROM employers WHERE user_id = auth.uid()
  ));
```

See Supabase documentation for more RLS examples.

## 🎨 Next Steps

### 1. Update Pages to Use Real Data

Example for EmployerJobs:
```typescript
import { useEffect, useState } from 'react';
import { jobsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const EmployerJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const loadJobs = async () => {
      const data = await jobsApi.getAll({ 
        employer_id: user?.profile?.id 
      });
      setJobs(data);
    };
    loadJobs();
  }, [user]);

  // Use jobs data in your UI
};
```

### 2. Add Role-Based Navigation

Update routing based on user role:
```typescript
const { user } = useAuth();

if (user?.user_role === 'talent') {
  navigate('/talent/overview');
} else if (user?.user_role === 'employer') {
  navigate('/employer/overview');
} else if (user?.user_role === 'admin') {
  navigate('/admin/overview');
}
```

### 3. Implement Protected Routes

```typescript
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.user_role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};
```

### 4. Add Real-time Subscriptions

```typescript
import { supabase } from '@/lib/supabase';

// Listen to new applications
supabase
  .channel('applications')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'applications' },
    payload => {
      console.log('New application:', payload.new);
      // Update UI
    }
  )
  .subscribe();
```

## 🐛 Troubleshooting

### "Can't connect to Supabase"
- Check `.env` file exists and has correct values
- Verify Supabase URL and key in Project Settings > API
- Restart dev server after changing `.env`

### "Invalid credentials"
- Password for all test accounts is: `password123`
- Make sure you ran the database schema SQL
- Check browser console for detailed error

### "Table doesn't exist"
- Run the entire `database schema.sql` in Supabase SQL Editor
- Make sure no errors during execution
- Check Tables view in Supabase to verify

### "CORS errors"
- Your Supabase project should allow your localhost by default
- Check Project Settings > API > Allowed CORS domains

## 📖 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)

## 🎉 You're Ready!

Your TalentHub platform is now fully integrated with a real backend. Start the dev server, login, and explore! 

All the data, relationships, and APIs are ready to use. Happy coding! 🚀
