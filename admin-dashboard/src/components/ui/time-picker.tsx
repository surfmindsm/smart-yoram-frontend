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
  const [editingHour, setEditingHour] = React.useState<string | null>(null)
  const [editingMinute, setEditingMinute] = React.useState<string | null>(null)

  // Parse the time value (HH:mm format)
  const [hours, minutes] = value ? value.split(':').map(Number) : [12, 0]
  const isPM = hours >= 12
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours

  const handleHourIncrement = () => {
    setEditingHour(null) // 편집 상태 초기화
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
    setEditingHour(null) // 편집 상태 초기화
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
    setEditingMinute(null) // 편집 상태 초기화
    const newMinute = (minutes + 1) % 60
    onChange(`${String(hours).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`)
  }

  const handleMinuteDecrement = () => {
    setEditingMinute(null) // 편집 상태 초기화
    const newMinute = minutes - 1 < 0 ? 59 : minutes - 1
    onChange(`${String(hours).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`)
  }

  const handleMeridiemToggle = () => {
    setEditingHour(null) // 편집 상태 초기화
    setEditingMinute(null) // 편집 상태 초기화
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

    // 편집 중인 값을 state에 저장
    setEditingHour(inputValue)

    // 빈 값은 나중에 blur에서 처리
    if (inputValue === '') {
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

  const handleHourFocus = () => {
    // 포커스 시 현재 값을 editing state에 설정
    setEditingHour(String(displayHours))
  }

  const handleHourBlur = () => {
    // 편집 상태 종료
    setEditingHour(null)

    // 빈 값이면 기본값 설정
    if (editingHour === '' || !editingHour) {
      let hour24 = isPM ? 12 : 0
      onChange(`${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
      return
    }

    const newHour = parseInt(editingHour, 10)
    if (isNaN(newHour) || newHour < 1 || newHour > 12) {
      // 유효하지 않으면 현재 값 유지
      return
    }

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

    // 편집 중인 값을 state에 저장
    setEditingMinute(inputValue)

    // 빈 값은 나중에 blur에서 처리
    if (inputValue === '') {
      return
    }

    const newMinute = parseInt(inputValue, 10)
    if (isNaN(newMinute) || newMinute < 0 || newMinute > 59) return

    onChange(`${String(hours).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`)
  }

  const handleMinuteFocus = () => {
    // 포커스 시 현재 값을 editing state에 설정
    setEditingMinute(String(minutes).padStart(2, '0'))
  }

  const handleMinuteBlur = () => {
    // 편집 상태 종료
    setEditingMinute(null)

    // 빈 값이면 기본값 설정
    if (editingMinute === '' || !editingMinute) {
      onChange(`${String(hours).padStart(2, '0')}:00`)
      return
    }

    const newMinute = parseInt(editingMinute, 10)
    if (isNaN(newMinute) || newMinute < 0 || newMinute > 59) {
      // 유효하지 않으면 현재 값 유지
      return
    }

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
              type="text"
              value={editingHour !== null ? editingHour : displayHours}
              onChange={handleHourChange}
              onFocus={(e) => {
                handleHourFocus()
                e.target.select()
              }}
              onBlur={handleHourBlur}
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
              type="text"
              value={editingMinute !== null ? editingMinute : String(minutes).padStart(2, '0')}
              onChange={handleMinuteChange}
              onFocus={(e) => {
                handleMinuteFocus()
                e.target.select()
              }}
              onBlur={handleMinuteBlur}
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
