import React, { useState, useEffect, memo } from 'react';
import { attendanceService, memberService, authService } from '../services/api';
import { Calendar, Users, User, Check, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

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

interface MemberCardProps {
  member: Member;
  attendance?: AttendanceRecord;
  isUpdating: boolean;
  onToggle: (member: Member) => void;
}

const MemberCard = memo(({ member, attendance, isUpdating, onToggle }: MemberCardProps) => {
  const isChecked = attendance?.present || false;
  
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all relative",
        isChecked
          ? 'ring-2 ring-green-500 bg-green-50 border-green-200'
          : 'hover:shadow-md hover:bg-muted/50 border-muted',
        isUpdating && 'opacity-50 cursor-wait'
      )}
      onClick={() => !isUpdating && onToggle(member)}
    >
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/75 rounded-lg z-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <CardContent className="p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-2 flex items-center justify-center relative">
            <User className="h-8 w-8 text-muted-foreground" />
            {isChecked && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          <h3 className="font-medium text-foreground">{member.name}</h3>
          <p className="text-sm text-muted-foreground">{member.position || '교인'}</p>
          <div className="mt-2">
            {isChecked ? (
              <Badge variant="success" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                출석
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                결석
              </Badge>
            )}
          </div>
          {attendance?.check_in_time && (
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(attendance.check_in_time).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

const Attendance: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedService, setSelectedService] = useState('sunday_morning');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [churchId, setChurchId] = useState<number>(1);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const serviceTypes = [
    { value: 'sunday_morning', label: '주일 오전예배' },
    { value: 'sunday_evening', label: '주일 오후예배' },
    { value: 'wednesday', label: '수요예배' },
    { value: 'friday', label: '금요기도회' },
    { value: 'dawn', label: '새벽기도' },
  ];

  useEffect(() => {
    const init = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        if (user.church_id) {
          setChurchId(user.church_id);
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
      }
    };
    init();
    loadMembers();
  }, []);

  useEffect(() => {
    loadAttendances();
  }, [selectedDate, selectedService]);

  const loadMembers = async () => {
    try {
      const data = await memberService.getMembers();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const loadAttendances = async () => {
    try {
      setLoading(true);
      const data = await attendanceService.getAttendances({
        service_date: selectedDate,
        service_type: selectedService,
      });
      // Ensure we only set valid attendance records
      setAttendances(Array.isArray(data) ? data.filter(Boolean) : []);
    } catch (error) {
      console.error('Failed to load attendances:', error);
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = async (member: Member) => {
    if (updating) return; // Prevent multiple simultaneous updates
    
    setUpdating(member.id);
    const existingAttendance = attendances.find(a => a.member_id === member.id);
    
    try {
      if (existingAttendance) {
        if (existingAttendance.present) {
          // Delete attendance (mark as absent)
          await attendanceService.deleteAttendance(existingAttendance.id);
          // Update local state immediately
          setAttendances(attendances.filter(a => a.id !== existingAttendance.id));
        } else {
          // Update existing attendance to present
          const updatedAttendance = await attendanceService.updateAttendance(existingAttendance.id, {
            present: true,
            check_in_time: new Date().toISOString()
          });
          // Update local state immediately
          setAttendances(attendances.map(a => 
            a.id === existingAttendance.id 
              ? { ...a, present: true, check_in_time: new Date().toISOString() }
              : a
          ));
        }
      } else {
        // Create new attendance
        const newAttendance = await attendanceService.createAttendance({
          member_id: member.id,
          church_id: churchId,
          service_date: selectedDate,
          service_type: selectedService,
          present: true,
          check_in_method: 'manual',
          check_in_time: new Date().toISOString()
        });
        // Add to local state immediately
        setAttendances([...attendances, {
          id: Date.now(), // Temporary ID
          member_id: member.id,
          service_date: selectedDate,
          service_type: selectedService,
          present: true,
          check_in_time: new Date().toISOString()
        }]);
      }
    } catch (error: any) {
      console.error('Failed to update attendance:', error);
      alert(error.response?.data?.detail || '출석 체크 중 오류가 발생했습니다.');
      // On error, reload to sync with server
      await loadAttendances();
    } finally {
      setUpdating(null);
    }
  };

  const isPresent = (memberId: number) => {
    const attendance = attendances.find(a => a.member_id === memberId);
    return attendance ? attendance.present : false;
  };

  const getAttendanceStats = () => {
    const present = attendances.filter(a => a && a.present).length;
    const total = members.length;
    const percentage = total > 0 ? (present / total * 100).toFixed(1) : 0;
    return { present, total, percentage };
  };

  const stats = getAttendanceStats();

  const handleMarkAllPresent = async () => {
    if (updating || !window.confirm('모든 교인을 출석으로 표시하시겠습니까?')) return;
    
    setUpdating(-1); // Use -1 to indicate bulk update
    try {
      const checkInTime = new Date().toISOString();
      const newAttendances: AttendanceRecord[] = [];
      const updatedAttendances: AttendanceRecord[] = [];
      
      // Prepare attendance data for members without attendance
      const attendancesToCreate = members
        .filter(member => !attendances.find(a => a.member_id === member.id && a.present))
        .map(member => ({
          member_id: member.id,
          church_id: churchId,
          service_date: selectedDate,
          service_type: selectedService,
          present: true,
          check_in_method: 'manual',
          check_in_time: checkInTime
        }));

      if (attendancesToCreate.length > 0) {
        await attendanceService.createBulkAttendance(attendancesToCreate);
        // Create temporary attendance records for local state
        attendancesToCreate.forEach((data, index) => {
          newAttendances.push({
            id: Date.now() + index, // Temporary ID
            member_id: data.member_id,
            service_date: data.service_date,
            service_type: data.service_type,
            present: true,
            check_in_time: data.check_in_time
          });
        });
      }

      // Update existing absents to present
      const absentsToUpdate = attendances.filter(a => !a.present);
      const updatePromises = absentsToUpdate.map(a => 
        attendanceService.updateAttendance(a.id, { 
          present: true,
          check_in_time: checkInTime
        })
      );
      
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        absentsToUpdate.forEach(a => {
          updatedAttendances.push({ ...a, present: true, check_in_time: checkInTime });
        });
      }

      // Update local state - filter out any undefined values
      const existingPresents = attendances.filter(a => a && a.present && !absentsToUpdate.find(u => u.id === a.id));
      setAttendances([
        ...existingPresents, // Keep existing presents
        ...updatedAttendances, // Add updated ones
        ...newAttendances // Add new ones
      ].filter(Boolean)); // Remove any undefined/null values
    } catch (error: any) {
      console.error('Failed to mark all present:', error);
      alert('전체 출석 처리 중 오류가 발생했습니다.');
      // On error, reload to sync with server
      await loadAttendances();
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-foreground mb-6">출석 관리</h2>
      
      {/* Date and Service Selection */}
      <Card className="border-muted mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                날짜
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">예배</label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Card className="border-muted flex-1">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    출석률
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {stats.present}/{stats.total} ({stats.percentage}%)
                  </p>
                </CardContent>
              </Card>
              <Button
                onClick={handleMarkAllPresent}
                disabled={updating !== null}
                variant="default"
                className="whitespace-nowrap"
              >
                {updating === -1 ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                전체 출석
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Grid */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              attendance={attendances.find(a => a.member_id === member.id)}
              isUpdating={updating === member.id}
              onToggle={handleToggleAttendance}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Attendance;