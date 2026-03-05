'use client';

import { useState, useRef } from 'react';
import ImageGrid from './ImageGrid';
import ImageUploader from './ImageUploader';

interface Props {
  slug: string;
  initialImages: string[];
}

export default function AttractionImageManager({ slug, initialImages }: Props) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function saveImages(newImages: string[]) {
    setSaving(true);
    const res = await fetch(`/api/admin/attractions/${slug}/images`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: newImages }),
    });
    setSaving(false);
    if (!res.ok) showToast('Failed to save order');
  }

  function handleReorder(newImages: string[]) {
    setImages(newImages);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveImages(newImages), 600);
  }

  async function handleSetHero(url: string) {
    const newImages = [url, ...images.filter((u) => u !== url)];
    setImages(newImages);
    await saveImages(newImages);
    showToast('Hero image updated');
  }

  async function handleRemove(url: string) {
    const res = await fetch(`/api/admin/attractions/${slug}/images`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      const { images: newImages } = await res.json();
      setImages(newImages);
      showToast('Image removed');
    } else {
      showToast('Failed to remove image');
    }
  }

  function handleUploaded(url: string) {
    setImages((prev) => [...prev, url]);
  }

  return (
    <div>
      <ImageUploader slug={slug} entityType="attractions" onUploaded={handleUploaded} />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {images.length} photo{images.length !== 1 ? 's' : ''} · Drag to reorder · First image is hero
        </p>
        {saving && <span className="text-xs text-gray-400">Saving…</span>}
      </div>

      <ImageGrid
        images={images}
        onReorder={handleReorder}
        onRemove={handleRemove}
        onSetHero={handleSetHero}
        saving={saving}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50 pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}
