function FacebookIcon({ size = 16, className = "" }) {
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
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M13.5 21v-7.2h2.2l.35-2.7h-2.55v-1.7c0-.8.2-1.3 1.3-1.3h1.35V5.6c-.25-.03-1.05-.1-2-.1-2 0-3.35 1.2-3.35 3.5v2h-2.2v2.7h2.2V21"></path>
    </svg>
  );
}

export default FacebookIcon;
