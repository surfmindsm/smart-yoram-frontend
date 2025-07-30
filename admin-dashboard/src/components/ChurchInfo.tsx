import React, { useState, useEffect } from 'react';
import { churchService } from '../services/api';

interface Church {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  pastor_name?: string;
  subscription_status: string;
  subscription_end_date?: string;
  member_limit: number;
  is_active: boolean;
}

const ChurchInfo: React.FC = () => {
  const [church, setChurch] = useState<Church | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    pastor_name: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadChurchInfo();
  }, []);

  const loadChurchInfo = async () => {
    try {
      setLoading(true);
      const data = await churchService.getMyChurch();
      setChurch(data);
      setFormData({
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        pastor_name: data.pastor_name || ''
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || '교회 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!church) return;

    try {
      const updated = await churchService.updateChurch(church.id, formData);
      setChurch(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || '저장 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    if (church) {
      setFormData({
        name: church.name || '',
        address: church.address || '',
        phone: church.phone || '',
        email: church.email || '',
        pastor_name: church.pastor_name || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (error && !church) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">교회 정보</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            수정
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">교회명</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">담임목사</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.pastor_name}
                  onChange={(e) => setFormData({ ...formData, pastor_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">주소</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                저장
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">교회명</h3>
              <p className="mt-1 text-lg text-gray-900">{church?.name || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">담임목사</h3>
              <p className="mt-1 text-lg text-gray-900">{church?.pastor_name || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">전화번호</h3>
              <p className="mt-1 text-lg text-gray-900">{church?.phone || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">이메일</h3>
              <p className="mt-1 text-lg text-gray-900">{church?.email || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500">주소</h3>
              <p className="mt-1 text-lg text-gray-900">{church?.address || '-'}</p>
            </div>
          </div>
        )}

        {/* Subscription Info */}
        {church && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">구독 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">구독 상태</h4>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    church.subscription_status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : church.subscription_status === 'trial'
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {church.subscription_status === 'active' ? '활성' : 
                     church.subscription_status === 'trial' ? '체험판' : '만료'}
                  </span>
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">만료일</h4>
                <p className="mt-1 text-gray-900">
                  {church.subscription_end_date 
                    ? new Date(church.subscription_end_date).toLocaleDateString('ko-KR')
                    : '-'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">교인 수 제한</h4>
                <p className="mt-1 text-gray-900">{church.member_limit}명</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChurchInfo;