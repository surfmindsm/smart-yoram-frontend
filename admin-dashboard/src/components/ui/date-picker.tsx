import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  disableFuture?: boolean; // 미래 날짜 선택 불가
  disablePast?: boolean;   // 과거 날짜 선택 불가
  fromYear?: number;       // 시작 년도
  toYear?: number;         // 종료 년도
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "날짜를 선택해주세요",
  disabled = false,
  className,
  disableFuture = false,
  disablePast = false,
  fromYear = 1920,
  toYear = new Date().getFullYear() + 10
}) => {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );

  // value prop이 변경되면 상태 업데이트
  React.useEffect(() => {
    setDate(value ? new Date(value) : undefined);
  }, [value]);

  // 오늘 날짜의 시작 (00:00:00)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      onChange(selectedDate.toISOString().split('T')[0]);
    } else {
      onChange('');
    }
  };

  // 날짜 제약 조건
  const getDisabledDates = (date: Date) => {
    if (disableFuture && date > today) return true;
    if (disablePast && date < today) return true;
    return false;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 px-3 py-2",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "yyyy년 MM월 dd일", { locale: ko }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          disabled={disableFuture || disablePast ? getDisabledDates : undefined}
          initialFocus
          locale={ko}
          captionLayout="dropdown"
          fromYear={fromYear}
          toYear={toYear}
        />
      </PopoverContent>
    </Popover>
  );
};