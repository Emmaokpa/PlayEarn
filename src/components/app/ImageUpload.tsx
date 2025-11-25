
'use client';

import { useState, useEffect } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  initialImageUrl?: string;
}

export default function ImageUpload({ onUpload, initialImageUrl = '' }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const { toast } = useToast();
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  useEffect(() => {
    setImageUrl(initialImageUrl);
  }, [initialImageUrl]);

  const handleSuccess = (result: any) => {
    if (result.event === 'success' && result.info?.secure_url) {
      const url = result.info.secure_url;
      setImageUrl(url);
      onUpload(url);
      toast({
        title: 'Image Uploaded',
        description: 'Your image has been uploaded successfully.',
      });
    }
  };

  const handleError = (error: any) => {
    console.error('Upload widget error:', error);
    toast({
      variant: 'destructive',
      title: 'Upload Failed',
      description: 'There was a problem with the image uploader. Please check the console.',
    });
  };

  if (!cloudName) {
    return (
      <Button type="button" variant="outline" disabled>
        <Upload className="mr-2 h-4 w-4" />
        Upload Disabled
      </Button>
    );
  }

  return (
    <div>
      <CldUploadWidget
        options={{ cloudName }}
        uploadPreset="qa4yjgs4"
        onSuccess={handleSuccess}
        onError={handleError}
      >
        {({ open }) => {
          function handleOnClick(e: React.MouseEvent<HTMLButtonElement>) {
            e.preventDefault();
            if (typeof open === 'function') {
              open();
            } else {
              console.error('Widget "open" function not available.');
            }
          }
          return (
            <Button
              type="button"
              variant="outline"
              onClick={handleOnClick}
            >
              <Upload className="mr-2 h-4 w-4" />
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
