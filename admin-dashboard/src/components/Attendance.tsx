import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMembers, useWorshipServices, useCurrentUser } from '../hooks/queries';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { Loader2, Check, X, ChevronUp, ChevronDown, CalendarX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Card, LoadingState } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Badge } from "./ui";
import { Button } from "./ui";
import { PageContainer } from "./ui";
import { usePageSubtitle } from '../hooks/usePageSubtitle';
import { getPositionMainLabel } from '../constants/memberPositions';

interface Member {
  id: number;
  name: string;
  position?: string;
  position_main?: string | null;
  department?: string;
  organization_name?: string | null;
}

interface WorshipService {
  id: number;
  name: string;
  day_of_week: number | null; // 0=월 ... 6=일 (worship_services 정의)
  start_time: string | null;  // "HH:MM:SS"
  service_type: string | null;
  is_active: boolean | null;
}

const DAY_LABEL_FROM_WORSHIP: Record<number, string> = {
  0: '월', 1: '화', 2: '수', 3: '목', 4: '금', 5: '토', 6: '일',
};

// "HH:MM:SS" → "오전 H:MM" / "오후 H:MM" (값이 없으면 null)
const formatStartTime = (t: string | null): string | null => {
  if (!t) return null;
  const [hh, mm] = t.split(':');
  const h = parseInt(hh, 10);
  if (isNaN(h)) return null;
  const minute = mm || '00';
  if (h === 0) return `오전 12:${minute}`;
  if (h < 12) return `오전 ${h}:${minute}`;
  if (h === 12) return `오후 12:${minute}`;
  return `오후 ${h - 12}:${minute}`;
};

type SortField = 'name' | 'organization' | 'position' | 'rate';
type SortOrder = 'asc' | 'desc';

interface AttendanceRecord {
  id: number;
  member_id: number;
  service_date: string;
  service_type: string;
  worship_service_id?: number | null;
  present: boolean;
  check_in_time?: string;
  notes?: string;
}

// worship_services.day_of_week (0=월 ... 6=일) → JavaScript Date.getDay() (0=일 ... 6=토)
const worshipDayToJsDay = (day: number): number => (day === 6 ? 0 : day + 1);

