const BrandMark = ({ className = "" }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M32 8L11 19.5V44.5L32 56L53 44.5V19.5L32 8Z" stroke="currentColor" strokeWidth="3" />
      <path d="M22 23.5C22 20.4624 24.4624 18 27.5 18H36.5C39.5376 18 42 20.4624 42 23.5V26C42 28.2091 40.2091 30 38 30H26C23.7909 30 22 28.2091 22 26V23.5Z" fill="currentColor" opacity="0.18" />
      <path d="M21 39.5C21 36.4624 23.4624 34 26.5 34H37.5C40.5376 34 43 36.4624 43 39.5V40C43 42.2091 41.2091 44 39 44H25C22.7909 44 21 42.2091 21 40V39.5Z" fill="currentColor" opacity="0.24" />
      <path d="M24 22H40L45 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 46H42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 26H38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 38H40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
};

export default BrandMark;