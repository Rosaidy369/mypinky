function YouTubeIcon({ size = 16, className = "" }) {
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
      <rect x="3" y="6" width="18" height="12" rx="4"></rect>
      <path d="M10.5 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none"></path>
    </svg>
  );
}

export default YouTubeIcon;
