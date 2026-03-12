/* eslint-disable @typescript-eslint/no-explicit-any */
import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { Controller } from "react-hook-form";
import type { Control, FieldValues, Path } from "react-hook-form";

interface TextareaProps<T extends FieldValues> extends HTMLAttributes<HTMLTextAreaElement> {
  name: Path<T>;
  control: Control<T>;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps<any>>(({ control, name, ...props }, ref) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <textarea
          {...props}
          {...field}
          ref={ref} // Attach the forwarded ref here
          value={field.value || ""}
          onChange={field.onChange}
          disabled={props.disabled}
        />
      )}
      defaultValue=""
    />
  );
});
Textarea.displayName = "Textarea";

export default Textarea;
