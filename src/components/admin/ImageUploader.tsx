'use client';

import { useRef, useState } from 'react';

interface UploadItem {
  name: string;
  progress: number;
  error?: string;
}

interface ImageUploaderProps {
  slug: string;
  entityType: 'restaurants' | 'attractions';
  onUploaded: (url: string) => void;
}

export default function ImageUploader({ slug, entityType, onUploaded }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);

  function updateUpload(name: string, update: Partial<UploadItem>) {
    setUploads((prev) => prev.map((u) => (u.name === name ? { ...u, ...update } : u)));
  }

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 20 * 1024 * 1024) {
      setUploads((prev) => [...prev, { name: file.name, progress: 0, error: 'File too large (max 20MB)' }]);
      return;
    }

    setUploads((prev) => [...prev, { name: file.name, progress: 0 }]);

    const formData = new FormData();
    formData.append('file', file);

    return new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          updateUpload(file.name, { progress: Math.round((e.loaded / e.total) * 90) });
        }
      });
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const { url } = JSON.parse(xhr.responseText);
          updateUpload(file.name, { progress: 100 });
          onUploaded(url);
        } else {
          updateUpload(file.name, { error: 'Upload failed' });
        }
        resolve();
      });
      xhr.addEventListener('error', () => {
        updateUpload(file.name, { error: 'Upload failed' });
        resolve();
      });
      xhr.open('POST', `/api/admin/${entityType}/${slug}/upload`);
      xhr.send(formData);
    });
  }

  async function handleFiles(files: FileList) {
    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
  }

  return (
    <div className="mb-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragging ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <p className="text-sm text-gray-500">Drop images here or <span className="text-gray-900 font-medium">click to upload</span></p>
        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · Max 20MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {uploads.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {uploads.map((u) => (
            <div key={u.name} className="flex items-center gap-3 text-sm">
              <span className="text-gray-500 truncate flex-1 min-w-0">{u.name}</span>
              {u.error ? (
                <span className="text-red-500 text-xs flex-shrink-0">{u.error}</span>
              ) : u.progress === 100 ? (
                <span className="text-green-600 text-xs flex-shrink-0">Done</span>
              ) : (
                <div className="flex-shrink-0 w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-700 rounded-full transition-all" style={{ width: `${u.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
