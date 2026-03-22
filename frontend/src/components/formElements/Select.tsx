/* eslint-disable @typescript-eslint/no-explicit-any */
import { forwardRef } from "react";
import type { ChangeEvent, SelectHTMLAttributes } from "react";
import { Controller } from "react-hook-form";
import type { Control, FieldError, FieldErrors, FieldValues } from "react-hook-form";

interface IOptions {
  id?: string | number;
  label?: string;
  value?: string | number;
  address?: string | number;
}

interface IProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "defaultValue"> {
  control?: Control | any;
  defaultValue?:
    | {
        name: string;
        id: string;
      }
    | string
    | number;
  dontShowDefaultFirstOption?: boolean;
  className?: string;
  error?: FieldError | FieldErrors<FieldValues>;
  firstOption?: string;
  label?: string;
  name: string;
  from?: boolean;
  parentClassName?: string;
  option: IOptions[];
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  disableFirstOption?: boolean;
}

// Use forwardRef to allow passing refs
const Select = forwardRef<HTMLSelectElement, IProps>(
  (
    {
      control,
      defaultValue,
      dontShowDefaultFirstOption,
      firstOption,
      name,
      option,
      label,
      onChange,
      disabled = false,
      disableFirstOption = false,
      ...props
    },
    ref
  ) => {
    return (
      <div>
        {label && <label>{label}</label>}
        <Controller
          name={name}
          control={control}
          defaultValue={defaultValue} // Set the default value here
          render={({ field }) => (
            <select
              {...props}
              {...field}
              ref={ref} // Attach the forwarded ref here
              onChange={(e) => {
                field.onChange(e);
                if (onChange) {
                  onChange(e);
                }
              }}
              disabled={disabled}
            >
              {!dontShowDefaultFirstOption && (
                <option value="" disabled={disableFirstOption}>
                  {firstOption ? firstOption : "Select"}
                </option>
              )}
              {option.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
        />
      </div>
    );
  }
);
Select.displayName = "Select";

export default Select;
