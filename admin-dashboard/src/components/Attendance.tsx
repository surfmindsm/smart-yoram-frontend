import React, { useState, useEffect } from 'react';
import { attendanceService, memberService } from '../services/api';

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

const Attendance: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedService, setSelectedService] = useState('sunday_morning');
  const [loading, setLoading] = useState(false);
  const [churchId, setChurchId] = useState(1); // TODO: Get from user context

  const serviceTypes = [
    { value: 'sunday_morning', label: '주일 오전예배' },
    { value: 'sunday_evening', label: '주일 오후예배' },
    { value: 'wednesday', label: '수요예배' },
    { value: 'friday', label: '금요기도회' },
    { value: 'dawn', label: '새벽기도' },
  ];

  useEffect(() => {
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
      setAttendances(data);
    } catch (error) {
      console.error('Failed to load attendances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = async (member: Member) => {
    const existingAttendance = attendances.find(a => a.member_id === member.id);
    
    try {
      if (existingAttendance) {
        // Update existing attendance
        await attendanceService.updateAttendance(existingAttendance.id, {
          present: !existingAttendance.present
        });
      } else {
        // Create new attendance
        await attendanceService.createAttendance({
          member_id: member.id,
          church_id: churchId,
          service_date: selectedDate,
          service_type: selectedService,
          present: true,
          check_in_method: 'manual'
        });
      }
      loadAttendances();
    } catch (error) {
      console.error('Failed to update attendance:', error);
    }
  };

  const isPresent = (memberId: number) => {
    const attendance = attendances.find(a => a.member_id === memberId);
    return attendance ? attendance.present : false;
  };

  const getAttendanceStats = () => {
    const present = attendances.filter(a => a.present).length;
    const total = members.length;
    const percentage = total > 0 ? (present / total * 100).toFixed(1) : 0;
    return { present, total, percentage };
  };

  const stats = getAttendanceStats();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">출석 관리</h2>
      
      {/* Date and Service Selection */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
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
          <div className="flex items-end">
            <div className="bg-indigo-50 px-4 py-2 rounded-md w-full">
              <p className="text-sm text-gray-600">출석률</p>
              <p className="text-xl font-bold text-indigo-600">
                {stats.present}/{stats.total} ({stats.percentage}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all ${
                isPresent(member.id)
                  ? 'ring-2 ring-green-500 bg-green-50'
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleToggleAttendance(member)}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-2xl text-gray-600">👤</span>
                </div>
                <h3 className="font-medium text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.position}</p>
                {isPresent(member.id) && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-500 text-white rounded-full">
                    출석
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Attendance;