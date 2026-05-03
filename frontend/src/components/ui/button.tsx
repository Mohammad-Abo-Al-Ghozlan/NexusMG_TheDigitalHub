import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium",
    "transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0F]",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-95",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-[#6C63FF] text-white",
          "shadow-[0_0_20px_rgba(108,99,255,0.3)]",
          "hover:bg-[#5B54E6] hover:shadow-[0_0_35px_rgba(108,99,255,0.5)]",
        ].join(" "),
        destructive: "bg-[#FF4D6D] text-white shadow-sm hover:bg-[#E8445F] hover:shadow-[0_0_20px_rgba(255,77,109,0.3)]",
        outline: [
          "border border-[#1E1E2E] bg-transparent text-[#F0F0FF] shadow-sm",
          "hover:border-[#6C63FF] hover:bg-[#6C63FF0D] hover:shadow-[0_0_15px_rgba(108,99,255,0.2)]",
        ].join(" "),
        secondary: "bg-[#1E1E2E] text-[#F0F0FF] shadow-sm hover:bg-[#2A2A3E]",
        ghost: "text-[#8888AA] hover:bg-[#6C63FF0D] hover:text-[#F0F0FF]",
        link: "text-[#6C63FF] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading...</span>
          </>
        ) : children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
