"use client";

import { useState } from "react";
import type { POIResult } from "@/lib/amap";

// ── Place type mapping (Amap Chinese → English label + icon + colors) ──

type PlaceInfo = {
  label: string;
  icon: string;
  bg: string;
  text: string;
};

function getPlaceInfo(amapType: string): PlaceInfo {
  const t = amapType.replace(/;/g, "");

  // ── Non-food place types (check first) ──
  if (t.includes("购物") || t.includes("商场") || t.includes("百货") || t.includes("商业"))
    return { label: "Shopping Mall", icon: "🛍️", bg: "bg-fuchsia-50", text: "text-fuchsia-700" };
  if (t.includes("景点") || t.includes("风景") || t.includes("公园") || t.includes("博物") || t.includes("纪念") || t.includes("旅游"))
    return { label: "Attraction", icon: "🏛️", bg: "bg-indigo-50", text: "text-indigo-700" };
  if (t.includes("酒店") || t.includes("宾馆") || t.includes("旅馆") || t.includes("民宿"))
    return { label: "Hotel", icon: "🏨", bg: "bg-sky-50", text: "text-sky-700" };
  if (t.includes("酒吧") || t.includes("夜店") || t.includes("KTV"))
    return { label: "Bar & Nightlife", icon: "🍸", bg: "bg-purple-50", text: "text-purple-700" };
  if (t.includes("医院") || t.includes("药店") || t.includes("诊所"))
    return { label: "Medical", icon: "🏥", bg: "bg-rose-50", text: "text-rose-700" };
  if (t.includes("便利店") || t.includes("超市"))
    return { label: "Convenience Store", icon: "🏪", bg: "bg-lime-50", text: "text-lime-700" };

  // ── Tea house (before general food) ──
  if (t.includes("茶艺") || t.includes("茶室") || t.includes("茶馆") || t.includes("茶餐厅"))
    return { label: "Tea House", icon: "🍵", bg: "bg-green-50", text: "text-green-700" };

  // ── Food & restaurant types ──
  if (t.includes("火锅"))
    return { label: "Hotpot", icon: "🫕", bg: "bg-red-100", text: "text-red-700" };
  if (t.includes("咖啡"))
    return { label: "Café", icon: "☕", bg: "bg-amber-50", text: "text-amber-700" };
  if (t.includes("日本") || t.includes("日式") || t.includes("寿司") || t.includes("拉面"))
    return { label: "Japanese", icon: "🍣", bg: "bg-pink-50", text: "text-pink-700" };
  if (t.includes("韩国") || t.includes("韩式"))
    return { label: "Korean", icon: "🥘", bg: "bg-orange-50", text: "text-orange-700" };
  if (t.includes("西餐") || t.includes("法国") || t.includes("意大利") || t.includes("牛排"))
    return { label: "Western", icon: "🍽️", bg: "bg-blue-50", text: "text-blue-700" };
  if (t.includes("快餐"))
    return { label: "Fast Food", icon: "🍔", bg: "bg-yellow-50", text: "text-yellow-700" };
  if (t.includes("面包") || t.includes("甜点") || t.includes("蛋糕") || t.includes("烘焙"))
    return { label: "Bakery & Dessert", icon: "🧁", bg: "bg-pink-50", text: "text-pink-600" };
  if (t.includes("烧烤"))
    return { label: "BBQ & Grill", icon: "🍖", bg: "bg-orange-50", text: "text-orange-700" };
  if (t.includes("海鲜"))
    return { label: "Seafood", icon: "🦐", bg: "bg-cyan-50", text: "text-cyan-700" };
  if (t.includes("川菜") || t.includes("湘菜"))
    return { label: "Sichuan / Hunan", icon: "🌶️", bg: "bg-red-50", text: "text-red-700" };
  if (t.includes("粤菜") || t.includes("广东") || t.includes("早茶"))
    return { label: "Cantonese", icon: "🥡", bg: "bg-amber-50", text: "text-amber-700" };
  if (t.includes("东南亚") || t.includes("泰国") || t.includes("越南") || t.includes("印度"))
    return { label: "Southeast Asian", icon: "🍜", bg: "bg-emerald-50", text: "text-emerald-700" };
  if (t.includes("素食") || t.includes("素菜"))
    return { label: "Vegetarian", icon: "🥬", bg: "bg-green-50", text: "text-green-700" };
  if (t.includes("小吃") || t.includes("面馆") || t.includes("粉") || t.includes("饺"))
    return { label: "Noodles & Snacks", icon: "🍜", bg: "bg-orange-50", text: "text-orange-600" };
  if (t.includes("中餐") || t.includes("中式"))
    return { label: "Chinese", icon: "🍜", bg: "bg-red-50", text: "text-red-700" };
  if (t.includes("餐饮"))
    return { label: "Restaurant", icon: "🍴", bg: "bg-gray-50", text: "text-gray-600" };

  return { label: "Place", icon: "📍", bg: "bg-gray-50", text: "text-gray-600" };
}

