function StarIcon({ size = 16, className = "", filled = true }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2.5l2.9 6.4 6.9.7-5.2 4.7 1.5 6.8L12 17.8l-6.1 3.3 1.5-6.8-5.2-4.7 6.9-.7z"></path>
    </svg>
  );
}

export default StarIcon;
