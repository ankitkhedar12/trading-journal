/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Controller } from "react-hook-form";
import type { Control, FieldValues, Path } from "react-hook-form";
import HidePasswordIcon from "../svgElements/HidePasswordIcon";
import ShowPasswordIcon from "../svgElements/ShowPasswordIcon";

interface CommonInputProps extends InputHTMLAttributes<HTMLInputElement> {
  iconClass?: string;
  align?: "left" | "right";
  children?: React.ReactNode;
}

interface TextboxProps<T extends FieldValues>
  extends InputHTMLAttributes<HTMLInputElement> {
  name: Path<T>;
  control: Control<T>;
  align?: "left" | "right";
  iconClass?: string;
  children?: React.ReactNode;
  isDisabled?: boolean;
  pattern?: string;
  icon?: boolean;
  showPassword?: boolean; // Enable password show/hide toggle
}

const Textbox = forwardRef<HTMLInputElement, TextboxProps<any>>(
  (
    {
      children,
      control,
      name,
      align,
      isDisabled,
      onInput,
      pattern,
      icon,
      showPassword = false,
      type,
      ...props
    },
    ref
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
      setIsPasswordVisible((prev) => !prev);
    };

    // Determine the input type based on showPassword prop and visibility state
    const inputType =
      showPassword && type === "password"
        ? isPasswordVisible
          ? "text"
          : "password"
        : type;

    return (
      <div className={`${icon ? "icon-align" : ""} ${align || ""}`}>
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <input
              {...props}
              {...field}
              ref={ref}
              type={inputType}
              value={
                isDisabled
                  ? field.value !== undefined
                    ? field.value
                    : 0
                  : field.value || ""
              }
              onInput={(e) => {
                onInput?.(e); // Allow custom onInput like uppercase transformation
                field.onChange(e); // Sync with RHF
              }}
              disabled={isDisabled}
              pattern={pattern}
            />
          )}
          defaultValue=""
        />
        {showPassword && type === "password" && (
          <button
            type="button"
            className="show-icon"
            onClick={togglePasswordVisibility}
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          >
            {isPasswordVisible ? <HidePasswordIcon /> : <ShowPasswordIcon />}
          </button>
        )}
        {children}
      </div>
    );
  }
);

Textbox.displayName = "Textbox";
export default Textbox;

export function CommonInput({
  iconClass,
  children,
  align,
  onChange,
  ...props
}: CommonInputProps) {
  return (
    <div className={`${iconClass} ${align}`}>
      <input {...props} onChange={onChange} />

      {children}
    </div>
  );
}
