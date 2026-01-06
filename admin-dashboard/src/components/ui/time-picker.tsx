import * as React from "react"
import { ChevronUp, ChevronDown, Clock } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

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

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    if (inputValue === '') {
      onChange(`00:${String(minutes).padStart(2, '0')}`)
      return
    }

    const newHour = parseInt(inputValue, 10)
    if (isNaN(newHour)) return

    // 12시간 형식 입력 (1-12)
    if (newHour < 1 || newHour > 12) return

    // 24시간 형식으로 변환
    let hour24 = newHour
    if (isPM && newHour !== 12) {
      hour24 = newHour + 12
    } else if (!isPM && newHour === 12) {
      hour24 = 0
    }

    onChange(`${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  }

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    if (inputValue === '') {
      onChange(`${String(hours).padStart(2, '0')}:00`)
      return
    }

    const newMinute = parseInt(inputValue, 10)
    if (isNaN(newMinute) || newMinute < 0 || newMinute > 59) return

    onChange(`${String(hours).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`)
  }

  const formatDisplayTime = () => {
    if (!value) return "-- --:--"
    return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {formatDisplayTime()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex items-center gap-1 p-2 bg-popover">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-6 p-0"
              onClick={handleHourIncrement}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <input
              type="number"
              min="1"
              max="12"
              value={displayHours}
              onChange={handleHourChange}
              className="text-sm font-medium w-10 text-center py-0.5 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-6 p-0"
              onClick={handleHourDecrement}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-sm font-medium">:</div>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-6 p-0"
              onClick={handleMinuteIncrement}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <input
              type="number"
              min="0"
              max="59"
              value={String(minutes).padStart(2, '0')}
              onChange={handleMinuteChange}
              className="text-sm font-medium w-10 text-center py-0.5 border rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-6 p-0"
              onClick={handleMinuteDecrement}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-sm font-medium">:</div>

          {/* AM/PM */}
          <div className="flex flex-col items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-6 p-0"
              onClick={handleMeridiemToggle}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <div className="text-xs font-medium w-7 text-center py-0.5">
              {isPM ? 'pm' : 'am'}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-6 p-0"
              onClick={handleMeridiemToggle}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
