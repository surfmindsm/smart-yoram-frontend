import * as React from "react"
import { cn } from "../../lib/utils"

interface SliderProps {
  value?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  className?: string
  id?: string
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value = [0], onValueChange, min = 0, max = 100, step = 1, className, id, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value)
      if (onValueChange) {
        onValueChange([newValue])
      }
    }

    return (
      <div className={cn("relative flex w-full items-center", className)}>
        <input
          ref={ref}
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, rgb(14 165 233) 0%, rgb(14 165 233) ${
              ((value[0] - min) / (max - min)) * 100
            }%, rgb(226 232 240) ${((value[0] - min) / (max - min)) * 100}%, rgb(226 232 240) 100%)`
          }}
          {...props}
        />
      </div>
    )
  }
)

Slider.displayName = "Slider"

export { Slider }