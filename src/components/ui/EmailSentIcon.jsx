function EmailSentIcon({ size = 60 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className="email-sent-svg"
    >
      <defs>
        <linearGradient id="emailSentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff79ac" />
          <stop offset="100%" stopColor="#ff3f87" />
        </linearGradient>
      </defs>

      <circle
        cx="40"
        cy="40"
        r="36"
        fill="url(#emailSentGrad)"
        className="email-sent-circle"
      />

      <rect
        x="20"
        y="28"
        width="40"
        height="28"
        rx="4"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
      />

      <path
        d="M20 30l20 16 20-16"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="60"
        cy="58"
        r="14"
        fill="white"
        className="email-sent-badge"
      />

      <path
        d="M53 58l5 5 9-10"
        fill="none"
        stroke="#ff3f87"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="email-sent-check"
      />
    </svg>
  );
}

export default EmailSentIcon;
