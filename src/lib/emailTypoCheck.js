// A handful of well-known providers is enough to catch the vast
// majority of real signup typos (a transposed/missing letter, or a
// wrong TLD like .co/.cm instead of .com) without hardcoding every
// possible misspelling by hand.
const KNOWN_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "icloud.com",
  "live.com",
  "aol.com",
  "hotmail.es",
  "yahoo.es",
  "protonmail.com",
];

// Damerau-Levenshtein (adjacent transposition counts as a single edit,
// since "gmial" -> "gmail" is the single most common typo shape).
function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }

  return d[m][n];
}

// Returns the corrected email if the domain looks like a near-miss
// typo of a well-known provider ("gmai.com", "gmial.com", "gmail.co",
// "hotmai.com", "yahooo.com", "outlok.com", etc.), or null if it
// doesn't -- either already correct, or too different to guess at
// confidently (a real, unrelated domain should never get flagged).
export function suggestEmailCorrection(email) {
  if (!email || typeof email !== "string") return null;

  const at = email.lastIndexOf("@");
  if (at === -1 || at === email.length - 1) return null;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase().trim();
  if (!domain) return null;

  if (KNOWN_DOMAINS.includes(domain)) return null;

  let best = null;
  let bestDistance = Infinity;

  for (const known of KNOWN_DOMAINS) {
    // Skip domains of very different length -- avoids matching a short
    // domain to a much longer one just because they share some letters.
    if (Math.abs(known.length - domain.length) > 2) continue;

    const distance = editDistance(domain, known);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = known;
    }
  }

  if (best && bestDistance > 0 && bestDistance <= 2) {
    return `${local}@${best}`;
  }

  return null;
}
