import type { JSX, ReactNode } from "react";
import Button from "./Button";

/**
 * Wrapper component for input fields
 * @param {string} className - Class name for the input field
 * @returns {JSX.Element} - Wrapper component
 */
const InputWrapper = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}): JSX.Element => (
  <div className={`form-group ${className ?? ""}`}>{children}</div>
);

/**
 * Label component for input fields
 * @param {string} children - Label text
 * @returns {JSX.Element} - Label component
 */
InputWrapper.Label = function Label({
  children,
  htmlFor,
  required,
  className,
  onClick,
}: {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  onClick?: () => void;
}): JSX.Element {
  return (
    <label htmlFor={htmlFor} className={className} onClick={onClick}>
      {children}
      {required ? <sup>*</sup> : null}
    </label>
  );
};

/**
 * Error component for input fields to display error message
 * @param { string } message - Error message
 * @returns { JSX.Element } - Error component
 */
InputWrapper.Error = function Error({
  message,
}: {
  message: string;
}): JSX.Element | null {
  return message ? <p className="auth-msg error">{message}</p> : null;
};

/**
 * Icon component for input fields
 * @param { string } src - Icon source
 * @param { function } onClick - Function to be called on click
 * @returns { JSX.Element } - Icon component
 */
InputWrapper.Icon = function Icon({
  children,
  // src,
  onClick,
}: {
  children: ReactNode;
  // src: string;
  onClick?: () => void;
}): JSX.Element {
  return (
    <Button className="show-icon" type="button" onClick={onClick}>
      {children}
    </Button>
  );
};

export default InputWrapper;
