import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { uploadCompanyLogo, updateCompanyLogo } from '@/lib/companyLogoUpload';

interface CompanyLogoUploaderProps {
  companyId: string;
  currentLogoUrl?: string;
  currentLogoPath?: string;
  onUploadSuccess: (url: string, path: string) => void;
  onUploadError?: (error: string) => void;
}

export const CompanyLogoUploader: React.FC<CompanyLogoUploaderProps> = ({
  companyId,
  currentLogoUrl,
  currentLogoPath,
  onUploadSuccess,
  onUploadError,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      let result;

      if (currentLogoPath) {
        // Update existing logo
        result = await updateCompanyLogo(file, companyId, currentLogoPath);
      } else {
        // Upload new logo
        result = await uploadCompanyLogo(file, companyId);
      }

      if (result.success && result.url && result.path) {
        onUploadSuccess(result.url, result.path);
        toast.success('Company logo uploaded successfully!');
      } else {
        const errorMsg = result.error || 'Failed to upload logo';
        toast.error(errorMsg);
        onUploadError?.(errorMsg);
        // Reset preview on error
        setPreview(currentLogoUrl || null);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(errorMsg);
      onUploadError?.(errorMsg);
      setPreview(currentLogoUrl || null);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Logo Preview */}
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Company logo preview"
            className="h-40 w-40 rounded-lg object-cover border border-gray-200"
          />
        </div>
      )}

      {/* Upload Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        onChange={handleFileChange}
        disabled={isUploading}
        className="hidden"
      />

      {/* Upload Button */}
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        variant="outline"
      >
        {isUploading ? 'Uploading...' : currentLogoUrl ? 'Change Logo' : 'Upload Logo'}
      </Button>

      {/* Helper Text */}
      <p className="text-sm text-gray-500 text-center">
        Supported formats: JPEG, PNG, WebP, SVG (Max 5MB)
      </p>
    </div>
  );
};

export default CompanyLogoUploader;
