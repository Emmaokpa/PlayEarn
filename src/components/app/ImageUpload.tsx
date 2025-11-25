
'use client';

import { useState, useEffect } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

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

  const handleUploadError = (error: any) => {
     console.error('Upload widget error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'There was a problem with the image uploader. Please check your configuration.',
      });
  };
  
  const handleRemoveImage = () => {
    setImageUrl('');
    onUpload('');
  }

  if (imageUrl) {
      return (
        <div className="relative w-fit">
          <Image
            src={imageUrl}
            alt="Uploaded image preview"
            width={200}
            height={150}
            className="rounded-md border object-cover"
          />
          <Button 
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4"/>
          </Button>
        </div>
      )
  }

  return (
    <div>
      <CldUploadWidget
        options={{ cloudName }}
        uploadPreset="qa4yjgs4"
        onSuccess={handleSuccess}
        onError={handleUploadError}
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
              disabled={!cloudName}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </Button>
          );
        }}
      </CldUploadWidget>
    </div>
  );
}

