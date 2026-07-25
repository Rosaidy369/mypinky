function WarningIcon({ size = 16, className = "" }) {
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
      <path d="M12 3.5 22 20H2z"></path>
      <line x1="12" y1="9.5" x2="12" y2="14"></line>
      <circle cx="12" cy="17" r="0.75" fill="currentColor" stroke="none"></circle>
    </svg>
  );
}

export default WarningIcon;
