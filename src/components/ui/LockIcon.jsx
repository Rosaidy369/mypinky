function LockIcon({ size = 16, className = "" }) {
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
      <rect x="4" y="10.5" width="16" height="10" rx="2.5"></rect>
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"></path>
    </svg>
  );
}

export default LockIcon;
