function VipDiamond({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`vip-diamond ${className}`}
    >
      <defs>
        <linearGradient id="vipSilverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8ecef" />
          <stop offset="30%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#b8c1c9" />
          <stop offset="100%" stopColor="#8a94a0" />
        </linearGradient>
      </defs>

      <path
        d="M7 3h10l4 5-11 13L2 8z"
        fill="url(#vipSilverGradient)"
        stroke="#9aa4ad"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />

      <path
        d="M7 3l2.5 5h5L17 3M2 8h20M9.5 8l2.5 13 2.5-13"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.5"
        strokeLinejoin="round"
        opacity="0.7"
      />

      <circle cx="17" cy="5" r="1" fill="#ffffff" opacity="0.95" />
      <circle cx="6" cy="10" r="0.6" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}

export default VipDiamond;