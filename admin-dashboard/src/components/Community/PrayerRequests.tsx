import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Clock, 
  Eye,
  Heart,
  MessageCircle,
  Sparkles,
  User,
  CheckCircle,
  HandHeart
} from 'lucide-react';
import { Button } from '../ui/button';

interface PrayerRequest {
  id: number;
  title: string;
  prayerContent: string;
  isAnonymous: boolean;
  requesterName: string;
  prayerStatus: 'requesting' | 'answered' | 'ongoing';
  prayerCount: number;
  testimony: string | null;
  createdAt: string;
  views: number;
  comments: number;
  category: 'healing' | 'family' | 'job' | 'church' | 'other';
}

const PrayerRequests: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const prayerRequests: PrayerRequest[] = [
    {
      id: 1,
      title: '어머니의 건강 회복을 위해 기도해주세요',
      prayerContent: '어머니께서 수술을 받으시게 되었습니다. 수술이 잘 되고 빠른 회복을 위해 기도 부탁드립니다.',
      isAnonymous: false,
      requesterName: '김○○',
      prayerStatus: 'requesting',
      prayerCount: 47,
      testimony: null,
      createdAt: '2시간 전',
      views: 89,
      comments: 12,
      category: 'healing'
    },
    {
      id: 2,
      title: '새로운 직장을 구할 수 있도록',
      prayerContent: '하나님의 뜻에 맞는 직장을 만날 수 있도록 기도해주세요. 가족들을 위해서도 좋은 기회가 있기를 바랍니다.',
      isAnonymous: true,
      requesterName: '익명',
      prayerStatus: 'ongoing',
      prayerCount: 23,
      testimony: null,
      createdAt: '1일 전',
      views: 56,
      comments: 8,
      category: 'job'
    },
    {
      id: 3,
      title: '기도 응답 간증 - 건강 회복',
      prayerContent: '지난달 기도 요청드렸던 아버지의 건강이 많이 좋아지셨습니다. 기도해주신 모든 분들께 감사드립니다.',
      isAnonymous: false,
      requesterName: '이○○',
      prayerStatus: 'answered',
      prayerCount: 78,
      testimony: '검사 결과가 많이 좋아졌고, 의사 선생님도 놀라실 정도로 회복이 빨랐습니다. 하나님의 은혜와 여러분의 기도 덕분입니다.',
      createdAt: '3일 전',
      views: 134,
      comments: 25,
      category: 'healing'
    },
    {
      id: 4,
      title: '교회 부흥과 성도들의 신앙성장을 위해',
      prayerContent: '우리 교회가 더욱 부흥하고 성도들의 신앙이 성장할 수 있도록 기도해주세요. 특히 청년들이 많이 돌아오길 원합니다.',
      isAnonymous: false,
      requesterName: '박목사',
      prayerStatus: 'ongoing',
      prayerCount: 95,
      testimony: null,
      createdAt: '1주일 전',
      views: 187,
      comments: 18,
      category: 'church'
    }
  ];

  const categories = [
    { value: 'all', label: '전체' },
    { value: 'healing', label: '건강/치유' },
    { value: 'family', label: '가정/가족' },
    { value: 'job', label: '직업/학업' },
    { value: 'church', label: '교회/사역' },
    { value: 'other', label: '기타' }
  ];

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: 'requesting', label: '기도 요청' },
    { value: 'ongoing', label: '기도 중' },
    { value: 'answered', label: '응답/간증' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requesting':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800';
      case 'answered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'requesting':
        return '기도 요청';
      case 'ongoing':
        return '기도 중';
      case 'answered':
        return '응답/간증';
      default:
        return '알 수 없음';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'healing':
        return 'bg-red-100 text-red-800';
      case 'family':
        return 'bg-pink-100 text-pink-800';
      case 'job':
        return 'bg-blue-100 text-blue-800';
      case 'church':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = prayerRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.prayerContent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || request.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || request.prayerStatus === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handlePrayFor = (requestId: number) => {
    // 기도했습니다 버튼 클릭 처리
    console.log('기도함:', requestId);
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">기도 요청</h1>
          <p className="text-gray-600">
            서로의 기도 제목을 나누고 함께 기도해요
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          기도 요청
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="제목이나 내용으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 기도 요청 목록 */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <div key={request.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(request.category)}`}>
                  {categories.find(c => c.value === request.category)?.label}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.prayerStatus)}`}>
                  {getStatusText(request.prayerStatus)}
                </span>
                {request.isAnonymous && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    익명
                  </span>
                )}
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-1" />
                {request.requesterName}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {request.title}
            </h3>

            <p className="text-gray-700 mb-4 leading-relaxed">
              {request.prayerContent}
            </p>

            {/* 간증이 있는 경우 */}
            {request.testimony && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-green-800 mb-1">기도 응답 간증</h4>
                    <p className="text-sm text-green-700">{request.testimony}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <HandHeart className="h-4 w-4 mr-1 text-red-500" />
                  {request.prayerCount}명이 기도함
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {request.createdAt}
                </span>
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {request.views}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button className="flex items-center text-sm text-gray-500 hover:text-blue-500">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  응원 {request.comments}
                </button>

                <Button 
                  size="sm" 
                  onClick={() => handlePrayFor(request.id)}
                  className={`flex items-center gap-1 ${
                    request.prayerStatus === 'answered' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {request.prayerStatus === 'answered' ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      감사합니다
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      기도했습니다
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredRequests.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            검색 결과가 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            다른 검색어나 필터를 시도해보세요.
          </p>
        </div>
      )}

      {/* 페이지네이션 */}
      <div className="flex justify-center mt-8">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>이전</Button>
          <Button size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">다음</Button>
        </div>
      </div>
    </div>
  );
};

export default PrayerRequests;