"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Clock,
  MapPin,
  Ticket,
  Camera,
  AlertTriangle,
  MessageCircle,
  ArrowRight,
  Copy,
  Check,
  Compass,
  ChevronDown,
  Languages,
  Sparkles,
  Eye,
  Lightbulb,
  ShieldAlert,
  CalendarDays,
  Backpack,
  Footprints,
  Users,
  BookOpen,
  Navigation,
  Star,
} from "lucide-react";
import type {
  AttractionData,
  ExperienceHighlight,
  VisitorMiss,
  Strategy,
  HeadsUp,
  GettingIn,
  BestTime,
  Preparation,
  PhysicalAccessibility,
  ConciergeOpportunity,
  UsefulChinese,
  PairWith,
  PhotoSpot,
} from "@/types/attraction";

/* ── Helpers ── */

function useCopyToClipboard() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopiedKey(null), 1500);
    });
  }, []);

  return { copiedKey, copy };
}

function SectionHeading({
  icon: Icon,
  title,
  id,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  id?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-5" id={id}>
      <div className="w-8 h-8 rounded-full bg-[#FFD700]/15 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#FFD700]" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
    </div>
  );
}

function LanguageBadge({ rating }: { rating: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    "no-chinese-needed": {
      label: "No Chinese needed",
      color: "text-[#16a34a]",
      bg: "bg-[#16a34a]/10",
    },
    "some-chinese-helps": {
      label: "Some Chinese helps",
      color: "text-[#d97706]",
      bg: "bg-[#d97706]/10",
    },
    "chinese-essential": {
      label: "Chinese essential",
      color: "text-[#dc2626]",
      bg: "bg-[#dc2626]/10",
    },
  };
  const c = config[rating] || config["some-chinese-helps"];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.color}`}
    >
      <Languages className="w-3 h-3" />
      {c.label}
    </span>
  );
}

function IntensityBadge({ level }: { level: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    low: { label: "Low intensity", color: "text-[#16a34a]", bg: "bg-[#16a34a]/10" },
    moderate: { label: "Moderate intensity", color: "text-[#d97706]", bg: "bg-[#d97706]/10" },
    high: { label: "High intensity", color: "text-[#ea580c]", bg: "bg-[#ea580c]/10" },
    extreme: { label: "Extreme intensity", color: "text-[#dc2626]", bg: "bg-[#dc2626]/10" },
  };
  const c = config[level] || config["moderate"];
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.color}`}
    >
      <Footprints className="w-3.5 h-3.5" />
      {c.label}
    </span>
  );
}

function shouldShowFormatNote(note?: string): boolean {
  if (!note) return false;
  return !note.toLowerCase().trim().startsWith("standard format");
}

/* ── Section 1: Hero ── */

