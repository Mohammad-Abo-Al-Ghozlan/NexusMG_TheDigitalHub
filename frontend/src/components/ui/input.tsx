import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg px-3 py-2 text-sm text-[#F0F0FF]",
          "bg-[#0A0A0F] border border-[#1E1E2E]",
          "ring-offset-[#0A0A0F]",
          "placeholder:text-[#44445A] placeholder:transition-opacity placeholder:duration-200",
          /* smooth focus transition */
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none",
          "focus-visible:border-[#6C63FF] focus-visible:ring-2 focus-visible:ring-[#6C63FF] focus-visible:ring-offset-2",
          "focus-visible:shadow-[0_0_0_3px_rgba(108,99,255,0.15)]",
          "focus-visible:placeholder:opacity-50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