function getRatingColor(rating: string) {
  const r = parseFloat(rating);
  if (r >= 4.0) return "bg-green-100 text-green-700";
  if (r >= 3.0) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

function walkMins(meters: number) {
  return Math.max(1, Math.round(meters / 80));
}

export default function RestaurantCard({
  place,
  onNavigate,
  index,
  active,
  onCardClick,
}: {
  place: POIResult;
  onNavigate: (name: string, location: string, address: string) => void;
  index?: number;
  active?: boolean;
  onCardClick?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const placeInfo = getPlaceInfo(place.type);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${place.name}\n${place.address}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasRating = place.rating && place.rating !== "0";
  const hasCost = place.cost && place.cost !== "0";
  const hasHours = !!place.openingHours;

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-all ${
        active
          ? "border-blue-400 ring-2 ring-blue-100"
          : "border-gray-200"
      }`}
      onClick={onCardClick}
    >
      {/* ── Type banner ── */}
      <div className={`flex items-center gap-2 px-4 py-2.5 ${placeInfo.bg}`}>
        {index != null && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-[10px] font-bold text-white">
            {index}
          </span>
        )}
        <span className="text-lg">{placeInfo.icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-wide ${placeInfo.text}`}>
          {placeInfo.label}
        </span>
      </div>

      {/* ── Name + rating ── */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-base font-bold leading-snug text-gray-900">
              {place.englishName || place.name}
            </h4>
            {place.englishName && (
              <p className="mt-0.5 text-sm text-gray-500">{place.name}</p>
            )}
          </div>
          {hasRating && (
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${getRatingColor(place.rating)}`}
            >
              ⭐ {place.rating}
            </span>
          )}
        </div>
      </div>

      {/* ── Info row ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 pb-2 text-xs text-gray-500">
        {place.distance > 0 && (
          <span>🚶 {walkMins(place.distance)} min walk</span>
        )}
        {hasCost && <span>💰 ~¥{place.cost}/person</span>}
        {hasHours && <span>🕐 {place.openingHours}</span>}
      </div>

      {/* ── Description ── */}
      {place.description && (
        <p className="px-4 pb-3 text-sm italic text-gray-600">
          {place.description}
        </p>
      )}

      {/* ── Action buttons ── */}
      <div className="flex gap-2 border-t border-gray-100 px-4 py-2.5">
        <button
          onClick={() => onNavigate(place.name, place.location, place.address)}
          className="flex-1 rounded-lg bg-[#2563EB] py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
        >
          🧭 Navigate
        </button>
        <button
          onClick={handleCopy}
          className="flex-1 rounded-lg border border-gray-200 bg-white py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {copied ? "✅ Copied!" : "📋 Copy Name"}
        </button>
      </div>
    </div>
  );
}
