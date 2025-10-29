import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles with accessibility and touch-friendly design
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        // Primary - Main actions
        primary:
          "bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500",
        // Secondary - Alternative actions
        secondary:
          "bg-gray-500 text-white hover:bg-gray-600 focus-visible:ring-gray-500",
        // Outline - Less prominent actions
        outline:
          "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-primary-500",
        // Ghost - Minimal actions
        ghost: "text-gray-700 hover:bg-gray-100 focus-visible:ring-primary-500",
        // Danger - Destructive actions
        danger:
          "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500",
        // Success - Positive actions
        success:
          "bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500",
      },
      size: {
        // Touch-friendly sizes (44px minimum height)
        sm: "h-11 px-3 text-sm min-h-[44px]", // 44px height
        md: "h-11 px-4 text-base min-h-[44px]", // 44px height
        lg: "h-12 px-6 text-lg min-h-[48px]", // 48px height
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]", // 44px square
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth && "w-full",
          loading && "cursor-wait",
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
