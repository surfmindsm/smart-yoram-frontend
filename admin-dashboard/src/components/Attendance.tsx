import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, CardContent } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Badge } from "./ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { PageContainer, PageHeader } from "./ui";

interface Member {
  id: number;
  name: string;
  position: string;
  department: string;
}

interface AttendanceRecord {
  id: number;
  member_id: number;
  service_date: string;
  service_type: string;
  present: boolean;
  check_in_time?: string;
  notes?: string;
}

// Date 객체를 로컬 타임존의 YYYY-MM-DD 문자열로 변환 (타임존 버그 방지)
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 해당 월의 모든 주일(일요일) 날짜를 반환하는 함수
const getSundaysInMonth = (year: number, month: number): Date[] => {
  const sundays: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let currentDate = new Date(firstDay);
  while (currentDate <= lastDay) {
    if (currentDate.getDay() === 0) {
      sundays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return sundays;
};

const Attendance: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [churchId, setChurchId] = useState<number>(1);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 주별 출석 현황용 상태
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [weeklyAttendances, setWeeklyAttendances] = useState<AttendanceRecord[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [updatingWeekly, setUpdatingWeekly] = useState<string | null>(null); // "memberId_date" 형식

  // 년도 옵션 (현재 년도 기준 ±2년)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  // 초기화 완료 플래그 및 캐시
  const initializedRef = useRef(false);
  const membersLoadedRef = useRef(false);
  const tokenCacheRef = useRef<string | null>(null);
  const loadingWeeklyRef = useRef(false);
  const attendanceCacheRef = useRef<Map<string, AttendanceRecord[]>>(new Map());

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
    if (membersLoadedRef.current) {
      console.log('>>> Members already loaded, skipping');
      return;
    }

    console.log('>>> loadMembers 시작 (Supabase Edge Function)');
    try {
      const token = await getToken();

      if (!token) {
        console.error('>>> No auth token');
        setMembers([]);
        return;
      }

      console.log('>>> Using token:', token.substring(0, 20) + '...');

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
        const errorText = await response.text();
        console.error('>>> Members API error:', response.status, errorText);
        setMembers([]);
        return;
      }

      const result = await response.json();
      const memberList = result.data || [];
      console.log('>>> Members loaded:', memberList.length);
      setMembers(memberList);
      membersLoadedRef.current = true;
    } catch (error: any) {
      console.error('>>> Failed to load members:', error);
      setMembers([]);
    }
  }, [getToken]);

  const loadWeeklyAttendances = useCallback(async () => {
    // 이미 로딩 중이면 중복 호출 방지
    if (loadingWeeklyRef.current) {
      console.log('>>> Already loading attendances, skipping');
      return;
    }

    const cacheKey = `${selectedYear}-${selectedMonth}`;

    // 캐시에 있으면 캐시 사용
    if (attendanceCacheRef.current.has(cacheKey)) {
      console.log('>>> Using cached attendances for', cacheKey);
      setWeeklyAttendances(attendanceCacheRef.current.get(cacheKey) || []);
      return;
    }

    try {
      loadingWeeklyRef.current = true;
      setLoadingWeekly(true);
      const sundays = getSundaysInMonth(selectedYear, selectedMonth);
      console.log('>>> Sundays in', selectedYear, selectedMonth + 1, ':', sundays.length);

      if (sundays.length === 0) {
        console.log('>>> No sundays in this month');
        setWeeklyAttendances([]);
        attendanceCacheRef.current.set(cacheKey, []);
        return;
      }

      const token = await getToken();

      if (!token) {
        console.error('>>> No auth token');
        setWeeklyAttendances([]);
        return;
      }

      // 첫 주일과 마지막 주일 사이의 모든 출석 데이터 조회
      const firstSunday = formatLocalDate(sundays[0]);
      const lastSunday = formatLocalDate(sundays[sundays.length - 1]);

      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/attendances?start_date=${firstSunday}&end_date=${lastSunday}${churchId ? `&church_id=${churchId}` : ''}`,
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
        const errorText = await response.text();
        console.error('>>> Weekly attendances API error:', response.status, errorText);
        setWeeklyAttendances([]);
        return;
      }

      const data = await response.json();
      console.log('>>> Weekly attendance results:', data.length || 0);
      setWeeklyAttendances(data || []);

      // 캐시에 저장
      attendanceCacheRef.current.set(cacheKey, data || []);
    } catch (error) {
      console.error('>>> Failed to load weekly attendances:', error);
      setWeeklyAttendances([]);
    } finally {
      loadingWeeklyRef.current = false;
      setLoadingWeekly(false);
    }
  }, [selectedYear, selectedMonth, getToken]);

  // 초기화: 한 번만 실행
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      console.log('=== Attendance Component Init (Supabase) ===');

      try {
        const user = await supabaseAuthService.getCurrentUser();
        console.log('>>> Current user:', user);
        setCurrentUser(user?.user || null);
        if (user?.user?.church_id) {
          setChurchId(user.user.church_id);
        }
      } catch (error: any) {
        console.error('>>> Failed to get current user:', error);
      }

      // 교인 목록과 출석 데이터를 병렬로 로드
      await Promise.all([loadMembers(), loadWeeklyAttendances()]);

      console.log('✅ 초기화 완료');
    };

    init();
  }, [loadMembers, loadWeeklyAttendances]);

  // 년도/월 변경 시 출석 데이터만 다시 로드
  useEffect(() => {
    if (!initializedRef.current) return; // 초기화 완료 후에만 실행
    loadWeeklyAttendances();
  }, [selectedYear, selectedMonth, loadWeeklyAttendances]);

  const handleToggleAttendance = async (memberId: number, sunday: Date) => {
    const dateStr = formatLocalDate(sunday);
    const updateKey = `${memberId}_${dateStr}`;

    if (updatingWeekly) return;

    setUpdatingWeekly(updateKey);
    const existingAttendance = weeklyAttendances.find(
      a => a.member_id === memberId && a.service_date === dateStr
    );

    try {
      const token = await getToken();

      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const headers = {
        'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
        'X-Custom-Auth': token,
        'Content-Type': 'application/json',
      };

      let updatedAttendances = [...weeklyAttendances];

      if (existingAttendance) {
        if (existingAttendance.present) {
          // 출석 삭제
          const response = await fetch(
            `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/attendances?id=${existingAttendance.id}`,
            {
              method: 'DELETE',
              headers,
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || '출석 삭제 실패');
          }

          updatedAttendances = weeklyAttendances.filter(a => a.id !== existingAttendance.id);
        } else {
          // 출석 업데이트
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
        // 새로 출석 생성
        const response = await fetch(
          `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/attendances`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              member_id: memberId,
              church_id: churchId,
              service_date: dateStr,
              service_type: 'sunday_morning',
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

      // 상태 업데이트 및 캐시 업데이트
      setWeeklyAttendances(updatedAttendances);
      const cacheKey = `${selectedYear}-${selectedMonth}`;
      attendanceCacheRef.current.set(cacheKey, updatedAttendances);
    } catch (error: any) {
      console.error('Failed to update attendance:', error);
      alert(error.message || '출석 체크 중 오류가 발생했습니다.');
      // 캐시 무효화 후 재로딩
      const cacheKey = `${selectedYear}-${selectedMonth}`;
      attendanceCacheRef.current.delete(cacheKey);
      await loadWeeklyAttendances();
    } finally {
      setUpdatingWeekly(null);
    }
  };

  const getMemberAttendanceRate = (memberId: number, sundays: Date[]) => {
    const attendedCount = sundays.filter(sunday => {
      const dateStr = formatLocalDate(sunday);
      const attendance = weeklyAttendances.find(
        a => a.member_id === memberId && a.service_date === dateStr && a.present
      );
      return !!attendance;
    }).length;

    return sundays.length > 0 ? Math.round((attendedCount / sundays.length) * 100) : 0;
  };

  const isAttended = (memberId: number, sunday: Date) => {
    const dateStr = formatLocalDate(sunday);
    const attendance = weeklyAttendances.find(
      a => a.member_id === memberId && a.service_date === dateStr
    );
    return attendance?.present || false;
  };

  const sundays = getSundaysInMonth(selectedYear, selectedMonth);

  return (
    <PageContainer>
      <PageHeader
        title="출석 관리"
      />

      {/* 월별 출석 현황 */}
      <div>
          <Card className="border-muted mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 sm:flex-none">
                  <label className="block text-sm font-medium text-foreground mb-2">년도</label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-full sm:w-40">
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
                </div>
                <div className="flex-1 sm:flex-none">
                  <label className="block text-sm font-medium text-foreground mb-2">월</label>
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger className="w-full sm:w-40">
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
                <div className="flex-1">
                  <Card className="border-muted bg-primary/5">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">조회 기간</p>
                      <p className="text-lg font-bold text-primary">
                        {selectedYear}년 {selectedMonth + 1}월 ({sundays.length}주차)
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {loadingWeekly ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : sundays.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">해당 월에 주일이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32 sticky left-0 bg-background z-10 border-r">교인명</TableHead>
                        {sundays.map((sunday, index) => (
                          <TableHead key={index} className="text-center min-w-28">
                            {sunday.getMonth() + 1}/{sunday.getDate()}
                            <br />
                            <span className="text-xs text-muted-foreground">(주일)</span>
                          </TableHead>
                        ))}
                        <TableHead className="text-center w-24 sticky right-0 bg-background z-10 border-l">출석률</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => {
                        const attendanceRate = getMemberAttendanceRate(member.id, sundays);
                        return (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">
                              {member.name}
                            </TableCell>
                            {sundays.map((sunday, index) => {
                              const dateStr = formatLocalDate(sunday);
                              const updateKey = `${member.id}_${dateStr}`;
                              const attended = isAttended(member.id, sunday);
                              const isUpdating = updatingWeekly === updateKey;

                              return (
                                <TableCell
                                  key={index}
                                  className={cn(
                                    "text-center cursor-pointer transition-colors relative",
                                    attended ? "bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50" : "hover:bg-gray-50 dark:hover:bg-gray-800",
                                    isUpdating && "opacity-50"
                                  )}
                                  onClick={() => !isUpdating && handleToggleAttendance(member.id, sunday)}
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                  ) : attended ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-gray-300 dark:text-gray-600 mx-auto" />
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center sticky right-0 bg-background z-10 border-l">
                              <Badge
                                variant={attendanceRate >= 80 ? "success" : attendanceRate >= 50 ? "warning" : "secondary"}
                                className="font-semibold"
                              >
                                {attendanceRate}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Total Count Display */}
          {members.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                전체 {members.length.toLocaleString()}명
              </div>
            </div>
          )}
      </div>
    </PageContainer>
  );
};

export default Attendance;
