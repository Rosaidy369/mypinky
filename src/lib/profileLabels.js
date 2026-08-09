import { INTERESTS, MOODS } from "../data/profileOptions";

// Every read site (Profile, MyProfile, Explore, Swipe cards, Matches,
// Favorites, filters) goes through these instead of re-implementing the
// code-to-label lookup, so the emoji/translation-key pairing only lives
// in one place.

export function genderLabel(t, code) {
  return code ? t(`profileOptions.genders.${code}`, { defaultValue: code }) : "";
}

export function interestLabel(t, code) {
  const item = INTERESTS.find((i) => i.code === code);
  const text = t(`profileOptions.interests.${code}`, { defaultValue: code });
  return item ? `${item.emoji} ${text}` : text;
}

export function moodLabel(t, code) {
  const item = MOODS.find((m) => m.code === code);
  const text = t(`profileOptions.moods.${code}.label`, { defaultValue: code });
  return item ? `${item.emoji} ${text}` : text;
}

export function moodDesc(t, code) {
  return code ? t(`profileOptions.moods.${code}.desc`, { defaultValue: "" }) : "";
}

export function promptQuestionLabel(t, code) {
  return code ? t(`profileOptions.prompts.${code}`, { defaultValue: code }) : "";
}

export function sharedInterestCount(profileInterests = [], myInterests = []) {
  return profileInterests.filter((i) => myInterests.includes(i)).length;
}
