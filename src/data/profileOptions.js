// Stable codes for the predefined onboarding choices -- these are what get
// stored in `profiles` (gender, interests, mood, prompts[].question), not
// the display text. Free-text content (bio, prompt answers) never goes
// through this file since it's authored by the user, not picked from a list.

export const GENDERS = ["woman", "man", "nonbinary"];

// "all" is a UI-only sentinel for "no gender filter" -- it's never written
// to profiles.gender, only used in filter state before being converted to
// `null` right before the get_discoverable_profiles RPC call.
export const GENDER_FILTER_ALL = "all";

export const INTERESTS = [
  { code: "coffee", emoji: "☕" },
  { code: "music", emoji: "🎵" },
  { code: "travel", emoji: "✈️" },
  { code: "movies", emoji: "🎬" },
  { code: "beach", emoji: "🏖" },
  { code: "dogs", emoji: "🐶" },
  { code: "reading", emoji: "📚" },
  { code: "art", emoji: "🎨" },
  { code: "pizza", emoji: "🍕" },
  { code: "photography", emoji: "📸" },
  { code: "gym", emoji: "🏋️" },
  { code: "videogames", emoji: "🎮" },
  { code: "nightlife", emoji: "🥂" },
  { code: "yoga", emoji: "🧘" },
  { code: "cooking", emoji: "🍳" },
];

export const MOODS = [
  { code: "chat", emoji: "💬" },
  { code: "laugh", emoji: "😂" },
  { code: "company", emoji: "☕" },
  { code: "night_owl", emoji: "🌙" },
];

export const PROMPT_QUESTIONS = [
  "ideal_date",
  "cant_live_without",
  "fun_fact",
  "fastest_way",
  "favorite_book",
  "looking_for",
  "dream_destination",
  "unknown_fact",
];
