function NoAdsIcon({ size = 16, className = "" }) {
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
      <circle cx="12" cy="12" r="9"></circle>
      <line x1="5.8" y1="5.8" x2="18.2" y2="18.2"></line>
    </svg>
  );
}

export default NoAdsIcon;
