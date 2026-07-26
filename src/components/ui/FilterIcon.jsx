function FilterIcon({ size = 16, className = "" }) {
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
      <line x1="4" y1="6" x2="20" y2="6"></line>
      <circle cx="9" cy="6" r="2.2" fill="currentColor" stroke="none"></circle>
      <line x1="4" y1="12" x2="20" y2="12"></line>
      <circle cx="15" cy="12" r="2.2" fill="currentColor" stroke="none"></circle>
      <line x1="4" y1="18" x2="20" y2="18"></line>
      <circle cx="10" cy="18" r="2.2" fill="currentColor" stroke="none"></circle>
    </svg>
  );
}

export default FilterIcon;
