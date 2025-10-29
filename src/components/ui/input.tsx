import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error,
      label,
      helperText,
      required,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const inputId = React.useId();
    const id = providedId || inputId;

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <input
          id={id}
          type={type}
          className={cn(
            // Touch-friendly sizing (44px height)
            "flex h-11 w-full rounded-md bg-white px-4 py-2 text-base",
            // Prevents zoom on iOS
            "font-normal",
            // Border and focus states
            "border border-gray-300",
            "placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:border-primary-500",
            // Error state
            error && "border-red-500 focus:ring-red-500 focus:border-red-500",
            // Disabled state
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
            // Selection styling
            "selection:bg-primary-100",
            className
          )}
          ref={ref}
          aria-describedby={
            error ? `${id}-error` : helperText ? `${id}-help` : undefined
          }
          aria-invalid={!!error}
          {...props}
        />

        {/* Helper text */}
        {helperText && !error && (
          <p id={`${id}-help`} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p id={`${id}-error`} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
