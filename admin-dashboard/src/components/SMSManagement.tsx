import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Member {
  id: number;
  name: string;
  phone_number: string;
  position: string | null;
  district: string | null;
}

interface SMSHistory {
  id: number;
  recipient_phone: string;
  recipient_member_id: number | null;
  message: string;
  sms_type: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
}

interface SMSTemplate {
  id: number;
  name: string;
  message: string;
}

const SMSManagement: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [smsType, setSmsType] = useState('general');
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [smsHistory, setSmsHistory] = useState<SMSHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');

  useEffect(() => {
    fetchMembers();
    fetchTemplates();
    if (activeTab === 'history') {
      fetchSMSHistory();
    }
  }, [activeTab]);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members/?member_status=active');
      setMembers(response.data);
    } catch (error) {
      console.error('교인 목록 조회 실패:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/sms/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('SMS 템플릿 조회 실패:', error);
    }
  };

  const fetchSMSHistory = async () => {
    try {
      const response = await api.get('/sms/history?limit=50');
      setSmsHistory(response.data);
    } catch (error) {
      console.error('SMS 발송 기록 조회 실패:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map(m => m.id));
    }
  };

  const handleMemberToggle = (memberId: number) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleTemplateSelect = (template: SMSTemplate) => {
    setMessage(template.message);
  };

  const handleSendSMS = async () => {
    if (selectedMembers.length === 0) {
      alert('발송할 교인을 선택해주세요.');
      return;
    }

    if (!message.trim()) {
      alert('메시지를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/sms/send-bulk', {
        recipient_member_ids: selectedMembers,
        message: message,
        sms_type: smsType
      });

      alert(`${response.data.length}명에게 SMS를 발송했습니다.`);
      setSelectedMembers([]);
      setMessage('');
      
      // Refresh history if on history tab
      if (activeTab === 'history') {
        fetchSMSHistory();
      }
    } catch (error) {
      console.error('SMS 발송 실패:', error);
      alert('SMS 발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return '발송완료';
      case 'failed': return '발송실패';
      case 'pending': return '발송대기';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">SMS 관리</h2>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('send')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'send'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            SMS 발송
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            발송 기록
          </button>
        </nav>
      </div>

      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Member Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                교인 선택 ({selectedMembers.length}/{members.length})
              </h3>
              <button
                onClick={handleSelectAll}
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                {selectedMembers.length === members.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center p-3 border-b border-gray-100 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={() => handleMemberToggle(member.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.phone_number}</p>
                      </div>
                      <div className="text-right">
                        {member.position && (
                          <p className="text-xs text-gray-500">{member.position}</p>
                        )}
                        {member.district && (
                          <p className="text-xs text-gray-500">{member.district}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Composition */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">메시지 작성</h3>

            {/* Templates */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">템플릿 선택</label>
              <select
                onChange={(e) => {
                  const template = templates.find(t => t.id === parseInt(e.target.value));
                  if (template) handleTemplateSelect(template);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">직접 작성</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Message Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">메시지 유형</label>
              <select
                value={smsType}
                onChange={(e) => setSmsType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="general">일반</option>
                <option value="invitation">초대</option>
                <option value="notice">공지</option>
                <option value="emergency">긴급</option>
              </select>
            </div>

            {/* Message Text */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메시지 내용 ({message.length}/1000자)
              </label>
              <textarea
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="발송할 메시지를 입력하세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                maxLength={1000}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendSMS}
              disabled={loading || selectedMembers.length === 0 || !message.trim()}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  발송 중...
                </>
              ) : (
                `${selectedMembers.length}명에게 SMS 발송`
              )}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">발송 기록</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    발송일시
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수신자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    메시지
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {smsHistory.map((sms) => (
                  <tr key={sms.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(sms.created_at).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sms.recipient_phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {sms.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sms.sms_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(sms.status)}`}>
                        {getStatusText(sms.status)}
                      </span>
                      {sms.error_message && (
                        <p className="text-xs text-red-600 mt-1">{sms.error_message}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {smsHistory.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">발송 기록이 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SMSManagement;