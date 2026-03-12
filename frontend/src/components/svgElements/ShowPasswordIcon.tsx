const ShowPasswordIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="17"
      viewBox="0 0 20 17"
      fill="none"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.1619 8.0522C13.1619 9.7982 11.7459 11.2132 9.99987 11.2132C8.25387 11.2132 6.83887 9.7982 6.83887 8.0522C6.83887 6.3052 8.25387 4.8902 9.99987 4.8902C11.7459 4.8902 13.1619 6.3052 13.1619 8.0522Z"
        stroke="#2F2E2C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.998 15.354C13.806 15.354 17.289 12.616 19.25 8.052C17.289 3.488 13.806 0.75 9.998 0.75H10.002C6.194 0.75 2.711 3.488 0.75 8.052C2.711 12.616 6.194 15.354 10.002 15.354H9.998Z"
        stroke="#2F2E2C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ShowPasswordIcon;
