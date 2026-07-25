function TikTokIcon({ size = 16, className = "" }) {
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
      <path d="M14 4v10.8a3.6 3.6 0 1 1-3.6-3.6"></path>
      <path d="M14 4c.3 2.2 2.1 3.9 4.2 4.2"></path>
    </svg>
  );
}

export default TikTokIcon;
