import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
    "transition-all duration-200 ease-out",
    "focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 focus:ring-offset-[#0A0A0F]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:     "border-transparent bg-[#6C63FF] text-white shadow-sm hover:bg-[#5B54E6]",
        secondary:   "border-[#1E1E2E] bg-[#1E1E2E] text-[#8888AA] hover:bg-[#2A2A3E]",
        destructive: "border-transparent bg-[#FF4D6D] text-white shadow-sm hover:bg-[#E8445F] badge-pulse-danger",
        outline:     "border-[#1E1E2E] text-[#8888AA]",
        success:     "border-transparent bg-[#00C896] text-white shadow-sm hover:bg-[#00B085] badge-glow-success",
        warning:     "border-transparent bg-[#FFB830] text-[#0A0A0F] shadow-sm hover:bg-[#E6A52B]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
