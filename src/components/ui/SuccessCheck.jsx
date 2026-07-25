function SuccessCheck({ size = 60 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className="success-check-svg"
    >
      <defs>
        <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff79ac" />
          <stop offset="100%" stopColor="#ff3f87" />
        </linearGradient>
      </defs>

      <circle
        cx="40"
        cy="40"
        r="36"
        fill="url(#successGrad)"
        className="success-check-circle"
      />

      <path
        d="M25 41l10 10 20-22"
        fill="none"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="success-check-mark"
      />
    </svg>
  );
}

export default SuccessCheck;