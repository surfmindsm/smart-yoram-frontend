import * as React from "react"
import { Clock } from "lucide-react"
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

  const handleHourChange = (hour: number, meridiem: 'AM' | 'PM') => {
    let newHour = hour
    if (meridiem === 'PM' && hour !== 12) {
      newHour = hour + 12
    } else if (meridiem === 'AM' && hour === 12) {
      newHour = 0
    }
    onChange(`${String(newHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  }

  const handleMinuteChange = (minute: number) => {
    onChange(`${String(hours).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
  }

  const handleMeridiemChange = (meridiem: 'AM' | 'PM') => {
    const currentMeridiem = isPM ? 'PM' : 'AM'
    if (currentMeridiem === meridiem) return

    let newHour = hours
    if (meridiem === 'PM') {
      newHour = hours < 12 ? hours + 12 : hours
    } else {
      newHour = hours >= 12 ? hours - 12 : hours
    }
    onChange(`${String(newHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  }

  const formatDisplayTime = () => {
    if (!value) return "-- --:--"
    return `${isPM ? '오후' : '오전'} ${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
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
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2 mb-3">
            {/* Meridiem (오전/오후) */}
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant={!isPM ? "default" : "outline"}
                size="sm"
                onClick={() => handleMeridiemChange('AM')}
                className="h-12"
              >
                오전
              </Button>
              <Button
                type="button"
                variant={isPM ? "default" : "outline"}
                size="sm"
                onClick={() => handleMeridiemChange('PM')}
                className="h-12"
              >
                오후
              </Button>
            </div>

            {/* Hours */}
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                <Button
                  key={hour}
                  type="button"
                  variant={displayHours === hour ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleHourChange(hour, isPM ? 'PM' : 'AM')}
                  className="h-12"
                >
                  {String(hour).padStart(2, '0')}
                </Button>
              ))}
            </div>

            {/* Minutes */}
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                <Button
                  key={minute}
                  type="button"
                  variant={minutes === minute ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMinuteChange(minute)}
                  className="h-12"
                >
                  {String(minute).padStart(2, '0')}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
