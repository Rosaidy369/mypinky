function MatchHeartIcon({ size = 16, className = "" }) {
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
      <path d="M12 20.3s-6.3-4.1-8.5-7.7C2 10.1 2.5 7.4 4.6 6.2c1.8-1.1 4.1-.6 5.3 1 .5.6.9 1.3 1.1 1.7.5-.7 1-1.4 1.6-2 1.6-1.4 3.8-1.6 5.4-.4 1.8 1.4 2.1 4 .7 6-2.2 2.9-7.7 6.5-7.7 6.5z"></path>
      <polyline points="8.7 12.2 10.6 14.1 15.3 9.4"></polyline>
    </svg>
  );
}

export default MatchHeartIcon;
