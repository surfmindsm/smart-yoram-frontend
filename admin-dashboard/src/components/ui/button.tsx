import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-[12.5px] font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-border bg-card text-[#334155] hover:bg-secondary hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-[#334155] hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Soft 톤 — Badge와 같은 색 페어. 강조 없이 차분하게.
        "destructive-soft":
          "bg-[#FCEBEB] text-[#DC2626] hover:bg-[#FCEBEB]/80",
        "success-soft":
          "bg-[#E7F6EC] text-[#16A34A] hover:bg-[#E7F6EC]/80",
        "warning-soft":
          "bg-[#FBF1E3] text-[#B45309] hover:bg-[#FBF1E3]/80",
        "info-soft":
          "bg-[#EAF1FE] text-[#2563EB] hover:bg-[#EAF1FE]/80",
      },
      size: {
        default: "h-[34px] px-[14px]",
        sm: "h-8 rounded-[8px] px-3 text-[12px]",
        lg: "h-10 rounded-[8px] px-6 text-[13px]",
        icon: "h-[34px] w-[34px]",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
