import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Pin, Eye, EyeOff } from 'lucide-react';
import { announcementService } from '../services/api';

interface Announcement {
  id: number;
  title: string;
  content: string;
  author_name: string;
  is_active: boolean;
  is_pinned: boolean;
  target_audience: string;
  created_at: string;
  updated_at: string | null;
}

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'pinned'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_audience: 'all',
    is_pinned: false,
    is_active: true,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, filter]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementService.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setError('공지사항을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = [...announcements];
    
    switch (filter) {
      case 'active':
        filtered = announcements.filter(a => a.is_active);
        break;
      case 'pinned':
        filtered = announcements.filter(a => a.is_pinned);
        break;
    }
    
    setFilteredAnnouncements(filtered);
  };

  const handleCreate = () => {
    setSelectedAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      target_audience: 'all',
      is_pinned: false,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      target_audience: announcement.target_audience,
      is_pinned: announcement.is_pinned,
      is_active: announcement.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await announcementService.deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      alert('공지사항 삭제에 실패했습니다.');
    }
  };

  const handleTogglePin = async (id: number) => {
    try {
      await announcementService.togglePin(id);
      fetchAnnouncements();
    } catch (err) {
      alert('고정 상태 변경에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedAnnouncement) {
        await announcementService.updateAnnouncement(selectedAnnouncement.id, formData);
      } else {
        await announcementService.createAnnouncement(formData);
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (err) {
      alert('공지사항 저장에 실패했습니다.');
    }
  };

  const getTargetAudienceText = (audience: string) => {
    const map: { [key: string]: string } = {
      'all': '전체',
      'member': '일반 교인',
      'youth': '청소년부',
      'leader': '리더',
    };
    return map[audience] || audience;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center">{error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">공지사항 관리</h2>
        <button
          onClick={handleCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          새 공지사항
        </button>
      </div>

      {/* Filter Buttons */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md ${
            filter === 'all' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-md ${
            filter === 'active' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          활성
        </button>
        <button
          onClick={() => setFilter('pinned')}
          className={`px-4 py-2 rounded-md ${
            filter === 'pinned' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          고정
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <div 
            key={announcement.id} 
            className={`bg-white p-4 rounded-lg shadow border-l-4 ${
              announcement.is_pinned ? 'border-yellow-400' : 'border-indigo-400'
            } ${!announcement.is_active ? 'opacity-60' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {announcement.is_pinned && (
                    <Pin className="w-4 h-4 text-yellow-600" />
                  )}
                  <h3 className="text-lg font-semibold">{announcement.title}</h3>
                  {!announcement.is_active && (
                    <span className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded">비활성</span>
                  )}
                </div>
                <p className="text-gray-700 whitespace-pre-wrap mb-2">{announcement.content}</p>
                <div className="text-sm text-gray-500">
                  <span>작성자: {announcement.author_name}</span>
                  <span className="mx-2">|</span>
                  <span>작성일: {new Date(announcement.created_at).toLocaleDateString('ko-KR')}</span>
                  <span className="mx-2">|</span>
                  <span>대상: {getTargetAudienceText(announcement.target_audience)}</span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(announcement)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                  title="수정"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleTogglePin(announcement.id)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                  title={announcement.is_pinned ? '고정 해제' : '고정'}
                >
                  <Pin className={`w-4 h-4 ${announcement.is_pinned ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAnnouncements.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          공지사항이 없습니다.
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {selectedAnnouncement ? '공지사항 수정' : '새 공지사항'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={8}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    대상
                  </label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">전체</option>
                    <option value="member">일반 교인</option>
                    <option value="youth">청소년부</option>
                    <option value="leader">리더</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_pinned}
                      onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">상단 고정</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">활성화</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;