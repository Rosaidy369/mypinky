function CardIcon({ size = 16, className = "" }) {
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
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5"></rect>
      <line x1="2.5" y1="10" x2="21.5" y2="10"></line>
      <line x1="6" y1="14.5" x2="10" y2="14.5"></line>
    </svg>
  );
}

export default CardIcon;