// Date 객체를 로컬 타임존의 YYYY-MM-DD 문자열로 변환 (타임존 버그 방지)
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 해당 월의 특정 요일(JS getDay 기준) 날짜를 반환하는 함수
const getDatesByDayOfMonth = (year: number, month: number, jsDayOfWeek: number): Date[] => {
  const result: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const currentDate = new Date(firstDay);
  while (currentDate <= lastDay) {
    if (currentDate.getDay() === jsDayOfWeek) {
      result.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
};

const Attendance: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 공유 데이터는 React Query로 — 화면 간 캐싱
  const { data: currentUser } = useCurrentUser();
  const churchId = currentUser?.church_id ?? null;
  const { data: membersData } = useMembers();
  const members: Member[] = (membersData as Member[] | undefined) ?? [];
  const { data: worshipServicesData, isFetched: worshipServicesLoaded } = useWorshipServices(churchId);
  const worshipServices: WorshipService[] = (worshipServicesData as WorshipService[] | undefined) ?? [];

  const [selectedWorshipServiceId, setSelectedWorshipServiceId] = useState<number | null>(null);

  // 주별 출석 현황용 상태
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [weeklyAttendances, setWeeklyAttendances] = useState<AttendanceRecord[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [updatingWeekly, setUpdatingWeekly] = useState<string | null>(null);

  // 이번 달 전체 출석(통계 카드용 — 모든 worship_service 포함)
  const [monthAttendances, setMonthAttendances] = useState<AttendanceRecord[]>([]);

  // 정렬 상태
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // 년도 옵션 (현재 년도 기준 ±2년)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // 초기화 완료 플래그 및 캐시
  const initializedRef = useRef(false);
  const membersLoadedRef = useRef(false);
  const tokenCacheRef = useRef<string | null>(null);
  const loadingWeeklyRef = useRef(false);
  const attendanceCacheRef = useRef<Map<string, AttendanceRecord[]>>(new Map());

  // 선택된 예배
  const selectedWorshipService = useMemo(
    () => worshipServices.find(w => w.id === selectedWorshipServiceId) || null,
    [worshipServices, selectedWorshipServiceId]
  );

  // 선택된 예배의 요일에 해당하는 해당 월의 날짜들
  const serviceDates = useMemo(() => {
    if (!selectedWorshipService || selectedWorshipService.day_of_week === null) return [];
    const jsDay = worshipDayToJsDay(selectedWorshipService.day_of_week);
    return getDatesByDayOfMonth(selectedYear, selectedMonth, jsDay);
  }, [selectedWorshipService, selectedYear, selectedMonth]);

  // 상단바 부제: 조회 기간 + 예배
  usePageSubtitle(
    selectedWorshipService
      ? `${selectedYear}년 ${selectedMonth + 1}월 · ${selectedWorshipService.name}`
      : `${selectedYear}년 ${selectedMonth + 1}월`
  );

  // 토큰 가져오기 헬퍼 (캐싱)
  const getToken = useCallback(async () => {
    if (tokenCacheRef.current) {
      return tokenCacheRef.current;
    }

    let token = await supabaseAuthService.getToken();
    if (!token) {
      token = localStorage.getItem('access_token');
    }

    if (token) {
      tokenCacheRef.current = token;
    }

    return token;
  }, []);

  // members는 React Query로 대체됨 (useMembers). 이 함수는 더 이상 사용되지 않음.
  const _unusedLoadMembers = useCallback(async () => {
    if (membersLoadedRef.current) return;
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/members?limit=1000`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) return;
      await response.json();
      membersLoadedRef.current = true;
    } catch (error: any) {
      console.error('Failed to load members:', error);
    }
  }, [getToken]);

  // 이번 달 전체 예배에 대한 출석 데이터 — React Query 캐시
  const monthAttendancesQuery = useQuery({
    queryKey: ['monthAttendances', churchId ?? null, selectedYear, selectedMonth],
    queryFn: async () => {
      if (!churchId) return [];
      const token = await getToken();
      if (!token) return [];
      const first = formatLocalDate(new Date(selectedYear, selectedMonth, 1));
      const last = formatLocalDate(new Date(selectedYear, selectedMonth + 1, 0));
      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/attendances?start_date=${first}&end_date=${last}&church_id=${churchId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) return [];
      return (await response.json()) || [];
    },
    enabled: !!churchId,
    staleTime: 60_000,
  });

  // monthAttendances Query → state 동기화
  useEffect(() => {
    if (monthAttendancesQuery.data !== undefined) {
      setMonthAttendances(monthAttendancesQuery.data);
    }
  }, [monthAttendancesQuery.data]);

  const loadMonthAttendances = useCallback(() => {
    monthAttendancesQuery.refetch();
  }, [monthAttendancesQuery]);

  // worshipServices가 React Query로 도착하면 selectedWorshipServiceId 초기화
  useEffect(() => {
    if (worshipServices.length > 0) {
      setSelectedWorshipServiceId(prev => prev ?? worshipServices[0].id);
    }
  }, [worshipServices]);

  // 주간 출석 — React Query 캐시
  const firstServiceDate = serviceDates[0] ? formatLocalDate(serviceDates[0]) : null;
  const lastServiceDate = serviceDates[serviceDates.length - 1] ? formatLocalDate(serviceDates[serviceDates.length - 1]) : null;

  const weeklyAttendancesQuery = useQuery({
    queryKey: ['weeklyAttendances', churchId ?? null, selectedYear, selectedMonth, selectedWorshipServiceId ?? null, firstServiceDate, lastServiceDate],
    queryFn: async () => {
      if (!churchId) return [];
      if (!selectedWorshipServiceId) return [];
      if (!firstServiceDate || !lastServiceDate) return [];

      const token = await getToken();
      if (!token) return [];

      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/attendances?start_date=${firstServiceDate}&end_date=${lastServiceDate}&worship_service_id=${selectedWorshipServiceId}&church_id=${churchId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) return [];
      return (await response.json()) || [];
    },
    enabled: !!churchId && !!selectedWorshipServiceId && !!firstServiceDate && !!lastServiceDate,
    staleTime: 60_000,
  });

  // weeklyAttendances Query → state 동기화
  useEffect(() => {
    if (weeklyAttendancesQuery.data !== undefined) {
      setWeeklyAttendances(weeklyAttendancesQuery.data);
    }
  }, [weeklyAttendancesQuery.data]);

  // loadingWeekly 동기화
  useEffect(() => {
    setLoadingWeekly(weeklyAttendancesQuery.isLoading);
  }, [weeklyAttendancesQuery.isLoading]);

  const loadWeeklyAttendances = useCallback(() => {
    weeklyAttendancesQuery.refetch();
  }, [weeklyAttendancesQuery]);

  // 초기화: 한 번만 실행
  // members / worshipServices / currentUser는 React Query가 자동으로 로드
  // initializedRef는 별도 useEffect에서 데이터 도착 후 초기화로 사용
  useEffect(() => {
    if (initializedRef.current) return;
    if (currentUser && worshipServices.length > 0) {
      initializedRef.current = true;
    }
  }, [currentUser, worshipServices.length]);

  // 예배·년도·월·church_id 변경 시 출석 데이터 재로드
  useEffect(() => {
    if (!initializedRef.current) return;
    if (!churchId) return;
    loadWeeklyAttendances();
  }, [selectedYear, selectedMonth, selectedWorshipServiceId, churchId, loadWeeklyAttendances]);

  // 년/월·church_id 변경 시 통계용 월 전체 출석도 재로드
  useEffect(() => {
    if (!initializedRef.current) return;
    if (!churchId) return;
    loadMonthAttendances();
  }, [selectedYear, selectedMonth, churchId, loadMonthAttendances]);

  const handleToggleAttendance = async (memberId: number, serviceDate: Date) => {
    if (!selectedWorshipServiceId) return;
    const dateStr = formatLocalDate(serviceDate);
    const updateKey = `${memberId}_${dateStr}`;

    if (updatingWeekly) return;

    setUpdatingWeekly(updateKey);
    const existingAttendance = weeklyAttendances.find(
      a => a.member_id === memberId && a.service_date === dateStr && Number(a.worship_service_id) === selectedWorshipServiceId
    );

    try {
      const token = await getToken();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      const headers = {
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
        'X-Custom-Auth': token,
        'Content-Type': 'application/json',
      };

      let updatedAttendances = [...weeklyAttendances];

      if (existingAttendance) {
        if (existingAttendance.present) {
          const response = await fetch(
            `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/attendances?id=${existingAttendance.id}`,
            { method: 'DELETE', headers }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || '출석 삭제 실패');
          }

          updatedAttendances = weeklyAttendances.filter(a => a.id !== existingAttendance.id);
        } else {
          const response = await fetch(
            `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/attendances`,
            {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                id: existingAttendance.id,
                present: true,
                check_in_time: new Date().toISOString()
              })
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || '출석 업데이트 실패');
          }

          const data = await response.json();
          updatedAttendances = weeklyAttendances.map(a =>
            a.id === existingAttendance.id ? data : a
          );
        }
      } else {
        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/attendances`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              member_id: memberId,
              church_id: churchId,
              service_date: dateStr,
              service_type: selectedWorshipService?.service_type || selectedWorshipService?.name || 'sunday_morning',
              worship_service_id: selectedWorshipServiceId,
              present: true,
              check_in_method: 'manual',
              check_in_time: new Date().toISOString()
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || '출석 생성 실패');
        }

        const data = await response.json();
        // 응답에 worship_service_id가 빠지거나 string으로 와도 일관되게 number로 보정
        const normalized = {
          ...data,
          worship_service_id:
            data.worship_service_id !== undefined && data.worship_service_id !== null
              ? Number(data.worship_service_id)
              : selectedWorshipServiceId,
        };
        updatedAttendances = [...weeklyAttendances, normalized];
      }

      setWeeklyAttendances(updatedAttendances);
      const cacheKey = `${selectedYear}-${selectedMonth}-${selectedWorshipServiceId}`;
      attendanceCacheRef.current.set(cacheKey, updatedAttendances);
      // React Query 캐시도 업데이트
      queryClient.setQueryData(
        ['weeklyAttendances', churchId ?? null, selectedYear, selectedMonth, selectedWorshipServiceId ?? null, firstServiceDate, lastServiceDate],
        updatedAttendances
      );
      // 통계 카드 갱신
      queryClient.invalidateQueries({ queryKey: ['monthAttendances'] });
    } catch (error: any) {
      console.error('Failed to update attendance:', error);
      alert(error.message || '출석 체크 중 오류가 발생했습니다.');
      const cacheKey = `${selectedYear}-${selectedMonth}-${selectedWorshipServiceId}`;
      attendanceCacheRef.current.delete(cacheKey);
      queryClient.invalidateQueries({ queryKey: ['weeklyAttendances'] });
    } finally {
      setUpdatingWeekly(null);
    }
  };

  const getMemberAttendanceRate = (memberId: number, dates: Date[]) => {
    if (!selectedWorshipServiceId) return 0;
    const attendedCount = dates.filter(date => {
      const dateStr = formatLocalDate(date);
      const attendance = weeklyAttendances.find(
        a => a.member_id === memberId
          && a.service_date === dateStr
          && Number(a.worship_service_id) === selectedWorshipServiceId
          && a.present
      );
      return !!attendance;
    }).length;

    return dates.length > 0 ? Math.round((attendedCount / dates.length) * 100) : 0;
  };

  const isAttended = (memberId: number, date: Date) => {
    if (!selectedWorshipServiceId) return false;
    const dateStr = formatLocalDate(date);
    const attendance = weeklyAttendances.find(
      a => a.member_id === memberId
        && a.service_date === dateStr
        && Number(a.worship_service_id) === selectedWorshipServiceId
    );
    return attendance?.present || false;
  };

  // 정렬된 멤버 목록
  const sortedMembers = useMemo(() => {
    const arr = [...members];
    const koLocale = 'ko-KR';
    arr.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortField === 'name') {
        av = a.name || '';
        bv = b.name || '';
      } else if (sortField === 'organization') {
        av = a.organization_name || '';
        bv = b.organization_name || '';
      } else if (sortField === 'position') {
        av = getPositionMainLabel(a.position_main || '') || '';
        bv = getPositionMainLabel(b.position_main || '') || '';
      } else if (sortField === 'rate') {
        av = getMemberAttendanceRate(a.id, serviceDates);
        bv = getMemberAttendanceRate(b.id, serviceDates);
      }
      let cmp = 0;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv), koLocale);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, sortField, sortOrder, weeklyAttendances, serviceDates.length]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5" />
    );
  };

  // 예배별 통계 (이번 달 평균 출석률 + 출석 인원/전체)
  const worshipStats = useMemo(() => {
    const totalMembers = members.length || 0;
    return worshipServices.map(w => {
      const dates = w.day_of_week !== null && w.day_of_week !== undefined
        ? getDatesByDayOfMonth(selectedYear, selectedMonth, worshipDayToJsDay(w.day_of_week))
        : [];
      const dateCount = dates.length;
      const presentRows = monthAttendances.filter(
        a => Number(a.worship_service_id) === w.id && a.present
      );
      const presentCount = presentRows.length;
      const possible = dateCount * totalMembers;
      const rate = possible > 0 ? Math.round((presentCount / possible) * 100) : 0;
      const uniqueMembers = new Set(presentRows.map(r => r.member_id)).size;
      return {
        service: w,
        dateCount,
        presentCount,
        uniqueMembers,
        rate,
      };
    });
  }, [worshipServices, monthAttendances, members.length, selectedYear, selectedMonth]);

  // 예배가 한 건도 없으면 가이드만 표시
  if (worshipServicesLoaded && worshipServices.length === 0) {
    return (
      <PageContainer>
        <Card>
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#EEF3FC] text-primary">
              <CalendarX className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-[15px] font-bold text-foreground">등록된 예배가 없습니다</p>
              <p className="text-[13px] text-muted-foreground">예배 시간 관리에서 예배를 먼저 등록해 주세요.</p>
            </div>
            <Button onClick={() => navigate('/worship-schedule')} size="sm">
              예배 시간 관리로 이동
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* === 예배별 통계 카드 그리드 — 이번 달 평균 출석률 === */}
      {worshipStats.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {worshipStats.map(({ service, dateCount, presentCount, uniqueMembers, rate }) => {
            const isActive = service.id === selectedWorshipServiceId;
            const dayLabel = service.day_of_week !== null && service.day_of_week !== undefined
              ? `${DAY_LABEL_FROM_WORSHIP[service.day_of_week]}요일`
              : null;
            const timeLabel = formatStartTime(service.start_time);
            const meta = [dayLabel, timeLabel].filter(Boolean).join(' · ');
            const rateColor = rate >= 80 ? 'text-[#16A34A]' : rate >= 50 ? 'text-[#B45309]' : 'text-foreground';
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => setSelectedWorshipServiceId(service.id)}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-[10px] border bg-card px-4 py-3 text-left transition-colors',
                  isActive
                    ? 'border-primary shadow-[0_0_0_3px_rgba(28,124,255,0.12)]'
                    : 'border-border hover:border-[#CBD5E1] hover:bg-[#F8FAFD]'
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="truncate text-[13px] font-bold text-foreground">{service.name}</div>
                  <div className={cn('text-[20px] font-bold tabular-nums', rateColor)}>{rate}%</div>
                </div>
                {meta && (
                  <div className="text-[11px] font-medium text-[#94A3B8]">{meta}</div>
                )}
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>출석 <b className="font-semibold text-foreground tabular-nums">{presentCount}</b></span>
                  <span className="text-[#CBD5E1]">·</span>
                  <span>인원 <b className="font-semibold text-foreground tabular-nums">{uniqueMembers}</b></span>
                  <span className="text-[#CBD5E1]">·</span>
                  <span>회 <b className="font-semibold text-foreground tabular-nums">{dateCount}</b></span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* === 필터 + 테이블을 한 카드로 통합 — 시안 매핑 === */}
      <Card className="overflow-hidden">
        {/* 필터 바 */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF1F6] px-[16px] py-[14px]">
          <Select
            value={selectedWorshipServiceId ? selectedWorshipServiceId.toString() : ''}
            onValueChange={(value) => setSelectedWorshipServiceId(parseInt(value))}
          >
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="예배 선택" />
            </SelectTrigger>
            <SelectContent>
              {worshipServices.map(w => {
                const dayLabel = w.day_of_week !== null && w.day_of_week !== undefined
                  ? `${DAY_LABEL_FROM_WORSHIP[w.day_of_week]}요일`
                  : null;
                const timeLabel = formatStartTime(w.start_time);
                const meta = [dayLabel, timeLabel].filter(Boolean).join(' · ');
                return (
                  <SelectItem key={w.id} value={w.id.toString()}>
                    <span className="inline-flex items-center gap-2">
                      <span>{w.name}</span>
                      {meta && (
                        <span className="text-[11px] font-medium text-[#94A3B8]">{meta}</span>
                      )}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {i + 1}월
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          {serviceDates.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-muted-foreground">
              해당 월에 {selectedWorshipService?.name || '예배'} 일정이 없습니다.
            </div>
          ) : (
            <table className="w-full min-w-[920px] text-[12.5px]">
              <thead className="bg-[#F8FAFD]">
                <tr>
                  <th
                    className="sticky left-0 z-10 w-[160px] cursor-pointer bg-[#F8FAFD] px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] transition-colors hover:text-foreground"
                    onClick={() => handleSort('name')}
                  >
                    <span className="flex items-center gap-1">교인명 <SortIcon field="name" /></span>
                  </th>
                  <th
                    className="sticky left-[160px] z-10 w-[160px] cursor-pointer bg-[#F8FAFD] px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] transition-colors hover:text-foreground"
                    onClick={() => handleSort('organization')}
                  >
                    <span className="flex items-center gap-1">조직 <SortIcon field="organization" /></span>
                  </th>
                  <th
                    className="sticky left-[320px] z-10 w-[120px] cursor-pointer bg-[#F8FAFD] px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] transition-colors hover:text-foreground"
                    onClick={() => handleSort('position')}
                  >
                    <span className="flex items-center gap-1">직분 <SortIcon field="position" /></span>
                  </th>
                  {serviceDates.map((date, index) => (
                    <th
                      key={index}
                      className="min-w-[120px] px-[16px] py-3 text-center text-[12px] font-bold tracking-[0.02em] text-[#94A3B8]"
                    >
                      <div className="text-[13px] text-foreground">{date.getMonth() + 1}/{date.getDate()}</div>
                      <div className="mt-0.5 text-[11px] font-medium text-[#94A3B8]">{['일','월','화','수','목','금','토'][date.getDay()]}요일</div>
                    </th>
                  ))}
                  <th
                    className="sticky right-0 z-10 w-[100px] cursor-pointer bg-[#F8FAFD] px-[18px] py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] transition-colors hover:text-foreground"
                    onClick={() => handleSort('rate')}
                  >
                    <span className="flex items-center justify-end gap-1">출석률 <SortIcon field="rate" /></span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F9] bg-card">
                {loadingWeekly && (
                  <tr>
                    <td colSpan={serviceDates.length + 4} className="px-[18px] py-12">
                      <LoadingState text="출석 데이터를 불러오는 중..." />
                    </td>
                  </tr>
                )}
                {!loadingWeekly && sortedMembers.map((member) => {
                  const attendanceRate = getMemberAttendanceRate(member.id, serviceDates);
                  return (
                    <tr key={member.id} className="transition-colors hover:bg-[#F8FAFD]">
                      <td className="sticky left-0 z-10 w-[160px] bg-card px-[18px] py-3 text-[13px] font-semibold text-foreground">
                        {member.name}
                      </td>
                      <td className="sticky left-[160px] z-10 w-[160px] truncate bg-card px-[18px] py-3 text-[13px] text-foreground">
                        {member.organization_name || <span className="text-[#CBD5E1]">-</span>}
                      </td>
                      <td className="sticky left-[320px] z-10 w-[120px] truncate bg-card px-[18px] py-3 text-[13px] text-foreground">
                        {member.position_main
                          ? getPositionMainLabel(member.position_main)
                          : <span className="text-[#CBD5E1]">-</span>}
                      </td>
                      {serviceDates.map((date, index) => {
                        const dateStr = formatLocalDate(date);
                        const updateKey = `${member.id}_${dateStr}`;
                        const attended = isAttended(member.id, date);
                        const isUpdating = updatingWeekly === updateKey;

                        return (
                          <td
                            key={index}
                            className={cn(
                              "cursor-pointer px-[16px] py-3 text-center align-middle transition-colors",
                              attended ? "bg-[#E7F6EC]/40 hover:bg-[#E7F6EC]" : "hover:bg-[#F8FAFD]",
                              isUpdating && "opacity-50"
                            )}
                            onClick={() => !isUpdating && handleToggleAttendance(member.id, date)}
                          >
                            <span
                              className={cn(
                                "mx-auto flex h-[36px] w-[36px] items-center justify-center rounded-full transition-colors",
                                attended
                                  ? "bg-[#16A34A] text-white"
                                  : "border border-[#E2E8F0] bg-[#F8FAFC] text-[#CBD5E1] hover:border-[#CBD5E1] hover:text-[#94A3B8]"
                              )}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : attended ? (
                                <Check className="h-[20px] w-[20px]" strokeWidth={3} />
                              ) : (
                                <X className="h-[18px] w-[18px]" strokeWidth={2.5} />
                              )}
                            </span>
                          </td>
                        );
                      })}
                      <td className="sticky right-0 z-10 bg-card px-[18px] py-3 text-right">
                        <Badge
                          variant={attendanceRate >= 80 ? "success" : attendanceRate >= 50 ? "warning" : "secondary"}
                        >
                          {attendanceRate}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </PageContainer>
  );
};

export default Attendance;
