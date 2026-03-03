# Owner Login Guide

## Accessing the Owner Portal

The owner portal is protected and requires authentication with the owner role.

### Owner Credentials

- **Email:** `owner@talentshub.com`
- **Password:** `password123`

### How to Login

1. Navigate to `/owner/login` or use the regular `/login` page
2. Enter the owner credentials
3. You will be automatically redirected to `/owner/dashboard`

### Creating the Owner User

If the owner user doesn't exist in your database, run the following SQL script:

```bash
# In Supabase SQL Editor, run:
create_owner_user.sql
```

Or manually execute:

```sql
INSERT INTO users (id, email, password_hash, user_role, is_active, email_verified, profile_completed) VALUES
('22222222-2222-2222-2222-222222222222', 'owner@talentshub.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'owner', TRUE, TRUE, TRUE)
ON CONFLICT (email) DO UPDATE SET
  user_role = 'owner',
  is_active = TRUE;

INSERT INTO admins (user_id, role_level, permissions) VALUES
('22222222-2222-2222-2222-222222222222', 'admin', ARRAY['manage_users', 'manage_jobs', 'view_analytics', 'manage_subscriptions', 'manage_employers'])
ON CONFLICT DO NOTHING;
```

## Protected Routes

All the following routes are now protected and require authentication:

### Talent Routes (role: `talent`)
- `/talent/onboarding`
- `/talent/overview`
- `/talent/interviews/ta`
- `/talent/interviews/it`
- `/talent/applications`
- `/talent/offers`
- `/talent/jobs`
- `/talent/profile`
- `/talent/messages`
- `/talent/support-tickets`
- `/talent/services`

### Employer Routes (role: `employer` or `admin`)
- `/employer/overview`
- `/employer/jobs`
- `/employer/interviewers`
- `/employer/pipeline`
- `/employer/interviews`
- `/employer/tickets`
- `/employer/settings`

### Employer Admin Routes (role: `admin`)
- `/employer-admin/overview`
- `/employer-admin/users`
- `/employer-admin/company-profile`
- `/employer-admin/payment`
- `/employer-admin/settings`

### Owner Routes (role: `owner`)
- `/owner/dashboard`
- `/owner/users`
- `/owner/users/add-employer`
- `/owner/employers`
- `/owner/talents`
- `/owner/interviewers`
- `/owner/subscriptions`
- `/owner/statistics`
- `/owner/settings`

### Interviewer Routes (role: `interviewer`)
- `/technical-interviewer/overview`
- `/technical-interviewer/interviews`
- `/technical-interviewer/interviews/:id/review`
- `/technical-interviewer/profile`
- `/technical-interviewer/settings`
- `/leadership-interviewer/overview`
- `/leadership-interviewer/interviews`
- `/leadership-interviewer/interviews/:id/review`
- `/leadership-interviewer/profile`
- `/leadership-interviewer/settings`

## Password Hashing

The application uses **bcrypt** for password hashing with 10 salt rounds. The password hashing is done in [src/lib/api.ts](src/lib/api.ts) using the `bcryptjs` library.

### How it works:
1. During signup, the password is hashed using `bcrypt.hash(password, 10)`
2. During login, the password is verified using `bcrypt.compare(password, hash)`
3. The hash is stored in the `users.password_hash` column

All sample users in the database use the password **password123**, which is hashed to:
```
$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
```

## Security Features

1. **Role-based access control (RBAC)**: Each route checks the user's role before allowing access
2. **Protected routes**: All authenticated routes redirect to `/login` if user is not logged in
3. **Loading state**: Shows a loading spinner while checking authentication
4. **Local storage**: User ID and role are stored in localStorage for persistence
5. **Automatic logout**: Clears all stored data when logging out
