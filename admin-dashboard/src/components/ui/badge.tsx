import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-[10px] py-[3px] text-[11px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-[#FCEBEB] text-[#DC2626] hover:bg-[#FCEBEB]/80",
        outline:
          "border border-border bg-card text-foreground",
        info:
          "bg-[#EAF1FE] text-[#2563EB] hover:bg-[#EAF1FE]/80",
        success:
          "bg-[#E7F6EC] text-[#16A34A] hover:bg-[#E7F6EC]/80",
        warning:
          "bg-[#FBF1E3] text-[#B45309] hover:bg-[#FBF1E3]/80",
        danger:
          "bg-[#FCEBEB] text-[#DC2626] hover:bg-[#FCEBEB]/80",
        neutral:
          "bg-[#F1F4F9] text-[#64748B] hover:bg-[#F1F4F9]/80",
        accent:
          "bg-[#F0E6EF] text-[#8A5A86] hover:bg-[#F0E6EF]/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "info"
    | "success"
    | "warning"
    | "danger"
    | "neutral"
    | "accent"
    | null
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
