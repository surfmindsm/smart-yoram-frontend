import React from 'react';
import { format, parse, isValid } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Input } from './input';

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
  placeholder = "예: 1985-01-25 또는 1985.01.25",
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
  const [inputValue, setInputValue] = React.useState<string>(value || '');
  const [open, setOpen] = React.useState(false);

  // value prop이 변경되면 상태 업데이트
  React.useEffect(() => {
    setDate(value ? new Date(value) : undefined);
    setInputValue(value || '');
  }, [value]);

  // 오늘 날짜의 시작 (00:00:00)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      // 로컬 시간대를 고려하여 날짜 문자열 생성
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setInputValue(formattedDate);
      onChange(formattedDate);
    } else {
      setInputValue('');
      onChange('');
    }
    setOpen(false);
  };

  // 타이핑 입력 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // 빈 값 처리
    if (newValue === '') {
      setDate(undefined);
      onChange('');
      return;
    }

    // 다양한 날짜 형식 지원
    let parsedDate: Date | undefined;
    let formattedDate = '';

    // YYYY-MM-DD (하이픈)
    if (/^\d{4}-\d{2}-\d{2}$/.test(newValue)) {
      parsedDate = parse(newValue, 'yyyy-MM-dd', new Date());
      formattedDate = newValue;
    }
    // YYYY.MM.DD (점)
    else if (/^\d{4}\.\d{2}\.\d{2}$/.test(newValue)) {
      parsedDate = parse(newValue, 'yyyy.MM.dd', new Date());
      if (isValid(parsedDate)) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      }
    }
    // YYYY/MM/DD (슬래시)
    else if (/^\d{4}\/\d{2}\/\d{2}$/.test(newValue)) {
      parsedDate = parse(newValue, 'yyyy/MM/dd', new Date());
      if (isValid(parsedDate)) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      }
    }
    // YYYYMMDD (구분자 없음)
    else if (/^\d{8}$/.test(newValue)) {
      parsedDate = parse(newValue, 'yyyyMMdd', new Date());
      if (isValid(parsedDate)) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      }
    }

    // 유효한 날짜면 적용
    if (parsedDate && isValid(parsedDate) && formattedDate) {
      setDate(parsedDate);
      onChange(formattedDate);
    }
  };

  // 날짜 제약 조건
  const getDisabledDates = (date: Date) => {
    if (disableFuture && date > today) return true;
    if (disablePast && date < today) return true;
    return false;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-10 px-3"
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
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
    </div>
  );
};