function HeroSection({ data }: { data: AttractionData }) {
  const { copiedKey, copy } = useCopyToClipboard();
  const isCopied = copiedKey === "hero-cn";

  return (
    <section className="relative pt-14 md:pt-16">
      <div
        className="px-4 pt-12 pb-10 sm:pt-20 sm:pb-14"
        style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          {/* Type badge */}
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#FFD700] bg-[#FFD700]/10 px-3 py-1 rounded-full mb-4">
            {data.experience_type}
            {data.experience_type_secondary ? ` / ${data.experience_type_secondary}` : ""}
          </span>

          {/* English name */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
            {data.attraction_name_en}
          </h1>

          {/* Chinese name — tap to copy */}
          <button
            onClick={() => copy(data.attraction_name_cn, "hero-cn")}
            className="mt-2 inline-flex items-center gap-1.5 text-white/50 hover:text-white/70 transition-colors group"
          >
            <span className="text-base sm:text-lg">{data.attraction_name_cn}</span>
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-[#07C160]" />
            ) : (
              <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
          {isCopied && (
            <p className="text-[10px] text-[#07C160] mt-0.5">Copied!</p>
          )}

          {/* Hook */}
          <p className="mt-6 text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl mx-auto italic">
            &ldquo;{data.hook}&rdquo;
          </p>

          {/* Quick stats */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-white/60 bg-white/[0.07] px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              {data.time_needed.recommended.split("—")[0].trim()}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-white/60 bg-white/[0.07] px-3 py-1.5 rounded-full">
              <Ticket className="w-3.5 h-3.5" />
              {data.getting_in.price_usd.split(";")[0].trim()}
            </span>
            <LanguageBadge rating={data.getting_in.language_barrier_rating} />
          </div>

          {/* Vibe */}
          <p className="mt-5 text-xs sm:text-sm text-white/40 italic max-w-xl mx-auto">
            {data.vibe}
          </p>

          {/* Scroll indicator */}
          <div className="mt-8 animate-bounce">
            <ChevronDown className="w-5 h-5 text-white/30 mx-auto" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Section 2: Local Friend's Take ── */

function LocalFriendsTake({ text }: { text: string }) {
  return (
    <section className="py-10 sm:py-14 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading icon={MessageCircle} title="Your Local Friend's Take" />
        <div className="border-l-4 border-[#FFD700] bg-card rounded-r-lg p-5 sm:p-6">
          <p className="text-sm sm:text-base text-foreground/80 leading-relaxed whitespace-pre-line">
            {text}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── Section 3: Make-or-Break Question ── */

function MakeOrBreakQuestion({ q, a }: { q: string; a: string }) {
  return (
    <section className="py-10 sm:py-14 bg-secondary/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading icon={Lightbulb} title="The Make-or-Break Question" />
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="bg-[#C84032]/5 border-b border-[#C84032]/10 px-5 py-4">
            <p className="text-sm sm:text-base font-semibold text-[#C84032]">
              &ldquo;{q}&rdquo;
            </p>
          </div>
          <div className="px-5 py-4 sm:py-5">
            <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
              {a}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Section 4: How It Works ── */

function HowItWorks({ note }: { note: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = note.length > 300;
  const displayText = isLong && !expanded ? note.slice(0, 300) + "..." : note;

  return (
    <section className="py-10 sm:py-14 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading icon={Compass} title="How It Works" />
        <div className="bg-[#FFD700]/5 border border-[#FFD700]/15 rounded-xl p-5 sm:p-6">
          <p className="text-sm sm:text-base text-foreground/80 leading-relaxed whitespace-pre-line">
            {displayText}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 text-xs font-semibold text-[#C84032] hover:underline"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Section 5: Highlights ── */

function HighlightCard({ item }: { item: ExperienceHighlight }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex-shrink-0 w-[280px] sm:w-auto snap-start">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
          {item.name}
        </h3>
        <span className="text-[10px] font-semibold whitespace-nowrap bg-[#16a34a]/10 text-[#16a34a] px-1.5 py-0.5 rounded">
          {item.foreigner_appeal.replace(/🟢\s*/, "")}
        </span>
      </div>
      <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed mb-3">
        {item.description}
      </p>
      {item.foreigner_note && (
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-2 italic">
          {item.foreigner_note}
        </p>
      )}
      <div className="flex items-start gap-1.5 bg-[#FFD700]/5 rounded-lg px-3 py-2">
        <Lightbulb className="w-3.5 h-3.5 text-[#FFD700] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] sm:text-xs text-foreground/70 leading-relaxed">
          {item.tip}
        </p>
      </div>
    </div>
  );
}

function HighlightsSection({ highlights }: { highlights: ExperienceHighlight[] }) {
  if (!highlights?.length) return null;
  return (
    <section className="py-10 sm:py-14 bg-secondary/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <SectionHeading icon={Star} title="Highlights" />

        {/* Mobile: horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:hidden scrollbar-hide">
          {highlights.map((item, i) => (
            <HighlightCard key={i} item={item} />
          ))}
        </div>

        {/* Desktop: grid */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-4">
          {highlights.map((item, i) => (
            <HighlightCard key={i} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section 6: Strategy & Hidden Gems ── */

function StrategySection({
  strategy,
  misses,
}: {
  strategy: Strategy;
  misses: VisitorMiss[];
}) {
  return (
    <section className="py-10 sm:py-14 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading icon={Navigation} title="Strategy & Hidden Gems" />

        {/* Smart route */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#FFD700]" />
            Suggested Route
          </h3>
          <p className="text-sm text-foreground/80 leading-relaxed bg-card border border-border rounded-lg p-4">
            {strategy.smart_route}
          </p>
        </div>

        {/* Pro tips */}
        {strategy.pro_tips?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-[#FFD700]" />
              Pro Tips
            </h3>
            <ul className="space-y-2">
              {strategy.pro_tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-foreground/80"
                >
                  <span className="text-[#FFD700] font-bold mt-0.5">+</span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What to skip */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <span className="text-sm">&#9197;&#65039;</span>
            What to Skip
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed bg-secondary/50 rounded-lg p-4">
            {strategy.what_to_skip}
          </p>
        </div>

        {/* Hidden gems */}
        {misses?.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
              What Most Visitors Miss
            </h3>
            <div className="space-y-3">
              {misses.map((item, i) => (
                <div
                  key={i}
                  className="bg-[#FFD700]/5 border border-[#FFD700]/15 rounded-lg p-4"
                >
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {item.what}
                  </p>
                  <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
                    {item.why}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Section 7: Heads Up ── */

function HeadsUpSection({ items }: { items: HeadsUp[] }) {
  if (!items?.length) return null;
  return (
    <section className="py-10 sm:py-14 bg-secondary/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading icon={AlertTriangle} title="Heads Up" />
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-[#d97706]/5 border border-[#d97706]/15 rounded-xl p-4 sm:p-5"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-[#d97706] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {item.warning}
                  </p>
                  <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
                    {item.advice}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section 8: Getting In ── */

function GettingInSection({ info }: { info: GettingIn }) {
  return (
    <section className="py-10 sm:py-14 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading icon={Ticket} title="Getting In" />
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Price header */}
          <div
            className="px-5 py-4 sm:py-5"
            style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)" }}
          >
            <p className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">
              Price
            </p>
            <p className="text-base sm:text-lg font-bold text-white">
              {info.price_rmb}
            </p>
            <p className="text-xs text-white/50 mt-0.5">
              {info.price_usd}
            </p>
          </div>

          {/* Info rows */}
          <div className="divide-y divide-border">
            <InfoRow label="Booking" value={info.booking_required} />
            <InfoRow label="How to Book" value={info.booking_method} />
            <InfoRow label="Passport Entry" value={info.passport_accepted} />
            <InfoRow label="Queue" value={info.queue_situation} />
            <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28 flex-shrink-0">
                Language
              </span>
              <LanguageBadge rating={info.language_barrier_rating} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28 flex-shrink-0">
        {label}
      </span>
      <p className="text-sm text-foreground/80 leading-relaxed">{value}</p>
    </div>
  );
}

/* ── Section 9: Best Time ── */

function BestTimeSection({ bestTime }: { bestTime: BestTime }) {
  return (
    <section className="py-10 sm:py-14 bg-secondary/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading icon={CalendarDays} title="Best Time to Visit" />
        <div className="space-y-4">
          <TimeCard
            label="Best Time"
            text={bestTime.best_time_of_day}
            accent="border-[#16a34a]/20 bg-[#16a34a]/5"
          />
          <TimeCard
            label="Worst Time"
            text={bestTime.worst_time}
            accent="border-[#dc2626]/20 bg-[#dc2626]/5"
          />
          <TimeCard
            label="Seasonal Notes"
            text={bestTime.seasonal_notes}
            accent="border-border bg-card"
          />
          {/* Pro tip highlighted */}
          <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 rounded-xl p-4 sm:p-5">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-[#FFD700] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#FFD700] uppercase tracking-wider mb-1">
                  Pro Tip
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {bestTime.pro_tip}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TimeCard({
  label,
  text,
  accent,
}: {
  label: string;
  text: string;
  accent: string;
}) {
  return (
    <div className={`border rounded-xl p-4 ${accent}`}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
    </div>
  );
}

/* ── Section 10: Preparation ── */

function PreparationSection({ prep }: { prep: Preparation }) {
  const items = [
    { label: "What to Wear", text: prep.what_to_wear, icon: "👔" },
    { label: "What to Bring", text: prep.what_to_bring, icon: "🎒" },
    { label: "What NOT to Bring", text: prep.what_not_to_bring, icon: "🚫" },
  ].filter((item) => item.text);

  if (!items.length) return null;

  return (
    <section className="py-10 sm:py-14 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading icon={Backpack} title="Preparation" />
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 sm:p-5">
              <div className="flex items-start gap-2.5">
                <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    {item.label}
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section 11: Physical & Accessibility ── */

function PhysicalSection({
  accessibility,
}: {
  accessibility: PhysicalAccessibility;
}) {
  return (
    <section className="py-10 sm:py-14 bg-secondary/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading icon={Footprints} title="Physical & Accessibility" />
        <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
          <div className="mb-4">
            <IntensityBadge level={accessibility.physical_intensity} />
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed mb-3">
            {accessibility.physical_details}
          </p>
          {accessibility.age_notes && (
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              <strong>Age notes:</strong> {accessibility.age_notes}
            </p>
          )}
          {accessibility.health_warnings && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Health:</strong> {accessibility.health_warnings}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Section 12: Useful Chinese ── */

function UsefulChineseSection({ phrases }: { phrases: UsefulChinese[] }) {
  const { copiedKey, copy } = useCopyToClipboard();

  if (!phrases?.length) return null;

  return (
    <section className="py-10 sm:py-14 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading icon={Languages} title="Useful Chinese" />
        <p className="text-xs text-muted-foreground mb-4">
          Tap any phrase to copy the Chinese characters — show them to locals
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {phrases.map((phrase, i) => {
            const key = `phrase-${i}`;
            const isCopied = copiedKey === key;
            return (
              <button
                key={i}
                onClick={() => copy(phrase.chinese, key)}
                className="text-left bg-card border border-border rounded-lg p-4 hover:border-[#FFD700]/40 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg font-bold text-foreground">
                    {phrase.chinese}
                  </span>
                  {isCopied ? (
                    <Check className="w-4 h-4 text-[#07C160]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{phrase.pinyin}</p>
                <p className="text-sm text-foreground/70 mt-1">{phrase.english}</p>
                {isCopied && (
                  <span className="text-[10px] font-medium text-[#07C160] mt-1 block">
                    Copied to clipboard
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Section 13: Pair With ── */

function PairWithSection({ suggestions }: { suggestions: PairWith[] }) {
  if (!suggestions?.length) return null;
  return (
    <section className="py-10 sm:py-14 bg-secondary/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading icon={MapPin} title="Pair With" />
        <div className="space-y-3">
          {suggestions.map((item, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-4 sm:p-5 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-foreground">
                    {item.suggestion}
                  </h3>
                  <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full whitespace-nowrap">
                    {item.travel_time}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed">
                  {item.why}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section 14: Cultural Context ── */

function CulturalContextSection({ text }: { text: string }) {
  return (
    <section className="py-10 sm:py-14 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading icon={BookOpen} title="Cultural Context" />
        <div className="border-l-4 border-[#C84032]/30 bg-secondary/30 rounded-r-lg p-5 sm:p-6">
          <p className="text-sm text-foreground/70 leading-relaxed">{text}</p>
        </div>
      </div>
    </section>
  );
}

/* ── Section 15: Photo Spots ── */

function PhotoSpotsSection({ spots }: { spots: PhotoSpot[] }) {
  if (!spots?.length) return null;
  return (
    <section className="py-10 sm:py-14 bg-secondary/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading icon={Camera} title="Photo Spots" />
        <div className="space-y-3">
          {spots.map((spot, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 sm:p-5">
              <div className="flex items-start gap-2.5">
                <Camera className="w-4 h-4 text-[#C84032] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">
                    {spot.location}
                  </h3>
                  <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed mb-1">
                    {spot.tip}
                  </p>
                  <p className="text-[11px] text-muted-foreground italic">
                    {spot.why}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section 16: Concierge Opportunities ── */

function ConciergeSection({
  opportunities,
  attractionName,
}: {
  opportunities: ConciergeOpportunity[];
  attractionName: string;
}) {
  if (!opportunities?.length) return null;

  const chatPrompt = encodeURIComponent(
    `Help me with visiting ${attractionName}`,
  );

  return (
    <section className="py-10 sm:py-14 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div
          className="rounded-xl p-6 sm:p-8"
          style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)" }}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-full bg-[#FFD700]/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#FFD700]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              We Can Help With This
            </h2>
          </div>

          <div className="space-y-3 mb-6">
            {opportunities.map((item, i) => (
              <div
                key={i}
                className="bg-white/[0.07] border border-white/10 rounded-lg p-4"
              >
                <p className="text-sm font-semibold text-white mb-1">
                  {item.action}
                </p>
                <p className="text-xs text-white/50 mb-1.5">
                  via {item.platform}
                </p>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                  {item.value_to_user}
                </p>
              </div>
            ))}
          </div>

          <Link
            href={`/chat?prompt=${chatPrompt}`}
            className="inline-flex items-center gap-2 bg-[#FFD700] text-[#1A1A1A] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#FFD700]/90 transition-colors text-sm active:scale-95"
          >
            Ask Your AI Local Friend
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Section 17: Best For Tags ── */

function BestForTags({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;

  const formatTag = (tag: string) =>
    tag
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <section className="py-10 sm:py-14 bg-secondary/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <SectionHeading icon={Eye} title="Best For" />
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="text-xs font-medium text-foreground/70 bg-card border border-border px-3 py-1.5 rounded-full"
            >
              {formatTag(tag)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section 18: Sticky Bottom Bar ── */

function StickyBottomBar({
  priceUsd,
  name,
  bookingRequired,
}: {
  priceUsd: string;
  name: string;
  bookingRequired: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const chatPrompt = encodeURIComponent(`Help me plan a visit to ${name}`);
  const needsBooking = bookingRequired.toLowerCase().startsWith("yes");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:pb-5 pointer-events-none"
        >
          <div className="max-w-2xl mx-auto pointer-events-auto">
            <div
              className="relative flex items-center justify-between gap-3 rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-lg border border-white/10"
              style={{
                background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)",
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Ticket className="w-4 h-4 text-[#FFD700] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    {priceUsd.split(";")[0].trim()}
                  </p>
                </div>
              </div>
              <Link
                href={`/chat?prompt=${chatPrompt}`}
                className="flex-shrink-0 bg-[#FFD700] text-[#1A1A1A] font-semibold text-xs px-3.5 py-2 rounded-lg hover:bg-[#FFD700]/90 transition-colors active:scale-95"
              >
                {needsBooking ? "Plan Your Visit" : "Get Directions"}
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Main Export ── */

export default function AttractionDetail({ data }: { data: AttractionData }) {
  return (
    <>
      {/* 1. Hero */}
      <HeroSection data={data} />

      {/* 2. Local Friend's Take */}
      <LocalFriendsTake text={data.honest_description} />

      {/* 3. Make-or-Break Question */}
      <MakeOrBreakQuestion
        q={data.foreigner_top_question}
        a={data.foreigner_top_answer}
      />

      {/* 4. How It Works */}
      {shouldShowFormatNote(data.experience_format_note) && (
        <HowItWorks note={data.experience_format_note!} />
      )}

      {/* 5. Highlights */}
      <HighlightsSection highlights={data.experience_highlights} />

      {/* 6. Strategy & Hidden Gems */}
      <StrategySection strategy={data.strategy} misses={data.what_visitors_miss} />

      {/* 7. Heads Up */}
      <HeadsUpSection items={data.heads_up} />

      {/* 8. Getting In */}
      <GettingInSection info={data.getting_in} />

      {/* 9. Best Time */}
      <BestTimeSection bestTime={data.best_time} />

      {/* 10. Preparation */}
      {data.preparation && <PreparationSection prep={data.preparation} />}

      {/* 11. Physical & Accessibility */}
      {data.physical_accessibility && (
        <PhysicalSection accessibility={data.physical_accessibility} />
      )}

      {/* 12. Useful Chinese */}
      {data.useful_chinese && (
        <UsefulChineseSection phrases={data.useful_chinese} />
      )}

      {/* 13. Pair With */}
      {data.pair_with && <PairWithSection suggestions={data.pair_with} />}

      {/* 14. Cultural Context */}
      {data.cultural_context && (
        <CulturalContextSection text={data.cultural_context} />
      )}

      {/* 15. Photo Spots */}
      {data.photo_spots && <PhotoSpotsSection spots={data.photo_spots} />}

      {/* 16. Concierge */}
      {data.concierge_opportunities && (
        <ConciergeSection
          opportunities={data.concierge_opportunities}
          attractionName={data.attraction_name_en}
        />
      )}

      {/* 17. Best For Tags */}
      {data.best_for && <BestForTags tags={data.best_for} />}

      {/* 18. Sticky Bottom Bar */}
      <StickyBottomBar
        priceUsd={data.getting_in.price_usd}
        name={data.attraction_name_en}
        bookingRequired={data.getting_in.booking_required}
      />
    </>
  );
}
