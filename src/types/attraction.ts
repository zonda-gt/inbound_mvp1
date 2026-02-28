export interface TimeNeeded {
  quick_visit: string;
  recommended: string;
  deep_dive: string;
}

export interface BestTime {
  best_time_of_day: string;
  worst_time: string;
  seasonal_notes: string;
  pro_tip: string;
}

export type LanguageBarrierRating =
  | "no-chinese-needed"
  | "some-chinese-helps"
  | "chinese-essential";

export interface GettingIn {
  price_rmb: string;
  price_usd: string;
  booking_required: string;
  booking_method: string;
  passport_accepted: string;
  what_to_bring: string;
  queue_situation: string;
  language_barrier_rating: LanguageBarrierRating;
}

export interface ExperienceHighlight {
  name: string;
  description: string;
  foreigner_appeal: string;
  foreigner_note?: string;
  tip: string;
}

export interface VisitorMiss {
  what: string;
  why: string;
}

export interface Strategy {
  smart_route: string;
  what_to_skip: string;
  pro_tips: string[];
}

export interface HeadsUp {
  warning: string;
  advice: string;
}

export interface Preparation {
  what_to_wear?: string;
  what_to_bring?: string;
  what_not_to_bring?: string;
}

export type PhysicalIntensity = "low" | "moderate" | "high" | "extreme";

export interface PhysicalAccessibility {
  physical_intensity: PhysicalIntensity;
  physical_details: string;
  age_notes?: string;
  health_warnings?: string;
}

export interface ConciergeOpportunity {
  action: string;
  platform: string;
  value_to_user: string;
}

export interface UsefulChinese {
  pinyin: string;
  chinese: string;
  english: string;
}

export interface PairWith {
  suggestion: string;
  why: string;
  travel_time: string;
}

export interface PhotoSpot {
  location: string;
  tip: string;
  why: string;
}

export interface AttractionData {
  slug: string;
  attraction_name_cn: string;
  attraction_name_en: string;
  address_cn: string;
  experience_type: string;
  hook: string;
  honest_description: string;
  vibe: string;
  foreigner_top_question: string;
  foreigner_top_answer: string;
  time_needed: TimeNeeded;
  best_time: BestTime;
  getting_in: GettingIn;
  experience_highlights: ExperienceHighlight[];
  what_visitors_miss: VisitorMiss[];
  strategy: Strategy;
  heads_up: HeadsUp[];

  card_name?: string;
  card_hook?: string;
  card_type?: string;
  experience_type_secondary?: string;
  experience_format_note?: string;
  preparation?: Preparation;
  physical_accessibility?: PhysicalAccessibility;
  concierge_opportunities?: ConciergeOpportunity[];
  useful_chinese?: UsefulChinese[];
  pair_with?: PairWith[];
  cultural_context?: string;
  photo_spots?: PhotoSpot[];
  best_for?: string[];
  images?: string[];
}
