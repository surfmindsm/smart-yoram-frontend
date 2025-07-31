import React, { useState, useEffect } from 'react';
import { bulletinService, api } from '../services/api';

interface Bulletin {
  id: number;
  title: string;
  date: string;
  content?: string;
  file_url?: string;
  created_at: string;
}

const Bulletins: React.FC = () => {
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBulletin, setEditingBulletin] = useState<Bulletin | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    content: '',
    file_url: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [churchId] = useState(1); // TODO: Get from user context

  useEffect(() => {
    loadBulletins();
  }, []);

  const loadBulletins = async () => {
    try {
      const data = await bulletinService.getBulletins();
      setBulletins(data);
    } catch (error) {
      console.error('Failed to load bulletins:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!formData.date) {
      alert('날짜를 선택해주세요.');
      return;
    }
    
    try {
      let bulletinId: number;
      
      if (editingBulletin) {
        await bulletinService.updateBulletin(editingBulletin.id, formData);
        bulletinId = editingBulletin.id;
      } else {
        const newBulletin = await bulletinService.createBulletin({ ...formData, church_id: churchId });
        bulletinId = newBulletin.id;
      }
      
      // Upload file if selected
      if (selectedFile && bulletinId) {
        setUploadingFile(true);
        const fileFormData = new FormData();
        fileFormData.append('file', selectedFile);
        
        try {
          await api.post(`/bulletins/${bulletinId}/upload-file`, fileFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (uploadError: any) {
          console.error('Failed to upload file:', uploadError);
          const errorMessage = uploadError.response?.data?.detail || '파일 업로드에 실패했습니다.';
          alert(`파일 업로드 실패: ${errorMessage}`);
        } finally {
          setUploadingFile(false);
        }
      }
      
      loadBulletins();
      handleCloseModal();
    } catch (error: any) {
      console.error('Failed to save bulletin:', error);
      const errorMessage = error.response?.data?.detail || '주보 저장에 실패했습니다.';
      alert(`주보 저장 실패: ${errorMessage}`);
    }
  };

  const handleEdit = (bulletin: Bulletin) => {
    setEditingBulletin(bulletin);
    setFormData({
      title: bulletin.title,
      date: bulletin.date,
      content: bulletin.content || '',
      file_url: bulletin.file_url || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await bulletinService.deleteBulletin(id);
        loadBulletins();
      } catch (error) {
        console.error('Failed to delete bulletin:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingBulletin(null);
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      content: '',
      file_url: ''
    });
    setSelectedFile(null);
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">주보 관리</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          주보 추가
        </button>
      </div>

      {/* Bulletins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bulletins.map((bulletin) => (
          <div key={bulletin.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{bulletin.title}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {new Date(bulletin.date).toLocaleDateString('ko-KR')}
              </p>
              {bulletin.content && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{bulletin.content}</p>
              )}
              <div className="flex justify-between items-center">
                {bulletin.file_url ? (
                  <a
                    href={bulletin.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    파일 보기
                  </a>
                ) : (
                  <span className="text-gray-400 text-sm">첨부파일 없음</span>
                )}
                <div className="space-x-2">
                  <button
                    onClick={() => handleEdit(bulletin)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(bulletin.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingBulletin ? '주보 수정' : '주보 추가'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">파일 업로드</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    선택된 파일: {selectedFile.name}
                  </p>
                )}
                {editingBulletin?.file_url && !selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    현재 파일: <a href={editingBulletin.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">보기</a>
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={uploadingFile}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploadingFile ? '업로드 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bulletins;