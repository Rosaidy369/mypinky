function SuperLikeHeart({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`super-like-heart ${className}`}
    >
      <defs>
        <linearGradient id="pinkyPulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff3f87" />
          <stop offset="100%" stopColor="#ffd700" />
        </linearGradient>
      </defs>

      <path
        d="M12 21s-7.5-4.9-10.2-9.3C.4 9.5 1 6.2 3.6 4.7c2.2-1.3 4.9-.7 6.4 1.3.6.8 1.3 1.9 2 3 .7-1.1 1.4-2.2 2-3 1.5-2 4.2-2.6 6.4-1.3 2.6 1.5 3.2 4.8 1.8 7-2.7 4.4-10.2 9.3-10.2 9.3z"
        fill="url(#pinkyPulseGradient)"
      />

      <circle cx="18" cy="4.5" r="1.1" fill="#ffd700" opacity="0.95" />
      <circle cx="20.5" cy="7" r="0.6" fill="#ffffff" opacity="0.9" />
      <circle cx="15.5" cy="3" r="0.6" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}

export default SuperLikeHeart;
