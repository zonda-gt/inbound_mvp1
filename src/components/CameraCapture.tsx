"use client";

import { useRef } from "react";

export type CapturedImage = {
  base64: string; // base64 WITHOUT the data:image/...;base64, prefix
  mediaType: "image/jpeg" | "image/png";
  previewUrl: string; // blob URL for display
};

type CameraCaptureProps = {
  onCapture: (image: CapturedImage) => void;
  onError?: (error: string) => void;
};

// Compress image if needed
async function compressImage(file: File): Promise<{ base64: string; mediaType: "image/jpeg" | "image/png" }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Check if compression is needed (file > 1MB or image > 1200px)
        const maxSize = 1200;
        const needsResize = img.width > maxSize || img.height > maxSize;
        const needsCompression = file.size > 1024 * 1024; // 1MB

        if (!needsResize && !needsCompression) {
          // No compression needed - return original as base64
          const base64 = (e.target?.result as string).split(',')[1];
          resolve({ base64, mediaType: "image/jpeg" });
          return;
        }

        // Calculate new dimensions
        let { width, height } = img;
        if (needsResize) {
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
        }

        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG at 0.8 quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image compression failed'));
              return;
            }

            const blobReader = new FileReader();
            blobReader.onloadend = () => {
              const base64 = (blobReader.result as string).split(',')[1];
              resolve({ base64, mediaType: "image/jpeg" });
            };
            blobReader.onerror = () => reject(new Error('Failed to read compressed image'));
            blobReader.readAsDataURL(blob);
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function CameraCapture({ onCapture, onError }: CameraCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        onError?.('Please select an image file');
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      // Compress and convert to base64
      const { base64, mediaType } = await compressImage(file);

      onCapture({
        base64,
        mediaType,
        previewUrl,
      });
    } catch (error) {
      console.error('Image processing error:', error);
      onError?.('Failed to process image. Please try again.');
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const triggerCamera = () => {
    cameraInputRef.current?.click();
  };

  const triggerGallery = () => {
    galleryInputRef.current?.click();
  };

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Take photo with camera"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Select photo from gallery"
      />

      {/* Export trigger functions via ref - parent can call these */}
      <div style={{ display: 'none' }} ref={(el) => {
        if (el) {
          (el as any).triggerCamera = triggerCamera;
          (el as any).triggerGallery = triggerGallery;
        }
      }} />
    </>
  );
}

// Hook to use CameraCapture imperatively
export function useCameraCapture() {
  const captureRef = useRef<any>(null);

  const openCamera = () => {
    captureRef.current?.triggerCamera?.();
  };

  const openGallery = () => {
    captureRef.current?.triggerGallery?.();
  };

  return { captureRef, openCamera, openGallery };
}
