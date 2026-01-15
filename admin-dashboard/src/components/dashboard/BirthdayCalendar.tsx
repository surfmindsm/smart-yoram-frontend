import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { format, getMonth, getYear, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-day-picker/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Button } from '../ui';
import { ChevronLeft, ChevronRight, Cake, Calendar, CheckCircle, Circle, Flag } from 'lucide-react';
import { Badge } from '../ui';
import { supabaseApiService } from '../../services/supabaseApiService';
import { useToast } from '../../hooks/use-toast';
import { Lunar, Solar } from 'lunar-javascript';

interface Member {
  id: number;
  name: string;
  phone?: string;
  birthdate: string;
  birthdate_type?: string; // 생년월일 구분 (양력/음력)
  position_main?: string;
  position_detail?: string;
  department?: string;
  organization_id?: number;
  church_organizations?: {
    id: number;
    name: string;
  };
}

interface ImportantDate {
  id: number;
  title: string;
  event_date: string | null;
  description?: string;
  enable_dday_alert: boolean;
  alert_days_before: number;
  is_active: boolean;
  is_completed: boolean;
  notes?: string;
  member_id?: number;
  members?: {
    id: number;
    name: string;
    phone?: string;
  };
}

interface Holiday {
  date: string; // YYYY-MM-DD 형식
  name: string;
  isLunar?: boolean;
}

interface BirthdayCalendarProps {
  onMemberClick?: (member: Member) => void;
}

// 한국 공휴일 데이터 (2026년 기준)
const HOLIDAYS_2026: Holiday[] = [
  { date: '2026-01-01', name: '신정' },
  { date: '2026-02-16', name: '설날 전날', isLunar: true },
  { date: '2026-02-17', name: '설날', isLunar: true },
  { date: '2026-02-18', name: '설날 다음날', isLunar: true },
  { date: '2026-03-01', name: '삼일절' },
  { date: '2026-05-05', name: '어린이날' },
  { date: '2026-05-24', name: '부처님오신날', isLunar: true },
  { date: '2026-05-25', name: '부처님오신날 대체공휴일' },
  { date: '2026-06-06', name: '현충일' },
  { date: '2026-08-15', name: '광복절' },
  { date: '2026-08-17', name: '광복절 대체공휴일' },
  { date: '2026-10-03', name: '개천절' },
  { date: '2026-10-04', name: '추석 전날', isLunar: true },
  { date: '2026-10-05', name: '추석', isLunar: true },
  { date: '2026-10-06', name: '추석 다음날', isLunar: true },
  { date: '2026-10-07', name: '추석 대체공휴일' },
  { date: '2026-10-09', name: '한글날' },
  { date: '2026-12-25', name: '성탄절' },
];

