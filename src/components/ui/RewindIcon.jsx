function RewindIcon({ size = 16, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 12a8 8 0 1 0 3-6.2"></path>
      <polyline points="4 4 4 9 9 9"></polyline>
    </svg>
  );
}

export default RewindIcon;
