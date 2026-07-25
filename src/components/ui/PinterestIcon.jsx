function PinterestIcon({ size = 16, className = "" }) {
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
      <path d="M9.5 19.5c.5-2.3 1.4-6.4 1.9-8.7"></path>
      <path d="M9.3 12.8c-.3-2.4 1.4-4.9 3.9-4.9 2.4 0 3.9 1.8 3.9 4 0 2.9-1.5 5.4-3.8 5.4-1 0-1.8-.5-2.1-1.2"></path>
    </svg>
  );
}

export default PinterestIcon;
