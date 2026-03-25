# Company Logo Storage Setup & Integration Guide

## Overview
This guide covers setting up Supabase storage for company logos with RLS policies and integrating the upload functionality into your application.

---

## 1. Setup: SQL Configuration

**File**: `sql/setup_companys_logo_bucket.sql`

Run this SQL against your Supabase PostgreSQL database to:
- Create the `companys_logo` storage bucket (public)
- Set up Row Level Security (RLS) policies for authenticated users

**Policies Created**:
- ✅ `SELECT` - Authenticated users can read logos
- ✅ `INSERT` - Authenticated users can upload logos
- ✅ `UPDATE` - Authenticated users can update logos
- ✅ `DELETE` - Authenticated users can delete logos

---

## 2. Backend: Upload Service

**File**: `src/lib/companyLogoUpload.ts`

Provides utility functions for logo management:

```typescript
// Upload a new logo
const result = await uploadCompanyLogo(file, companyId);
if (result.success) {
  console.log('Logo URL:', result.url);
  console.log('File path:', result.path);
}

// Update an existing logo
const result = await updateCompanyLogo(newFile, companyId, oldFilePath);

// Delete a logo
const deleted = await deleteCompanyLogo(filePath);
```

**Features**:
- File type validation (JPEG, PNG, WebP, SVG)
- File size limit (5MB)
- Automatic file naming with timestamp
- Public URL generation
- Error handling

---

## 3. Frontend: React Component

**File**: `src/components/CompanyLogoUploader.tsx`

Reusable drag-and-drop upload component.

### Basic Usage

```typescript
import { CompanyLogoUploader } from '@/components/CompanyLogoUploader';

export function CompanySettings() {
  const handleUploadSuccess = (url: string, path: string) => {
    // Update your database with the logo URL
    updateCompanyLogo({
      logo_url: url,
      logo_path: path,
    });
  };

  return (
    <CompanyLogoUploader
      companyId="company_123"
      currentLogoUrl={company.logo_url}
      currentLogoPath={company.logo_path}
      onUploadSuccess={handleUploadSuccess}
    />
  );
}
```

### Props

- `companyId` (string, required) - Unique company identifier
- `currentLogoUrl` (string, optional) - URL of existing logo
- `currentLogoPath` (string, optional) - Storage path of existing logo
- `onUploadSuccess` (function, required) - Callback on successful upload
- `onUploadError` (function, optional) - Callback on error

---

## 4. Integration Points

### A. Employer Company Settings

**File**: `src/pages/employer/CompanySettings.tsx` (or similar)

```typescript
import { CompanyLogoUploader } from '@/components/CompanyLogoUploader';
import { supabase } from '@/lib/supabase';

export function EmployerCompanySettingsPage() {
  const [company, setCompany] = useState(null);

  const handleLogoUpload = async (logoUrl: string, logoPath: string) => {
    // Save to database
    const { error } = await supabase
      .from('companies')
      .update({
        logo_url: logoUrl,
        logo_path: logoPath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', company.id);

    if (!error) {
      setCompany({ ...company, logo_url: logoUrl, logo_path: logoPath });
    }
  };

  return (
    <div className="space-y-6">
      <h1>Company Settings</h1>
      
      <CompanyLogoUploader
        companyId={company.id}
        currentLogoUrl={company.logo_url}
        currentLogoPath={company.logo_path}
        onUploadSuccess={handleLogoUpload}
      />
    </div>
  );
}
```

### B. Owner Management (Add/Edit Companies)

**File**: `src/pages/owner/OwnerAddEmployer.tsx` (or similar)

```typescript
import { CompanyLogoUploader } from '@/components/CompanyLogoUploader';

export function OwnerAddEmployerPage() {
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    logo_path: '',
  });

  const handleLogoUpload = (url: string, path: string) => {
    setFormData({
      ...formData,
      logo_url: url,
      logo_path: path,
    });
  };

  const handleSubmit = async () => {
    const { error } = await supabase
      .from('companies')
      .insert([formData]);
    
    if (!error) {
      toast.success('Company created successfully!');
      navigate('/owner/companies');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input
        type="text"
        placeholder="Company Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />

      <CompanyLogoUploader
        companyId="new_company"
        onUploadSuccess={handleLogoUpload}
      />

      <button type="submit">Create Company</button>
    </form>
  );
}
```

