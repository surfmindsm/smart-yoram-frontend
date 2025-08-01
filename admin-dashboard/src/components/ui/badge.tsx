import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: "bg-sky-100 text-sky-700 border-sky-200",
    secondary: "bg-gray-100 text-gray-700 border-gray-200",
    destructive: "bg-red-100 text-red-700 border-red-200",
    outline: "text-gray-700 border-gray-200",
    success: "bg-green-100 text-green-700 border-green-200"
  }

  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )} 
      {...props} 
    />
  )
}

export { Badge }