import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfWeek, endOfWeek, subMonths, subYears } from "date-fns"
import { ko } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  className?: string
}

type PresetOption = {
  label: string
  getValue: () => DateRange
}

const presetOptions: PresetOption[] = [
  {
    label: "오늘",
    getValue: () => ({
      from: new Date(),
      to: new Date(),
    }),
  },
  {
    label: "어제",
    getValue: () => {
      const yesterday = subDays(new Date(), 1)
      return {
        from: yesterday,
        to: yesterday,
      }
    },
  },
  {
    label: "지난 7일",
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    label: "지난 28일",
    getValue: () => ({
      from: subDays(new Date(), 27),
      to: new Date(),
    }),
  },
  {
    label: "지난 30일",
    getValue: () => ({
      from: subDays(new Date(), 29),
      to: new Date(),
    }),
  },
  {
    label: "지난 90일",
    getValue: () => ({
      from: subDays(new Date(), 89),
      to: new Date(),
    }),
  },
  {
    label: "이번 주(일요일~오늘)",
    getValue: () => ({
      from: startOfWeek(new Date(), { weekStartsOn: 0 }),
      to: new Date(),
    }),
  },
  {
    label: "이번 달",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: new Date(),
    }),
  },
  {
    label: "지난달",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1)
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      }
    },
  },
  {
    label: "올해(1월~오늘)",
    getValue: () => ({
      from: startOfYear(new Date()),
      to: new Date(),
    }),
  },
  {
    label: "지난주(일요일~토요일)",
    getValue: () => {
      const lastWeekEnd = subDays(startOfWeek(new Date(), { weekStartsOn: 0 }), 1)
      const lastWeekStart = startOfWeek(lastWeekEnd, { weekStartsOn: 0 })
      return {
        from: lastWeekStart,
        to: lastWeekEnd,
      }
    },
  },
  {
    label: "달력상 작년",
    getValue: () => {
      const lastYear = subYears(new Date(), 1)
      return {
        from: startOfYear(lastYear),
        to: endOfYear(lastYear),
      }
    },
  },
]

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value)
  const [selectedPreset, setSelectedPreset] = React.useState<string>("custom")

  React.useEffect(() => {
    setDate(value)
  }, [value])

  const handlePresetChange = (presetLabel: string) => {
    if (presetLabel === "custom") {
      setSelectedPreset("custom")
      return
    }

    const preset = presetOptions.find((p) => p.label === presetLabel)
    if (preset) {
      const range = preset.getValue()
      setDate(range)
      setSelectedPreset(presetLabel)
      onChange?.(range)
    }
  }

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate)
    setSelectedPreset("custom")
    onChange?.(newDate)
  }

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return "기간 선택"

    const fromStr = format(range.from, "yy.MM.dd", { locale: ko })
    const toStr = range.to ? format(range.to, "yy.MM.dd", { locale: ko }) : fromStr

    return range.to ? `${fromStr} ~ ${toStr}` : fromStr
  }

  return (
    <div className={cn("flex items-center", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-fit justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(date)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Preset Options Sidebar */}
            <div className="border-r p-2 w-48">
              <div className="space-y-1">
                <button
                  onClick={() => handlePresetChange("custom")}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded hover:bg-accent",
                    selectedPreset === "custom" && "bg-accent font-medium"
                  )}
                >
                  맞춤
                </button>
                {presetOptions.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetChange(preset.label)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded hover:bg-accent",
                      selectedPreset === preset.label && "bg-accent font-medium"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Calendar */}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleDateChange}
                numberOfMonths={2}
                locale={ko}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
