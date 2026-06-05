import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { supabaseApiService } from '../services/supabaseApiService';
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
  const [members, setMembers] = useState<Member[]>([]);
  const [churchId, setChurchId] = useState<number>(1);
  const [, setCurrentUser] = useState<any>(null);

  // 예배 목록
  const [worshipServices, setWorshipServices] = useState<WorshipService[]>([]);
  const [selectedWorshipServiceId, setSelectedWorshipServiceId] = useState<number | null>(null);
  const [worshipServicesLoaded, setWorshipServicesLoaded] = useState(false);

  // 주별 출석 현황용 상태
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [weeklyAttendances, setWeeklyAttendances] = useState<AttendanceRecord[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [updatingWeekly, setUpdatingWeekly] = useState<string | null>(null);

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

  const loadMembers = useCallback(async () => {
    if (membersLoadedRef.current) return;

    try {
      const token = await getToken();
      if (!token) {
        setMembers([]);
        return;
      }

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

      if (!response.ok) {
        setMembers([]);
        return;
      }

      const result = await response.json();
      const memberList = result.data || [];
      setMembers(memberList);
      membersLoadedRef.current = true;
    } catch (error: any) {
      console.error('Failed to load members:', error);
      setMembers([]);
    }
  }, [getToken]);

  const loadWorshipServices = useCallback(async (cid: number) => {
    try {
      const result = await supabaseApiService.worshipServices.getAll({
        church_id: cid,
        is_active: true,
        limit: 100,
      });
      const list: WorshipService[] = (result?.data || result || []) as WorshipService[];
      setWorshipServices(list);
      if (list.length > 0) {
        setSelectedWorshipServiceId((prev) => prev ?? list[0].id);
      }
    } catch (error) {
      console.error('Failed to load worship services:', error);
      setWorshipServices([]);
    } finally {
      setWorshipServicesLoaded(true);
    }
  }, []);

  const loadWeeklyAttendances = useCallback(async () => {
    if (loadingWeeklyRef.current) return;
    if (!selectedWorshipServiceId) {
      setWeeklyAttendances([]);
      return;
    }
    if (serviceDates.length === 0) {
      setWeeklyAttendances([]);
      return;
    }

    const cacheKey = `${selectedYear}-${selectedMonth}-${selectedWorshipServiceId}`;

    if (attendanceCacheRef.current.has(cacheKey)) {
      setWeeklyAttendances(attendanceCacheRef.current.get(cacheKey) || []);
      return;
    }

    try {
      loadingWeeklyRef.current = true;
      setLoadingWeekly(true);

      const token = await getToken();
      if (!token) {
        setWeeklyAttendances([]);
        return;
      }

      const firstDate = formatLocalDate(serviceDates[0]);
      const lastDate = formatLocalDate(serviceDates[serviceDates.length - 1]);

      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/attendances?start_date=${firstDate}&end_date=${lastDate}&worship_service_id=${selectedWorshipServiceId}${churchId ? `&church_id=${churchId}` : ''}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
            'X-Custom-Auth': token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        setWeeklyAttendances([]);
        return;
      }

      const data = await response.json();
      setWeeklyAttendances(data || []);
      attendanceCacheRef.current.set(cacheKey, data || []);
    } catch (error) {
      console.error('Failed to load weekly attendances:', error);
      setWeeklyAttendances([]);
    } finally {
      loadingWeeklyRef.current = false;
      setLoadingWeekly(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth, churchId, selectedWorshipServiceId, serviceDates.length, getToken]);

  // 초기화: 한 번만 실행
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      let cid = churchId;
      try {
        const user = await supabaseAuthService.getCurrentUser();
        setCurrentUser(user?.user || null);
        if (user?.user?.church_id) {
          cid = user.user.church_id;
          setChurchId(cid);
        }
      } catch (error: any) {
        console.error('Failed to get current user:', error);
      }

      await Promise.all([loadMembers(), loadWorshipServices(cid)]);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 예배·년도·월 변경 시 출석 데이터 재로드
  useEffect(() => {
    if (!initializedRef.current) return;
    loadWeeklyAttendances();
  }, [selectedYear, selectedMonth, selectedWorshipServiceId, loadWeeklyAttendances]);

  const handleToggleAttendance = async (memberId: number, serviceDate: Date) => {
    if (!selectedWorshipServiceId) return;
    const dateStr = formatLocalDate(serviceDate);
    const updateKey = `${memberId}_${dateStr}`;

    if (updatingWeekly) return;

    setUpdatingWeekly(updateKey);
    const existingAttendance = weeklyAttendances.find(
      a => a.member_id === memberId && a.service_date === dateStr && a.worship_service_id === selectedWorshipServiceId
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
        updatedAttendances = [...weeklyAttendances, data];
      }

      setWeeklyAttendances(updatedAttendances);
      const cacheKey = `${selectedYear}-${selectedMonth}-${selectedWorshipServiceId}`;
      attendanceCacheRef.current.set(cacheKey, updatedAttendances);
    } catch (error: any) {
      console.error('Failed to update attendance:', error);
      alert(error.message || '출석 체크 중 오류가 발생했습니다.');
      const cacheKey = `${selectedYear}-${selectedMonth}-${selectedWorshipServiceId}`;
      attendanceCacheRef.current.delete(cacheKey);
      await loadWeeklyAttendances();
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
          && a.worship_service_id === selectedWorshipServiceId
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
        && a.worship_service_id === selectedWorshipServiceId
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
              <thead className="bg-[#FAFBFD]">
                <tr>
                  <th
                    className="sticky left-0 z-10 w-[160px] cursor-pointer bg-[#FAFBFD] px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] transition-colors hover:text-foreground"
                    onClick={() => handleSort('name')}
                  >
                    <span className="flex items-center gap-1">교인명 <SortIcon field="name" /></span>
                  </th>
                  <th
                    className="sticky left-[160px] z-10 w-[160px] cursor-pointer bg-[#FAFBFD] px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] transition-colors hover:text-foreground"
                    onClick={() => handleSort('organization')}
                  >
                    <span className="flex items-center gap-1">조직 <SortIcon field="organization" /></span>
                  </th>
                  <th
                    className="sticky left-[320px] z-10 w-[120px] cursor-pointer bg-[#FAFBFD] px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] transition-colors hover:text-foreground"
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
                    className="sticky right-0 z-10 w-[100px] cursor-pointer bg-[#FAFBFD] px-[18px] py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] transition-colors hover:text-foreground"
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
                    <tr key={member.id} className="transition-colors hover:bg-[#FAFBFD]">
                      <td className="sticky left-0 z-10 w-[160px] bg-card px-[18px] py-3 font-semibold text-foreground">
                        {member.name}
                      </td>
                      <td className="sticky left-[160px] z-10 w-[160px] truncate bg-card px-[18px] py-3 text-foreground">
                        {member.organization_name || <span className="text-[#CBD5E1]">-</span>}
                      </td>
                      <td className="sticky left-[320px] z-10 w-[120px] truncate bg-card px-[18px] py-3 text-foreground">
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
                              attended ? "bg-[#E7F6EC]/40 hover:bg-[#E7F6EC]" : "hover:bg-[#FAFBFD]",
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
