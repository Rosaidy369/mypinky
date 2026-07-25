// A profile's `plan` column stays "premium"/"vip" after expiry since nothing
// resets it automatically — callers must check plan_expires_at themselves.
export function isPlanActive(profile) {
  if (!profile) return false;
  if (profile.plan !== "premium" && profile.plan !== "vip") return false;
  if (!profile.plan_expires_at) return true;
  return new Date(profile.plan_expires_at) > new Date();
}

export function isVipActive(profile) {
  return isPlanActive(profile) && profile.plan === "vip";
}
