function PinIcon({ size = 16, className = "" }) {
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
      <path d="M12 21.5s7-6.6 7-12.2A7 7 0 0 0 5 9.3c0 5.6 7 12.2 7 12.2z"></path>
      <circle cx="12" cy="9.3" r="2.4"></circle>
    </svg>
  );
}

export default PinIcon;
