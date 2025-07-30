import React, { useState, useEffect, memo } from 'react';
import { attendanceService, memberService, authService } from '../services/api';
import { Calendar, Users, User, Check, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

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
    <div
      className={cn(
        "bg-white rounded-lg shadow p-4 cursor-pointer transition-all relative",
        isChecked
          ? 'ring-2 ring-green-500 bg-green-50'
          : 'hover:shadow-md hover:bg-gray-50',
        isUpdating && 'opacity-50 cursor-wait'
      )}
      onClick={() => !isUpdating && onToggle(member)}
    >
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      )}
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center relative">
          <User className="h-8 w-8 text-gray-600" />
          {isChecked && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
        <h3 className="font-medium text-gray-900">{member.name}</h3>
        <p className="text-sm text-gray-500">{member.position || '교인'}</p>
        <div className="mt-2">
          {isChecked ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded-full">
              <CheckCircle2 className="h-3 w-3" />
              출석
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
              <XCircle className="h-3 w-3" />
              결석
            </span>
          )}
        </div>
        {attendance?.check_in_time && (
          <p className="text-xs text-gray-400 mt-1">
            {new Date(attendance.check_in_time).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}
      </div>
    </div>
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">출석 관리</h2>
      
      {/* Date and Service Selection */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              날짜
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">예배</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              {serviceTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <div className="bg-indigo-50 px-4 py-2 rounded-md flex-1">
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Users className="w-4 h-4" />
                출석률
              </p>
              <p className="text-xl font-bold text-indigo-600">
                {stats.present}/{stats.total} ({stats.percentage}%)
              </p>
            </div>
            <button
              onClick={handleMarkAllPresent}
              disabled={updating !== null}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1 whitespace-nowrap",
                updating !== null
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              )}
            >
              {updating === -1 ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>전체 출석</span>
            </button>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">로딩 중...</p>
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