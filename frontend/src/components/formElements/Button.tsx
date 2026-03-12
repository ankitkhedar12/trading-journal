"use client";
import Loader from "../common/Loader";
import type {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  FC,
  MouseEvent,
  ReactNode,
} from "react";

interface Props
  extends DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  children?: ReactNode;
  loading?: boolean;
  style?: React.CSSProperties;
}

interface IconProps {
  loading?: boolean;
  children?: ReactNode;
}

interface ButtonComponent extends FC<Props> {
  Icon: FC<IconProps>;
}

const Button: ButtonComponent = Object.assign(
  ({
    className,
    type,
    disabled = false,
    onClick,
    children,
    style,
    loading = false,
  }: Props) => (
    <button
      type={type}
      className={`theme-btn ${className}`}
      onClick={(e) => {
        if (onClick && !loading) {
          onClick(e as unknown as MouseEvent<HTMLButtonElement>);
        }
      }}
      style={style}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="d-flex align-items-center justify-content-center gap-2">
          <Loader size="sm" variant="border" />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  ),
  {
    Icon: ({ loading = false, children }: IconProps) => (
      <>
        {children}
        {loading && <Loader className="ms-2" size="sm" variant="border" />}
      </>
    ),
  }
);

Button.displayName = "Button";
Button.Icon.displayName = "Button.Icon";

export default Button;
