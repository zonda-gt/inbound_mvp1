'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Restaurant {
  slug: string;
  name_en: string;
  name_cn: string;
  images: string[];
}

export default function RestaurantSearch({ restaurants }: { restaurants: Restaurant[] }) {
  const [query, setQuery] = useState('');
  const filtered = restaurants.filter((r) =>
    r.name_en.toLowerCase().includes(query.toLowerCase()) ||
    r.name_cn.includes(query)
  );

  return (
    <div>
      <input
        type="search"
        placeholder="Search restaurants…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-gray-300"
      />
      <div className="flex flex-col gap-1">
        {filtered.map((r) => (
          <Link
            key={r.slug}
            href={`/admin/restaurants/${r.slug}`}
            className="flex items-center gap-4 rounded-lg border border-gray-100 bg-white px-4 py-3 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            {r.images?.[0] ? (
              <img
                src={r.images[0]}
                alt={r.name_en}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-gray-100"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center text-xl">🍽️</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{r.name_en}</div>
              <div className="text-sm text-gray-400">{r.name_cn}</div>
            </div>
            <div className="text-sm text-gray-400 flex-shrink-0">{r.images?.length ?? 0} photos</div>
            <span className="text-gray-300">→</span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">No restaurants found</p>
        )}
      </div>
    </div>
  );
}
