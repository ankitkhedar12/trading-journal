import React from "react";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "border" | "grow";
  color?: string;
}

const Loader: React.FC<LoaderProps> = ({
  className = "",
  size = "sm",
  variant = "border",
  color,
}) => {
  const sizeClasses = {
    sm: variant === "border" ? "spinner-border-sm" : "spinner-grow-sm",
    md: "",
    lg: variant === "border" ? "spinner-border-lg" : "spinner-grow-lg",
  };

  const sizeStyles = {
    sm: { width: "1rem", height: "1rem", borderWidth: "0.15em" },
    md: { width: "1.5rem", height: "1.5rem", borderWidth: "0.2em" },
    lg: { width: "2rem", height: "2rem", borderWidth: "0.25em" },
  };

  const spinnerClass = variant === "border" ? "spinner-border" : "spinner-grow";
  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`${spinnerClass} ${sizeClass} ${className}`.trim()}
      role="status"
      aria-hidden="true"
      style={{
        ...sizeStyles[size],
        ...(color && { borderColor: color, borderRightColor: "transparent" }),
        animation:
          variant === "border"
            ? "spinner-border 0.6s linear infinite"
            : "spinner-grow 0.6s linear infinite",
      }}
    >
      <span className="visually-hidden">Loading...</span>
    </span>
  );
};

export default Loader;
