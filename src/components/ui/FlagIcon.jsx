function FlagIcon({ size = 16, className = "" }) {
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
      <path d="M5 3v18"></path>
      <path d="M5 4.5c2-1.3 4-1.3 6.5 0s4.5 1.3 6.5 0v9c-2 1.3-4 1.3-6.5 0s-4.5-1.3-6.5 0z"></path>
    </svg>
  );
}

export default FlagIcon;
