'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SearchItem {
  slug: string;
  name_en: string;
  name_cn: string;
  type: 'restaurant' | 'attraction';
}

export default function AdminSearch({ items }: { items: SearchItem[] }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const restaurants = items.filter((i) => i.type === 'restaurant');
  const attractions = items.filter((i) => i.type === 'attraction');

  const filtered = query.trim()
    ? items.filter((item) =>
        item.name_en.toLowerCase().includes(query.toLowerCase()) ||
        item.name_cn?.includes(query) ||
        item.slug.includes(query.toLowerCase())
      )
    : null; // null = show full grouped list

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(item: SearchItem) {
    setQuery('');
    setOpen(false);
    router.push(`/admin/${item.type === 'restaurant' ? 'restaurants' : 'attractions'}/${item.slug}`);
  }

  const showDropdown = open;

  return (
    <div ref={containerRef} className="relative mb-6">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search restaurants & attractions…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-96 overflow-y-auto">
          {filtered ? (
            // Search results
            filtered.length > 0 ? (
              filtered.map((item) => (
                <Row key={`${item.type}-${item.slug}`} item={item} onSelect={handleSelect} />
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-400">No results for "{query}"</div>
            )
          ) : (
            // Full grouped list
            <>
              <SectionHeader label="🍜 Restaurants" count={restaurants.length} />
              {restaurants.map((item) => (
                <Row key={item.slug} item={item} onSelect={handleSelect} />
              ))}
              <SectionHeader label="🏛️ Attractions" count={attractions.length} />
              {attractions.map((item) => (
                <Row key={item.slug} item={item} onSelect={handleSelect} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between sticky top-0">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-xs text-gray-400">{count}</span>
    </div>
  );
}

function Row({ item, onSelect }: { item: SearchItem; onSelect: (item: SearchItem) => void }) {
  return (
    <button
      onClick={() => onSelect(item)}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors border-b border-gray-50 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{item.name_en}</div>
        <div className="text-xs text-gray-400">{item.name_cn}</div>
      </div>
    </button>
  );
}
