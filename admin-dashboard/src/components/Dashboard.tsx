import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState([
    { title: '전체 교인', value: '0', icon: '👥', color: 'bg-blue-500' },
    { title: '오늘 출석', value: '0', icon: '✅', color: 'bg-green-500' },
    { title: '이번 주 새가족', value: '0', icon: '🆕', color: 'bg-purple-500' },
    { title: '활성 사용자', value: '0', icon: '👤', color: 'bg-yellow-500' },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch members count
      const membersResponse = await api.get('/members/');
      const totalMembers = membersResponse.data.length;
      
      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attendanceResponse = await api.get(`/attendances/?start_date=${today}&end_date=${today}`);
      const todayAttendance = attendanceResponse.data.filter((a: any) => a.is_present).length;

      // Update stats
      setStats([
        { title: '전체 교인', value: totalMembers.toString(), icon: '👥', color: 'bg-blue-500' },
        { title: '오늘 출석', value: todayAttendance.toString(), icon: '✅', color: 'bg-green-500' },
        { title: '이번 주 새가족', value: '0', icon: '🆕', color: 'bg-purple-500' },
        { title: '활성 사용자', value: '1', icon: '👤', color: 'bg-yellow-500' },
      ]);
    } catch (error) {
      console.error('대시보드 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: '교인 등록',
      description: '새로운 교인을 등록합니다',
      icon: '👤',
      link: '/member-management',
      color: 'bg-blue-500'
    },
    {
      title: 'SMS 발송',
      description: '교인들에게 단체 메시지를 발송합니다',
      icon: '💬',
      link: '/sms',
      color: 'bg-green-500'
    },
    {
      title: 'QR 코드 생성',
      description: '출석체크용 QR 코드를 생성합니다',
      icon: '📱',
      link: '/qr-codes',
      color: 'bg-purple-500'
    },
    {
      title: '통계 조회',
      description: '출석 및 교인 통계를 확인합니다',
      icon: '📊',
      link: '/statistics',
      color: 'bg-yellow-500'
    },
    {
      title: '엑셀 관리',
      description: '교인 명단을 업로드/다운로드합니다',
      icon: '📋',
      link: '/excel',
      color: 'bg-indigo-500'
    },
    {
      title: '출석 관리',
      description: '출석 기록을 관리합니다',
      icon: '✅',
      link: '/attendance',
      color: 'bg-red-500'
    }
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} bg-opacity-10 rounded-lg p-3`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">빠른 작업</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 p-6 block"
            >
              <div className="flex items-center">
                <div className={`${action.color} bg-opacity-10 rounded-lg p-3`}>
                  <span className="text-2xl">{action.icon}</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-gray-900">{action.title}</h4>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">최근 활동</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600">✓</span>
              </div>
              <span>새로운 기능들이 추가되었습니다!</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600">📱</span>
              </div>
              <span>QR 코드 출석 체크 시스템이 활성화되었습니다.</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600">💬</span>
              </div>
              <span>SMS 발송 기능을 사용할 수 있습니다.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;