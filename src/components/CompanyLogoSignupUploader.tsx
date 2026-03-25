import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Upload, X } from 'lucide-react';

interface CompanyLogoSignupUploaderProps {
  onLogoUrlChange: (logoUrl: string) => void;
  currentLogoUrl?: string;
}

export const CompanyLogoSignupUploader: React.FC<CompanyLogoSignupUploaderProps> = ({
  onLogoUrlChange,
  currentLogoUrl,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentLogoUrl || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPEG, PNG, WebP, or SVG.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    // Check if file already uploaded (prevent duplicate uploads)
    if (uploadedUrl) {
      toast.info('Logo already uploaded. Click "Change Logo" to replace it.');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    setIsUploading(true);
    try {
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `company_logo_${timestamp}.${fileExtension}`;

      const { data, error: uploadError } = await supabase.storage
        .from('companys_logo')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`);
        setPreview(currentLogoUrl || null);
        return;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('companys_logo')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;
      setUploadedUrl(publicUrl);
      onLogoUrlChange(publicUrl);
      toast.success('Logo uploaded successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
      setPreview(currentLogoUrl || null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setUploadedUrl(null);
    onLogoUrlChange('');
  };

  return (
    <div className="flex items-center gap-4 p-4 border-2 border-dashed border-orange-200 rounded-lg bg-orange-50">
      {/* Preview */}
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Company logo preview"
            className="h-20 w-20 object-cover rounded border border-orange-300"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="h-20 w-20 bg-orange-100 rounded flex items-center justify-center border border-orange-300">
          <Upload size={24} className="text-orange-400" />
        </div>
      )}

      {/* Upload Info and Button */}
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700 mb-2">
          {uploadedUrl ? '✓ Logo uploaded' : 'Upload your company logo'}
        </p>
        <p className="text-xs text-gray-500 mb-3">
          JPEG, PNG, WebP or SVG • Max 5MB
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
        />

        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          variant="outline"
          size="sm"
          className="bg-orange-600 text-white border-orange-600 hover:bg-orange-700 hover:border-orange-700"
        >
          {isUploading ? 'Uploading...' : uploadedUrl ? 'Change Logo' : 'Choose File'}
        </Button>
      </div>
    </div>
  );
};

export default CompanyLogoSignupUploader;
