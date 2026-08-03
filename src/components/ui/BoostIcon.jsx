import { useId } from "react";

function BoostIcon({ size = 18, className = "" }) {
  const gradId = useId();

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff3f87" />
          <stop offset="100%" stopColor="#ff9dc3" />
        </linearGradient>
      </defs>

      <path
        d="M12 3l6 7h-4v8h-4v-8H6l6-7z"
        fill={`url(#${gradId})`}
      />

      <path
        d="M3 15l3-3M3 19l4.5-4.5"
        stroke={`url(#${gradId})`}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}

export default BoostIcon;
