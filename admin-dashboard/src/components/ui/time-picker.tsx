import * as React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  // Parse the time value (HH:mm format)
  const [hours, minutes] = value ? value.split(':').map(Number) : [12, 0]
  const isPM = hours >= 12
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours

  const handleHourIncrement = () => {
    let newHour = displayHours + 1
    if (newHour > 12) newHour = 1

    let hour24 = newHour
    if (isPM && newHour !== 12) {
      hour24 = newHour + 12
    } else if (!isPM && newHour === 12) {
      hour24 = 0
    }

    onChange(`${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  }

  const handleHourDecrement = () => {
    let newHour = displayHours - 1
    if (newHour < 1) newHour = 12

    let hour24 = newHour
    if (isPM && newHour !== 12) {
      hour24 = newHour + 12
    } else if (!isPM && newHour === 12) {
      hour24 = 0
    }

    onChange(`${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  }

  const handleMinuteIncrement = () => {
    const newMinute = (minutes + 1) % 60
    onChange(`${String(hours).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`)
  }

  const handleMinuteDecrement = () => {
    const newMinute = minutes - 1 < 0 ? 59 : minutes - 1
    onChange(`${String(hours).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`)
  }

  const handleMeridiemToggle = () => {
    let newHour = hours
    if (isPM) {
      // PM to AM
      newHour = hours - 12 < 0 ? hours : hours - 12
    } else {
      // AM to PM
      newHour = hours + 12 >= 24 ? hours : hours + 12
    }
    onChange(`${String(newHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  }

  return (
    <div className={cn("flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-input", className)}>
      {/* Hours */}
      <div className="flex flex-col items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-8 p-0"
          onClick={handleHourIncrement}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <div className="text-2xl font-semibold w-12 text-center">
          {String(displayHours).padStart(2, '0')}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-8 p-0"
          onClick={handleHourDecrement}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-2xl font-semibold">:</div>

      {/* Minutes */}
      <div className="flex flex-col items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-8 p-0"
          onClick={handleMinuteIncrement}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <div className="text-2xl font-semibold w-12 text-center">
          {String(minutes).padStart(2, '0')}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-8 p-0"
          onClick={handleMinuteDecrement}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-2xl font-semibold">:</div>

      {/* AM/PM */}
      <div className="flex flex-col items-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-8 p-0"
          onClick={handleMeridiemToggle}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <div className="text-xl font-semibold w-12 text-center">
          {isPM ? 'pm' : 'am'}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 w-8 p-0"
          onClick={handleMeridiemToggle}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
