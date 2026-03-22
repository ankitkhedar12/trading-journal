/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo } from "react";
import type { FC } from "react";

import { Controller } from "react-hook-form";
import type { Control, FieldError, FieldErrorsImpl, FieldValues, Merge } from "react-hook-form";

interface Iprops {
  name: string;
  control: Control<any>;
  disabled?: boolean;
  className?: string;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<FieldValues>>;
  label?: string;
  required?: boolean;
  buttons: {
    label: string;
    value?: boolean | string | number;
    disabled?: boolean;
  }[];
}

const CommonRadioButton: FC<Iprops> = (props) => {
  const {
    className,
    error,
    control,
    //label,
    name,
    disabled,
    buttons,
    //required,
  } = props;

  return (
    <>
      {/* <label className="custom-radio">
        {label}
        {required ? <sup>*</sup> : null}
      </label> */}
      <div className="d-flex mt-3" style={{ gap: "20px" }}>
        {buttons.map((item, index) => (
          <label
            key={typeof item.value === "boolean" ? String(item.value) : (item.value ?? index)}
            className={disabled ? "custom-radio opacity-50" : "custom-radio d-flex align-items-center gap-2 m-0"}
          >
            <Controller
              key={item.label}
              render={({ field }) => (
                <>
                  <input
                    type="radio"
                    id={item.label}
                    disabled={item.disabled}
                    className={className}
                    checked={field.value === item.value}
                    value={field.value as string}
                    onChange={() => !disabled && field.onChange(item.value)}
                    name={name}
                  />
                  {/* <label
				htmlFor={item.label}
				className={
					field.value === item.value
					? "form-check-label d-flex active mb-0 "
					: "form-check-label d-flex mb-0"
				}
				>
				<h5 className="me-2 p-2">{item.label}</h5>
				</label> */}
                  <span className="checkmark" />
                </>
              )}
              control={control}
              name={name}
            />
            <p className="m-0">{item.label}</p>
          </label>
        ))}
      </div>

      <p className="auth-msg-error">{error && error.message ? <>{error?.message}</> : null}</p>
    </>
  );
};

export default memo(CommonRadioButton);
