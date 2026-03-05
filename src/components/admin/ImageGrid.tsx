'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TagSelector from './TagSelector';

interface ImageGridProps {
  images: string[];
  imageTags?: Record<string, string>;
  onReorder: (newImages: string[]) => void;
  onRemove: (url: string) => Promise<void>;
  onSetHero: (url: string) => void;
  onTagChange?: (url: string, tag: string) => void;
  showTags?: boolean;
  saving?: boolean;
}

function SortableImage({
  url,
  isHero,
  tag,
  showTags,
  onRemove,
  onSetHero,
  onTagChange,
}: {
  url: string;
  isHero: boolean;
  tag: string;
  showTags: boolean;
  onRemove: () => Promise<void>;
  onSetHero: () => void;
  onTagChange?: (tag: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(true);
    await onRemove();
    setDeleting(false);
  }

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col">
      <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-square group">
        {/* Drag handle — the image itself */}
        <img
          src={url}
          alt=""
          className="w-full h-full object-cover cursor-grab active:cursor-grabbing select-none"
          draggable={false}
          {...attributes}
          {...listeners}
        />

        {/* Hero badge */}
        {isHero && (
          <div className="absolute top-2 left-2 bg-amber-400 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow">
            ★ Hero
          </div>
        )}

        {/* Hover overlay — always pointer-events-none so drag works */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none" />

        {/* Remove button */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow z-10"
          title="Remove"
        >
          {deleting ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : '✕'}
        </button>

        {/* Set hero button */}
        {!isHero && (
          <button
            onClick={(e) => { e.stopPropagation(); onSetHero(); }}
            className="absolute bottom-2 left-2 right-2 bg-white/90 hover:bg-white text-gray-800 text-xs font-medium rounded-lg py-1 opacity-0 group-hover:opacity-100 transition-opacity shadow z-10"
          >
            Set as hero
          </button>
        )}
      </div>

      {showTags && onTagChange && (
        <TagSelector currentTag={tag} onChange={onTagChange} />
      )}
    </div>
  );
}

export default function ImageGrid({
  images,
  imageTags = {},
  onReorder,
  onRemove,
  onSetHero,
  onTagChange,
  showTags = false,
  saving = false,
}: ImageGridProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.indexOf(String(active.id));
      const newIndex = images.indexOf(String(over.id));
      onReorder(arrayMove(images, oldIndex, newIndex));
    }
  }

  if (images.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center py-16 text-sm text-gray-400">
        No images yet — upload some above
      </div>
    );
  }

  return (
    <div className="relative">
      {saving && (
        <div className="absolute top-0 right-0 text-xs text-gray-400 bg-white px-2 py-1 rounded shadow-sm">
          Saving…
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={images} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((url, i) => (
              <SortableImage
                key={url}
                url={url}
                isHero={i === 0}
                tag={imageTags[url] || ''}
                showTags={showTags}
                onRemove={() => onRemove(url)}
                onSetHero={() => onSetHero(url)}
                onTagChange={onTagChange ? (tag) => onTagChange(url, tag) : undefined}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
