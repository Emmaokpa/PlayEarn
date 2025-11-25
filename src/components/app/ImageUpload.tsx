
'use client';

import { useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  initialImageUrl?: string;
}

export default function ImageUpload({ onUpload, initialImageUrl = '' }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const { toast } = useToast();

  const handleSuccess = (result: any) => {
    if (result.event === 'success' && result.info?.secure_url) {
      const url = result.info.secure_url;
      setImageUrl(url);
      onUpload(url);
    }
  };

  const handleError = (error: any) => {
    console.error('Upload widget error:', error);
    toast({
      variant: 'destructive',
      title: 'Upload Failed',
      description: 'There was a problem with the image uploader. Please try again.',
    });
  };


  return (
    <div>
      <CldUploadWidget
        uploadPreset="qa4yjgs4"
        onSuccess={handleSuccess}
        onError={handleError}
        options={{
            cloudName: process.env.NEXT_PUBLIC_CLOUDINary_CLOUD_NAME
        }}
      >
        {({ open }) => {
          return (
            <Button
              type="button"
              variant="outline"
              onClick={() => open()}
            >
              Upload Image
            </Button>
          );
        }}
      </CldUploadWidget>

      {imageUrl && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Image Preview:</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Uploaded image preview"
            width={200}
            className="rounded-md border"
          />
        </div>
      )}
    </div>
  );
}
