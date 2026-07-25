function SearchIcon({ size = 16, className = "" }) {
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
      <circle cx="11" cy="11" r="7"></circle>
      <line x1="21" y1="21" x2="16.5" y2="16.5"></line>
    </svg>
  );
}

export default SearchIcon;
