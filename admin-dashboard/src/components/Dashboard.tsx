import React from 'react';

const Dashboard: React.FC = () => {
  const stats = [
    { title: '전체 교인', value: '0', icon: '👥', color: 'bg-blue-500' },
    { title: '오늘 출석', value: '0', icon: '✅', color: 'bg-green-500' },
    { title: '이번 주 새가족', value: '0', icon: '🆕', color: 'bg-purple-500' },
    { title: '활성 사용자', value: '0', icon: '👤', color: 'bg-yellow-500' },
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

      {/* Recent Activities */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">최근 활동</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-500 text-center py-8">최근 활동이 없습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;