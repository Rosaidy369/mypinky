function SendIcon({ size = 18, className = "" }) {
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
      <line x1="21" y1="3" x2="10" y2="14"></line>
      <path d="M21 3 14 21l-3-7-7-3 17-8z"></path>
    </svg>
  );
}

export default SendIcon;
