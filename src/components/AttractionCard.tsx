"use client";

import Link from "next/link";
import type { AttractionSummary } from "@/lib/attractions";

export default function AttractionCard({
  attraction,
}: {
  attraction: AttractionSummary;
}) {
  return (
    <Link
      href={`/attractions/${attraction.slug}`}
      className="block rounded-xl border border-gray-200 bg-white overflow-hidden transition-shadow hover:shadow-md mb-2"
    >
      {attraction.image && (
        <div className="h-32 w-full overflow-hidden">
          <img
            src={attraction.image}
            alt={attraction.name_en}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-gray-900 truncate">
              {attraction.name_en}
            </h3>
            <p className="text-[12px] text-gray-500">{attraction.name_cn}</p>
          </div>
          {attraction.experience_type && (
            <span className="shrink-0 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 capitalize">
              {attraction.experience_type}
            </span>
          )}
        </div>
        {attraction.hook && (
          <p className="mt-1.5 text-[12px] text-gray-600 leading-relaxed line-clamp-2">
            {attraction.hook}
          </p>
        )}
        <div className="mt-2 text-[12px] font-semibold text-[#D0021B]">
          View details →
        </div>
      </div>
    </Link>
  );
}