### C. Display Company Logo

```typescript
// In any component displaying companies
import { Image as ImageIcon } from 'lucide-react';

export function CompanyCard({ company }) {
  return (
    <div className="border rounded-lg p-4">
      {company.logo_url ? (
        <img
          src={company.logo_url}
          alt={company.name}
          className="h-20 w-20 object-cover rounded"
        />
      ) : (
        <div className="h-20 w-20 bg-gray-200 rounded flex items-center justify-center">
          <ImageIcon className="text-gray-400" />
        </div>
      )}
      <h3>{company.name}</h3>
    </div>
  );
}
```

---

## 5. Database Schema Update

Update your `companies` or equivalent table to store logo metadata:

```sql
ALTER TABLE companies ADD COLUMN logo_url TEXT;
ALTER TABLE companies ADD COLUMN logo_path TEXT;
ALTER TABLE companies ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
```

---

## 6. Essential Steps Checklist

- [ ] **1. Create Bucket & Policies**
  - Run `sql/setup_companys_logo_bucket.sql` in Supabase SQL editor
  - Verify bucket appears in Storage section (Public, 'companys_logo')

- [ ] **2. Add Upload Service**
  - Copy `src/lib/companyLogoUpload.ts` to your lib folder
  - Verify imports (supabase client)

- [ ] **3. Add Upload Component**
  - Copy `src/components/CompanyLogoUploader.tsx` to components
  - Verify UI component imports (Button, Input, toast)

- [ ] **4. Update Database Schema**
  - Add `logo_url` and `logo_path` columns to companies table
  - Test with a sample insert

- [ ] **5. Integrate into Pages**
  - Add `<CompanyLogoUploader />` to employer settings
  - Connect upload callback to database update
  - Test upload flow end-to-end

- [ ] **6. Display Logos**
  - Update company cards/profiles to show logo_url
  - Add fallback icon for missing logos

---

## 7. Security Considerations

✅ **RLS Policies**: Only authenticated users can upload/manage logos
✅ **File Type Validation**: JPEG, PNG, WebP, SVG only
✅ **File Size Limit**: 5MB maximum
✅ **Public Bucket**: Images are readable by anyone (as intended)
✅ **Timestamped Names**: Prevents filename collisions

---

## 8. Testing

### Test Upload Flow
1. Navigate to company settings
2. Click "Upload Logo"
3. Select an image file
4. Verify upload succeeds
5. Check database for logo_url and logo_path
6. Verify logo displays on company card

### Test Update Flow
1. Upload initial logo
2. Click "Change Logo"
3. Upload a different image
4. Verify old image is deleted
5. Verify only new image appears

### Test Error Cases
- Upload file > 5MB → Should show error
- Upload non-image file → Should show error
- Upload while offline → Should fail gracefully

---

## 9. File References

- **SQL Setup**: `sql/setup_companys_logo_bucket.sql`
- **Upload Service**: `src/lib/companyLogoUpload.ts`
- **React Component**: `src/components/CompanyLogoUploader.tsx`
- **This Guide**: `docs/COMPANY_LOGO_SETUP.md`

---

## 10. Troubleshooting

**Logo upload fails with "Unauthorized"**
- Verify RLS policies are created in Supabase
- Check user is authenticated (check auth token)

**Public URL returns 404**
- Verify file was successfully uploaded (check Storage browser)
- Check file path matches what's stored in database

**Component doesn't load**
- Verify all UI component imports exist
- Check Button, Input components are in `src/components/ui/`

**Logo not persisting after page refresh**
- Verify `onUploadSuccess` callback saves to database
- Check database update query is successful
