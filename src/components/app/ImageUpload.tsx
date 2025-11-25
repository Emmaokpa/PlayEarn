
'use client';

import { useState, useEffect } from 'react';
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
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  useEffect(() => {
    console.log('ImageUpload component mounted. Cloud Name:', cloudName);
    setImageUrl(initialImageUrl);
  }, [initialImageUrl, cloudName]);

  const handleUploadSuccess = (result: any) => {
    console.log('Cloudinary success result:', result);
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
  
  const handleUploadError = (error: any) => {
     console.error('Upload widget error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'There was a problem with the image uploader. Please check the console for details.',
      });
  }

  if (!cloudName) {
    console.error("Critical Error: Cloudinary cloud name is not configured.");
    return (
      <Button type="button" variant="outline" disabled>
        Upload Disabled
      </Button>
    )
  }

  return (
    <div>
        <CldUploadWidget
            uploadPreset="qa4yjgs4"
            onSuccess={handleUploadSuccess}
            onError={handleUploadError}
            options={{
                cloudName: cloudName,
                sources: ['local', 'url'],
                multiple: false
            }}
        >
        {({ open }) => {
          function handleOnClick(e: React.MouseEvent<HTMLButtonElement>) {
            e.preventDefault();
            console.log('Upload button clicked. Attempting to open widget.');
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