const BirthdayCalendar: React.FC<BirthdayCalendarProps> = ({
  onMemberClick,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [allBirthdays, setAllBirthdays] = useState<Member[]>([]);
  const [allDates, setAllDates] = useState<ImportantDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 컴포넌트 마운트 시 전체 데이터를 한 번만 fetch (캐싱)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // 전체 생일자와 일정 데이터를 한 번에 fetch
        const [birthdaysResult, datesResult] = await Promise.all([
          supabaseApiService.birthdays.getAll(),
          supabaseApiService.importantDates.getAll(),
        ]);

        setAllBirthdays(birthdaysResult.data || []);
        setAllDates(datesResult.data || []);
      } catch (error) {
        console.error('데이터 조회 실패:', error);
        setAllBirthdays([]);
        setAllDates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // 빈 배열: 마운트 시 한 번만 실행

  // 현재 월의 공휴일 목록
  const currentMonthHolidays = useMemo(() => {
    const currentMonthNum = getMonth(currentMonth);
    const currentYear = getYear(currentMonth);

    return HOLIDAYS_2026.filter((holiday) => {
      const holidayDate = new Date(holiday.date);
      return getYear(holidayDate) === currentYear && getMonth(holidayDate) === currentMonthNum;
    });
  }, [currentMonth]);

  // 현재 월에 공휴일이 있는 날짜 목록 생성
  const holidayDates = useMemo(() => {
    const dates: Date[] = [];
    const currentYear = getYear(currentMonth);
    const currentMonthNum = getMonth(currentMonth);

    currentMonthHolidays.forEach((holiday) => {
      const holidayDate = new Date(holiday.date);
      const holidayDay = holidayDate.getDate();
      dates.push(new Date(currentYear, currentMonthNum, holidayDay));
    });

    return dates;
  }, [currentMonthHolidays, currentMonth]);

  // 음력 생일을 양력으로 변환하는 함수
  const convertLunarToSolar = (lunarDate: string, targetYear: number): Date | null => {
    try {
      // lunarDate는 "1990-01-15" 형식의 문자열 (음력 날짜를 나타냄)
      // new Date()로 파싱하면 양력으로 해석되므로, 문자열을 직접 파싱
      const parts = lunarDate.split('-');
      if (parts.length !== 3) {
        console.error('잘못된 날짜 형식:', lunarDate);
        return null;
      }

      const lunarMonth = parseInt(parts[1], 10); // 월 (1-12)
      const lunarDay = parseInt(parts[2], 10);   // 일 (1-31)

      // 음력을 양력으로 변환
      const lunar = Lunar.fromYmd(targetYear, lunarMonth, lunarDay);
      const solar = lunar.getSolar();

      // _p 속성에서 실제 데이터 추출
      const p = solar._p;
      const resultDate = new Date(p.year, p.month - 1, p.day);

      // 디버깅: 변환 결과 로그
      console.log('🌙 음력→양력 변환:', {
        입력: `음력 ${targetYear}년 ${lunarMonth}월 ${lunarDay}일`,
        결과: `양력 ${p.year}년 ${p.month}월 ${p.day}일`
      });

      return resultDate;
    } catch (error) {
      console.error('음력 변환 실패:', error);
      return null;
    }
  };

  // 현재 월에 생일이 있는 날짜 목록 생성
  const birthdayDates = useMemo(() => {
    const dates: Date[] = [];
    const currentYear = getYear(currentMonth);
    const currentMonthNum = getMonth(currentMonth);

    allBirthdays.forEach((member) => {
      if (member.birthdate) {
        if (member.birthdate_type === '음력') {
          // 음력 생일: 음력 11-12월은 다음 해 1-2월에 해당하므로 년도 조정 필요
          const parts = member.birthdate.split('-');
          const lunarMonth = parseInt(parts[1], 10);

          // 음력 11-12월이고 현재 양력 1-3월이면 전년도 음력을 사용
          let yearToUse = currentYear;
          if (lunarMonth >= 11 && currentMonthNum <= 2) {
            yearToUse = currentYear - 1;
          }

          // 조정된 년도로 변환
          let solarDate = convertLunarToSolar(member.birthdate, yearToUse);
          if (solarDate && getMonth(solarDate) === currentMonthNum) {
            dates.push(new Date(currentYear, currentMonthNum, solarDate.getDate()));
            return;
          }

          // 위에서 못 찾았으면 반대 경우도 시도 (음력 1-10월이고 양력 11-12월인 경우)
          if (lunarMonth <= 10 && currentMonthNum >= 10) {
            const nextYearSolar = convertLunarToSolar(member.birthdate, currentYear + 1);
            if (nextYearSolar && getMonth(nextYearSolar) === currentMonthNum) {
              dates.push(new Date(currentYear, currentMonthNum, nextYearSolar.getDate()));
            }
          }
        } else {
          // 양력 생일: 그대로 사용
          const birthDate = new Date(member.birthdate);
          const birthMonth = getMonth(birthDate);
          const birthDay = birthDate.getDate();

          // 현재 보고 있는 월과 생일 월이 같으면 추가
          if (birthMonth === currentMonthNum) {
            dates.push(new Date(currentYear, currentMonthNum, birthDay));
          }
        }
      }
    });

    return dates;
  }, [allBirthdays, currentMonth]);

  // 현재 월에 일정이 있는 날짜 목록 생성
  const eventDates = useMemo(() => {
    const dates: Date[] = [];
    const currentYear = getYear(currentMonth);
    const currentMonthNum = getMonth(currentMonth);

    allDates.forEach((event) => {
      if (event.event_date) {
        const eventDate = new Date(event.event_date);
        const eventYear = getYear(eventDate);
        const eventMonth = getMonth(eventDate);
        const eventDay = eventDate.getDate();

        // 현재 보고 있는 년월과 일정 년월이 같으면 추가
        if (eventYear === currentYear && eventMonth === currentMonthNum) {
          dates.push(new Date(currentYear, currentMonthNum, eventDay));
        }
      }
    });

    return dates;
  }, [allDates, currentMonth]);

  // 특정 날짜의 생일자 목록 가져오기
  const getBirthdayMembersForDate = (date: Date) => {
    const targetYear = getYear(date);
    const month = getMonth(date);
    const day = date.getDate();

    return allBirthdays.filter((member) => {
      if (!member.birthdate) return false;

      if (member.birthdate_type === '음력') {
        // 음력 생일: 음력 11-12월은 다음 해 1-2월에 해당하므로 년도 조정 필요
        const parts = member.birthdate.split('-');
        const lunarMonth = parseInt(parts[1], 10);

        // 음력 11-12월이고 양력 1-3월이면 전년도 음력을 사용
        let yearToUse = targetYear;
        if (lunarMonth >= 11 && month <= 2) {
          yearToUse = targetYear - 1;
        }

        // 조정된 년도로 변환
        let solarDate = convertLunarToSolar(member.birthdate, yearToUse);
        if (solarDate && getMonth(solarDate) === month && solarDate.getDate() === day) {
          return true;
        }

        // 위에서 못 찾았으면 반대 경우도 시도 (음력 1-10월이고 양력 11-12월인 경우)
        if (lunarMonth <= 10 && month >= 10) {
          const nextYearSolar = convertLunarToSolar(member.birthdate, targetYear + 1);
          if (nextYearSolar && getMonth(nextYearSolar) === month && nextYearSolar.getDate() === day) {
            return true;
          }
        }

        return false;
      } else {
        // 양력 생일: 월과 일만 비교
        const birthDate = new Date(member.birthdate);
        return getMonth(birthDate) === month && birthDate.getDate() === day;
      }
    });
  };

  // 특정 날짜의 일정 목록 가져오기
  const getEventsForDate = (date: Date) => {
    const year = getYear(date);
    const month = getMonth(date);
    const day = date.getDate();

    return allDates.filter((event) => {
      if (!event.event_date) return false;
      const eventDate = new Date(event.event_date);
      // 일정은 년월일 모두 비교
      return getYear(eventDate) === year && getMonth(eventDate) === month && eventDate.getDate() === day;
    });
  };

  // 선택된 날짜의 생일자 & 일정 목록
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const selectedBirthdays = selectedDate
    ? getBirthdayMembersForDate(selectedDate)
    : [];
  const selectedEvents = selectedDate
    ? getEventsForDate(selectedDate)
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

  // 현재 월의 생일자 목록
  const currentMonthBirthdays = useMemo(() => {
    const currentYear = getYear(currentMonth);
    const currentMonthNum = getMonth(currentMonth);

    return allBirthdays.filter((member) => {
      if (!member.birthdate) return false;

      if (member.birthdate_type === '음력') {
        // 음력 생일: 음력 11-12월은 다음 해 1-2월에 해당하므로 년도 조정 필요
        const parts = member.birthdate.split('-');
        const lunarMonth = parseInt(parts[1], 10);

        // 음력 11-12월이고 양력 1-3월이면 전년도 음력을 사용
        let yearToUse = currentYear;
        if (lunarMonth >= 11 && currentMonthNum <= 2) {
          yearToUse = currentYear - 1;
        }

        // 조정된 년도로 변환
        const solarDate = convertLunarToSolar(member.birthdate, yearToUse);
        if (solarDate && getMonth(solarDate) === currentMonthNum) {
          return true;
        }

        // 위에서 못 찾았으면 반대 경우도 시도 (음력 1-10월이고 양력 11-12월인 경우)
        if (lunarMonth <= 10 && currentMonthNum >= 10) {
          const nextYearSolar = convertLunarToSolar(member.birthdate, currentYear + 1);
          if (nextYearSolar && getMonth(nextYearSolar) === currentMonthNum) {
            return true;
          }
        }

        return false;
      } else {
        // 양력 생일: 월만 비교
        const birthDate = new Date(member.birthdate);
        return getMonth(birthDate) === currentMonthNum;
      }
    });
  }, [allBirthdays, currentMonth]);

  // 현재 월의 생일자 수
  const currentMonthBirthdayCount = currentMonthBirthdays.length;

  // 교인의 실제 표시 날짜 계산 (음력인 경우 변환된 양력 날짜 반환)
  const getDisplayDate = (member: Member): number => {
    if (!member.birthdate) return 0;

    if (member.birthdate_type === '음력') {
      const currentYear = getYear(currentMonth);
      const currentMonthNum = getMonth(currentMonth);
      const parts = member.birthdate.split('-');
      const lunarMonth = parseInt(parts[1], 10);

      // 음력 11-12월이고 양력 1-3월이면 전년도 음력을 사용
      let yearToUse = currentYear;
      if (lunarMonth >= 11 && currentMonthNum <= 2) {
        yearToUse = currentYear - 1;
      }

      // 조정된 년도로 변환
      let solarDate = convertLunarToSolar(member.birthdate, yearToUse);
      if (solarDate && getMonth(solarDate) === currentMonthNum) {
        return solarDate.getDate();
      }

      // 위에서 못 찾았으면 반대 경우도 시도 (음력 1-10월이고 양력 11-12월인 경우)
      if (lunarMonth <= 10 && currentMonthNum >= 10) {
        const nextYearSolar = convertLunarToSolar(member.birthdate, currentYear + 1);
        if (nextYearSolar && getMonth(nextYearSolar) === currentMonthNum) {
          return nextYearSolar.getDate();
        }
      }

      return 0;
    } else {
      return new Date(member.birthdate).getDate();
    }
  };

  // 날짜가 있는 일정 (현재 월)
  const datedEvents = useMemo(() => {
    const currentMonthNum = getMonth(currentMonth);
    const currentYear = getYear(currentMonth);

    return allDates
      .filter((event) => {
        if (!event.event_date || event.is_completed) return false;
        const eventDate = new Date(event.event_date);
        return getMonth(eventDate) === currentMonthNum && getYear(eventDate) === currentYear;
      })
      .sort((a, b) => {
        const dateA = new Date(a.event_date!);
        const dateB = new Date(b.event_date!);
        return dateA.getDate() - dateB.getDate();
      });
  }, [allDates, currentMonth]);

  // 날짜가 없는 일정 (할일)
  const undatedTodos = useMemo(() => {
    return allDates.filter((event) => !event.event_date && !event.is_completed);
  }, [allDates]);

  // 일정 완료/미완료 토글
  const handleToggleComplete = async (event: ImportantDate, e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지

    try {
      const newStatus = !event.is_completed;

      // 낙관적 업데이트
      setAllDates(prev => prev.map(d =>
        d.id === event.id ? { ...d, is_completed: newStatus } : d
      ));

      await supabaseApiService.importantDates.toggleComplete(event.id, newStatus);

      toast({
        title: newStatus ? '완료 처리' : '미완료로 변경',
        description: newStatus ? '일정이 완료되었습니다' : '일정이 미완료로 변경되었습니다',
      });
    } catch (error) {
      console.error('일정 상태 변경 실패:', error);
      // 롤백
      setAllDates(prev => prev.map(d =>
        d.id === event.id ? event : d
      ));
      toast({
        title: '상태 변경 실패',
        description: '일정 상태 변경에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

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
                  event: eventDates,
                  holiday: holidayDates,
                }}
                modifiersClassNames={{
                  birthday: 'has-birthday',
                  event: 'has-event',
                  holiday: 'has-holiday',
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

                  {/* 생일자 섹션 */}
                  <div className="border-t border-border pt-6">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Cake className="h-4 w-4" />
                      생일자
                    </h4>
                    {selectedBirthdays.length > 0 ? (
                      <div className="space-y-3 mb-6">
                        {selectedBirthdays.map((member) => (
                          <div
                            key={member.id}
                            className="cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors"
                            onClick={() => onMemberClick?.(member)}
                          >
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.name}</p>
                              {member.birthdate_type && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                  {member.birthdate_type}
                                </span>
                              )}
                            </div>
                            {member.department && (
                              <p className="text-xs text-muted-foreground">{member.department}</p>
                            )}
                            {member.phone && (
                              <p className="text-xs text-muted-foreground">{member.phone}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-6">생일자가 없습니다</p>
                    )}

                    {/* 일정 섹션 */}
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 border-t border-border pt-6">
                      <Calendar className="h-4 w-4" />
                      일정
                    </h4>
                    {selectedEvents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedEvents.map((event) => (
                          <div
                            key={event.id}
                            className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={(e) => handleToggleComplete(event, e)}
                          >
                            <div className="flex items-start gap-2">
                              {event.is_completed ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <p className={`font-medium ${event.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {event.title}
                                </p>
                                {event.members && (
                                  <p className="text-xs text-muted-foreground">{event.members.name}</p>
                                )}
                                {event.notes && (
                                  <p className="text-xs text-muted-foreground mt-1">{event.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">일정이 없습니다</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2 space-y-6">
                    {/* 생일자 섹션 */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Cake className="h-4 w-4" />
                        생일자 ({currentMonthBirthdayCount}명)
                      </h4>
                      {currentMonthBirthdayCount > 0 ? (
                        <div className="space-y-2">
                          {currentMonthBirthdays
                            .sort((a, b) => {
                              return getDisplayDate(a) - getDisplayDate(b);
                            })
                            .map((member) => (
                              <div
                                key={member.id}
                                className="cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors flex items-center justify-between"
                                onClick={() => onMemberClick?.(member)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-10 h-10 bg-red-500/10 rounded-full">
                                    <span className="text-sm font-bold text-red-600">
                                      {getDisplayDate(member)}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">{member.name}</p>
                                      {member.birthdate_type && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                          {member.birthdate_type}
                                        </span>
                                      )}
                                    </div>
                                    {member.department && (
                                      <p className="text-xs text-muted-foreground">
                                        {member.department}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">생일자가 없습니다</p>
                      )}
                    </div>

                    {/* 일정 섹션 */}
                    <div className="border-t border-border pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          일정 ({datedEvents.length}건)
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/important-dates')}
                          className="text-xs"
                        >
                          더보기
                        </Button>
                      </div>
                      {datedEvents.length > 0 ? (
                        <div className="space-y-2">
                          {datedEvents.map((event) => (
                            <div
                              key={event.id}
                              className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={(e) => handleToggleComplete(event, e)}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-full flex-shrink-0">
                                  <span className="text-sm font-bold text-blue-600">
                                    {new Date(event.event_date!).getDate()}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{event.title}</p>
                                  {event.members && (
                                    <p className="text-xs text-muted-foreground">{event.members.name}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">일정이 없습니다</p>
                      )}
                    </div>

                    {/* 할일 섹션 (날짜 미정) */}
                    <div className="border-t border-border pt-6">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Circle className="h-4 w-4" />
                        할일 ({undatedTodos.length}건)
                      </h4>
                      {undatedTodos.length > 0 ? (
                        <div className="space-y-2">
                          {undatedTodos.map((todo) => (
                            <div
                              key={todo.id}
                              className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={(e) => handleToggleComplete(todo, e)}
                            >
                              <div className="flex items-start gap-2">
                                <Circle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{todo.title}</p>
                                  {todo.members && (
                                    <p className="text-xs text-muted-foreground">{todo.members.name}</p>
                                  )}
                                  {todo.notes && (
                                    <p className="text-xs text-muted-foreground mt-1">{todo.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">할일이 없습니다</p>
                      )}
                    </div>

                    {/* 공휴일 섹션 */}
                    <div className="border-t border-border pt-6">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Flag className="h-4 w-4 text-red-600" />
                        공휴일 ({currentMonthHolidays.length}건)
                      </h4>
                      {currentMonthHolidays.length > 0 ? (
                        <div className="space-y-2">
                          {currentMonthHolidays
                            .sort((a, b) => new Date(a.date).getDate() - new Date(b.date).getDate())
                            .map((holiday, index) => (
                              <div
                                key={index}
                                className="p-3 rounded-lg bg-red-500/5 border border-red-200"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center w-10 h-10 bg-red-500/10 rounded-full flex-shrink-0">
                                    <span className="text-sm font-bold text-red-600">
                                      {new Date(holiday.date).getDate()}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm text-red-700">{holiday.name}</p>
                                    {holiday.isLunar && (
                                      <p className="text-xs text-red-600">음력</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">공휴일이 없습니다</p>
                      )}
                    </div>
                  </div>
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
          font-size: 1rem;
          font-weight: 500;
          color: hsl(var(--foreground));
          padding: 0.75rem 0;
          width: 4.5rem;
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
          width: 4.5rem;
          height: 4.5rem;
          padding: 0;
        }

        .birthday-calendar-wrapper .rdp-day_button {
          width: 4.5rem;
          height: 4.5rem;
          border-radius: 50%;
          font-size: 1.125rem;
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

        /* 생일 배지 - 기본 (가운데) */
        .birthday-calendar-wrapper .has-birthday .rdp-day_button {
          position: relative;
        }

        .birthday-calendar-wrapper .has-birthday .rdp-day_button::after {
          content: '';
          position: absolute;
          bottom: 0.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: 0.4rem;
          height: 0.4rem;
          background-color: #ef4444;
          border-radius: 50%;
        }

        /* 생일과 일정이 둘 다 있을 때 - 생일 배지 왼쪽으로 */
        .birthday-calendar-wrapper .has-birthday.has-event .rdp-day_button::after {
          left: 50%;
          transform: translateX(-0.5rem);
        }

        /* 일정 배지 - 기본 (가운데) */
        .birthday-calendar-wrapper .has-event .rdp-day_button {
          position: relative;
        }

        .birthday-calendar-wrapper .has-event .rdp-day_button::before {
          content: '';
          position: absolute;
          bottom: 0.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: 0.4rem;
          height: 0.4rem;
          background-color: #3b82f6;
          border-radius: 50%;
        }

        /* 생일과 일정이 둘 다 있을 때 - 일정 배지 오른쪽으로 */
        .birthday-calendar-wrapper .has-birthday.has-event .rdp-day_button::before {
          left: 50%;
          transform: translateX(0.5rem);
        }

        /* 공휴일 - 날짜 텍스트 색상 빨간색 (일요일과 동일) */
        .birthday-calendar-wrapper .has-holiday .rdp-day_button {
          color: #ef4444 !important;
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
