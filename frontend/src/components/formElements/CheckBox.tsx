import React, { type HTMLAttributes } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

interface CheckBoxProps<T extends FieldValues> extends Omit<HTMLAttributes<HTMLLabelElement>, 'onChange'> {
  name: Path<T>;
  control: Control<T>;
  label?: React.ReactNode;
  disabled?: boolean;
}

export default function CheckBox<T extends FieldValues>({ 
  name, 
  control, 
  label, 
  disabled, 
  className = "",
  ...props 
}: CheckBoxProps<T>) {
  return (
    <Controller
      render={({ field }) => (
        <label className={`custom-checkbox ${className}`} {...props}>
          <input
            type="checkbox"
            checked={field.value ?? false}
            onChange={(e) => {
              field.onChange(e.target.checked);
            }}
            disabled={disabled}
            ref={field.ref}
          />
          <span className="checkmark"></span>
          {label}
        </label>
      )}
      name={name}
      control={control}
      defaultValue={false as T[typeof name]}
    />
  );
}
