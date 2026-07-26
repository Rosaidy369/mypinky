function QuoteIcon({ size = 48, className = "" }) {
  return (
    <svg
      viewBox="0 0 48 36"
      width={size}
      height={size * (36 / 48)}
      fill="currentColor"
      className={className}
    >
      <path d="M0 22c0-9 5.5-15.5 14-18l2.2 4.6c-5.4 2.2-8.6 6-8.6 10.4h8.4v15H0z" />
      <path d="M25.4 22c0-9 5.5-15.5 14-18l2.2 4.6c-5.4 2.2-8.6 6-8.6 10.4h8.4v15H25.4z" />
    </svg>
  );
}

export default QuoteIcon;
