// Solid white by default -- every current usage sits on a colored gradient
// background (the boost button, the boosted badge), where a brand-pink
// icon reads as low-contrast pink-on-orange. White matches how the app's
// other badge icons (PremiumDiamond's accents, etc.) stay legible on color.
function BoostIcon({ size = 18, className = "", color = "white" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
    >
      <path
        d="M12 3l6 7h-4v8h-4v-8H6l6-7z"
        fill={color}
      />

      <path
        d="M3 15l3-3M3 19l4.5-4.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
    </svg>
  );
}

export default BoostIcon;
