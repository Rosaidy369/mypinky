function GlobeIcon({ size = 16, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9.5"></circle>
      <ellipse cx="12" cy="12" rx="4" ry="9.5"></ellipse>
      <line x1="2.5" y1="12" x2="21.5" y2="12"></line>
    </svg>
  );
}

export default GlobeIcon;
