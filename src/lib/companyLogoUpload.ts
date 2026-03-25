import { supabase } from './supabase';

export interface CompanyLogoUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload a company logo to the companys_logo bucket
 * @param file - The image file to upload
 * @param companyId - The company ID (used for file naming)
 * @returns Upload result with public URL
 */
export async function uploadCompanyLogo(
  file: File,
  companyId: string
): Promise<CompanyLogoUploadResult> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or SVG image.',
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File is too large. Maximum size is 5MB.',
      };
    }

    // Generate file path
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const filePath = `company_${companyId}_${timestamp}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('companys_logo')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message,
      };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('companys_logo')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Delete a company logo from storage
 * @param filePath - The file path to delete
 */
export async function deleteCompanyLogo(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('companys_logo')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting logo:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error deleting logo:', error);
    return false;
  }
}

/**
 * Update a company logo (delete old and upload new)
 * @param newFile - The new image file
 * @param companyId - The company ID
 * @param oldFilePath - Optional path to old file to delete
 */
export async function updateCompanyLogo(
  newFile: File,
  companyId: string,
  oldFilePath?: string
): Promise<CompanyLogoUploadResult> {
  try {
    // Delete old logo if provided
    if (oldFilePath) {
      await deleteCompanyLogo(oldFilePath);
    }

    // Upload new logo
    return await uploadCompanyLogo(newFile, companyId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
