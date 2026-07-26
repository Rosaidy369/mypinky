// profile.id is a Supabase UUID string, not a number, so it needs hashing
// before it can be used to derive a stable pseudo-random distance. Real
// per-user location/geodistance is still pending, so every profile gets a
// consistent (not random-per-render) placeholder distance in the meantime.
export function hashId(id) {
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getMockDistance(profileId) {
  return 1 + (hashId(profileId) % 12);
}
