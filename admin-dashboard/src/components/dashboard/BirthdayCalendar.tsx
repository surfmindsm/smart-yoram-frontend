import React, { useMemo, useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, getMonth, getYear, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-day-picker/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Button } from '../ui';
import { ChevronLeft, ChevronRight, Cake } from 'lucide-react';
import { Badge } from '../ui';
import { supabaseApiService } from '../../services/supabaseApiService';

interface Member {
  id: number;
  name: string;
  phone?: string;
  birthdate: string;
  position_main?: string;
  position_detail?: string;
  department?: string;
  organization_id?: number;
  church_organizations?: {
    id: number;
    name: string;
  };
}

interface BirthdayCalendarProps {
  onMemberClick?: (member: Member) => void;
}

const BirthdayCalendar: React.FC<BirthdayCalendarProps> = ({
  onMemberClick,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [allBirthdays, setAllBirthdays] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 월이 변경될 때마다 해당 월의 생일자 데이터 fetch
  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        setIsLoading(true);
        const year = getYear(currentMonth);
        const month = getMonth(currentMonth) + 1; // 0-based to 1-based

        const { data } = await supabaseApiService.birthdays.getByMonth(year, month);
        setAllBirthdays(data || []);
      } catch (error) {
        console.error('생일자 데이터 조회 실패:', error);
        setAllBirthdays([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBirthdays();
  }, [currentMonth]);

  // 현재 월에 생일이 있는 날짜 목록 생성
  const birthdayDates = useMemo(() => {
    const dates: Date[] = [];
    const currentYear = getYear(currentMonth);
    const currentMonthNum = getMonth(currentMonth);

    allBirthdays.forEach((member) => {
      if (member.birthdate) {
        const birthDate = new Date(member.birthdate);
        const birthMonth = getMonth(birthDate);
        const birthDay = birthDate.getDate();

        // 현재 보고 있는 월과 생일 월이 같으면 추가
        if (birthMonth === currentMonthNum) {
          dates.push(new Date(currentYear, currentMonthNum, birthDay));
        }
      }
    });

    return dates;
  }, [allBirthdays, currentMonth]);

  // 특정 날짜의 생일자 목록 가져오기
  const getBirthdayMembersForDate = (date: Date) => {
    const month = getMonth(date);
    const day = date.getDate();

    return allBirthdays.filter((member) => {
      if (!member.birthdate) return false;
      const birthDate = new Date(member.birthdate);
      return getMonth(birthDate) === month && birthDate.getDate() === day;
    });
  };

  // 선택된 날짜의 생일자 목록
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const selectedBirthdays = selectedDate
    ? getBirthdayMembersForDate(selectedDate)
    : [];

  // 월 변경 핸들러
  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  // 현재 월의 생일자 수
  const currentMonthBirthdayCount = useMemo(() => {
    const currentMonthNum = getMonth(currentMonth);
    return allBirthdays.filter((member) => {
      if (!member.birthdate) return false;
      const birthDate = new Date(member.birthdate);
      return getMonth(birthDate) === currentMonthNum;
    }).length;
  }, [allBirthdays, currentMonth]);


  return (
    <Card className="border-muted">
      <CardContent className="pt-6">
        {/* 월 네비게이션 - 중앙 정렬 */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousMonth}
            className="h-10 w-10 p-0 rounded-full hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="text-2xl font-bold min-w-[180px] text-center">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="h-10 w-10 p-0 rounded-full hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 좌측: 캘린더 */}
          <div className="flex justify-center">
            {/* 캘린더 */}
            <div className="birthday-calendar-wrapper w-fit">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={ko}
                modifiers={{
                  birthday: birthdayDates,
                }}
                modifiersClassNames={{
                  birthday: 'has-birthday',
                }}
                showOutsideDays={false}
              />
            </div>
          </div>

          {/* 우측: 선택된 날짜 정보 */}
          <div className="border-l border-border pl-8">
            <div className="bg-muted/30 rounded-lg p-6 min-h-[400px]">
              {selectedDate ? (
                <div>
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-2">선택일</p>
                    <h3 className="text-2xl font-bold">
                      {format(selectedDate, 'yyyy년 M월 d일', { locale: ko })}
                    </h3>
                  </div>

                  <div className="border-t border-border pt-6">
                    {selectedBirthdays.length > 0 ? (
                      <div className="space-y-4">
                        {selectedBirthdays.map((member) => (
                          <div
                            key={member.id}
                            className="cursor-pointer hover:bg-muted/50 p-4 rounded-lg transition-colors"
                            onClick={() => onMemberClick?.(member)}
                          >
                            <div className="flex items-start gap-3 mb-2">
                              <span className="font-bold text-foreground min-w-[80px]">기간안내</span>
                              <span className="text-muted-foreground">생일입니다.</span>
                            </div>
                            <div className="flex items-start gap-3 mb-2">
                              <span className="font-bold text-foreground min-w-[80px]">예약문의</span>
                              <span className="text-muted-foreground">{member.name}</span>
                            </div>
                            {member.phone && (
                              <div className="flex items-start gap-3 mb-2">
                                <span className="font-bold text-foreground min-w-[80px]">계좌번호</span>
                                <span className="text-muted-foreground">{member.phone}</span>
                              </div>
                            )}
                            <div className="flex items-start gap-3">
                              <span className="font-bold text-foreground min-w-[80px]">기타사항</span>
                              <span className="text-muted-foreground">
                                {member.department || '부서 정보 없음'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Cake className="h-16 w-16 mx-auto mb-3 opacity-20" />
                        <p className="text-muted-foreground">이 날짜에 생일자가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Cake className="h-16 w-16 mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground mb-2">날짜를 선택해주세요</p>
                  {currentMonthBirthdayCount > 0 && (
                    <p className="text-sm text-primary-500 font-medium">
                      이번 달 생일자 {currentMonthBirthdayCount}명
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <style>{`
        .birthday-calendar-wrapper .rdp {
          --rdp-accent-color: #000;
          --rdp-background-color: #000;
          margin: 0;
          background-color: hsl(var(--muted) / 0.3);
          border-radius: 0.75rem;
          padding: 1.5rem;
        }

        .birthday-calendar-wrapper .rdp-month_caption {
          display: none;
        }

        .birthday-calendar-wrapper .rdp-nav {
          display: none;
        }

        .birthday-calendar-wrapper .rdp-button_previous,
        .birthday-calendar-wrapper .rdp-button_next {
          display: none;
        }

        .birthday-calendar-wrapper .rdp-months {
          width: 100%;
        }

        .birthday-calendar-wrapper .rdp-month {
          width: 100%;
        }

        .birthday-calendar-wrapper .rdp-weekdays {
          margin-bottom: 0.5rem;
        }

        .birthday-calendar-wrapper .rdp-weekday {
          font-size: 0.875rem;
          font-weight: 500;
          color: hsl(var(--foreground));
          padding: 0.75rem 0;
          width: 3.5rem;
        }

        /* 일요일 빨간색 */
        .birthday-calendar-wrapper .rdp-weekday:first-child {
          color: #ef4444;
        }

        /* 토요일 검은색 */
        .birthday-calendar-wrapper .rdp-weekday:last-child {
          color: hsl(var(--foreground));
        }

        .birthday-calendar-wrapper .rdp-week {
          margin: 0;
        }

        .birthday-calendar-wrapper .rdp-day {
          width: 3.5rem;
          height: 3.5rem;
          padding: 0;
        }

        .birthday-calendar-wrapper .rdp-day_button {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 50%;
          font-size: 1rem;
          font-weight: 400;
          border: none;
          background: transparent;
          color: hsl(var(--foreground));
        }

        /* 일요일 날짜 빨간색 */
        .birthday-calendar-wrapper .rdp-day:first-child .rdp-day_button {
          color: #ef4444;
        }

        /* 토요일 날짜 검은색 */
        .birthday-calendar-wrapper .rdp-day:last-child .rdp-day_button {
          color: hsl(var(--foreground));
        }

        .birthday-calendar-wrapper .rdp-day_button:hover:not(.rdp-selected) {
          background-color: hsl(var(--muted));
        }

        /* 선택된 날짜 */
        .birthday-calendar-wrapper .rdp-selected .rdp-day_button {
          background-color: #000;
          color: white;
          font-weight: 600;
        }

        /* 생일이 있는 날짜 - 빨간 뱃지 */
        .birthday-calendar-wrapper .has-birthday .rdp-day_button {
          position: relative;
        }

        .birthday-calendar-wrapper .has-birthday .rdp-day_button::after {
          content: '';
          position: absolute;
          bottom: 0.25rem;
          left: 50%;
          transform: translateX(-50%);
          width: 0.375rem;
          height: 0.375rem;
          background-color: #ef4444;
          border-radius: 50%;
        }

        .birthday-calendar-wrapper .rdp-outside {
          opacity: 0.3;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.3);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.5);
        }
      `}</style>
    </Card>
  );
};

export default BirthdayCalendar;
