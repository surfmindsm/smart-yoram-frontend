import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  MapPin, 
  Clock, 
  Eye,
  Heart,
  MessageCircle,
  UserPlus,
  GraduationCap,
  Award,
  FileText
} from 'lucide-react';
import { Button } from '../ui/button';

interface JobSeeker {
  id: number;
  title: string;
  name: string;
  ministryField: string[];
  career: string;
  education: string;
  certifications: string[];
  introduction: string;
  desiredLocation: string;
  availableDate: string;
  status: 'available' | 'interviewing' | 'hired';
  createdAt: string;
  views: number;
  likes: number;
  contacts: number;
}

const JobSeeking: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const jobSeekers: JobSeeker[] = [
    {
      id: 1,
      title: '청년부 사역에 열정이 있는 전도사입니다',
      name: '김○○',
      ministryField: ['청년부', '찬양', '상담'],
      career: '청년부 사역 3년, 찬양팀 리더 2년',
      education: '○○신학대학교 신학과 졸업',
      certifications: ['기독교상담사 2급', '찬양인도자 과정 수료'],
      introduction: '청년들과 함께 성장하며 하나님의 사랑을 전하고 싶습니다. 특히 찬양과 상담 사역에 은사가 있습니다.',
      desiredLocation: '서울, 경기',
      availableDate: '2025-10-01',
      status: 'available',
      createdAt: '1일 전',
      views: 24,
      likes: 5,
      contacts: 2
    },
    {
      id: 2,
      title: '주일학교와 교육 사역 전문 목사',
      name: '이○○',
      ministryField: ['주일학교', '교육부', '새신자'],
      career: '주일학교 담당 목사 5년, 교육부 디렉터 3년',
      education: '○○신학대학원 목회학 석사(M.Div)',
      certifications: ['어린이사역 전문가', '교사 교육 과정 수료'],
      introduction: '어린이와 청소년들에게 복음을 전하는 일에 부르심을 받았습니다. 체계적인 교육 프로그램 개발 경험이 있습니다.',
      desiredLocation: '부산, 경남',
      availableDate: '2025-11-01',
      status: 'interviewing',
      createdAt: '3일 전',
      views: 45,
      likes: 12,
      contacts: 8
    },
    {
      id: 3,
      title: '찬양과 예배를 사랑하는 사역자',
      name: '박○○',
      ministryField: ['찬양팀', '예배', '음향'],
      career: '찬양팀 리더 4년, 음향 담당 2년',
      education: '○○대학교 실용음악과',
      certifications: ['음향 기술자 자격증', '찬양 인도자 과정'],
      introduction: '찬양을 통해 성도들이 하나님을 만나는 예배를 만들어가고 싶습니다.',
      desiredLocation: '전국',
      availableDate: '즉시 가능',
      status: 'available',
      createdAt: '1주일 전',
      views: 38,
      likes: 9,
      contacts: 4
    }
  ];

  const ministryFields = [
    { value: 'all', label: '전체' },
    { value: '청년부', label: '청년부' },
    { value: '주일학교', label: '주일학교' },
    { value: '찬양팀', label: '찬양팀' },
    { value: '상담', label: '상담' },
    { value: '교육부', label: '교육부' }
  ];

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: 'available', label: '구직중' },
    { value: 'interviewing', label: '면접중' },
    { value: 'hired', label: '채용됨' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'interviewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'hired':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return '구직중';
      case 'interviewing':
        return '면접중';
      case 'hired':
        return '채용됨';
      default:
        return '알 수 없음';
    }
  };

  const filteredSeekers = jobSeekers.filter(seeker => {
    const matchesSearch = seeker.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seeker.introduction.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesField = selectedField === 'all' || seeker.ministryField.includes(selectedField);
    const matchesStatus = selectedStatus === 'all' || seeker.status === selectedStatus;
    
    return matchesSearch && matchesField && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">사역자 구직</h1>
          <p className="text-gray-600">
            사역자분들의 이력을 확인하고 연락해보세요
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          이력서 등록
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="제목이나 소개글로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ministryFields.map(field => (
              <option key={field.value} value={field.value}>
                {field.label}
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

      {/* 구직자 목록 */}
      <div className="space-y-4">
        {filteredSeekers.map((seeker) => (
          <div key={seeker.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {seeker.ministryField.map((field, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {field}
                  </span>
                ))}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(seeker.status)}`}>
                  {getStatusText(seeker.status)}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                {seeker.availableDate === '즉시 가능' ? '즉시 가능' : `${seeker.availableDate}부터`}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {seeker.title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <UserPlus className="h-4 w-4 mr-2" />
                  <strong className="mr-1">이름:</strong> {seeker.name}
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  <strong className="mr-1">학력:</strong> {seeker.education}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="h-4 w-4 mr-2" />
                  <strong className="mr-1">경력:</strong> {seeker.career}
                </div>
              </div>
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  <strong className="mr-1">희망 지역:</strong> {seeker.desiredLocation}
                </div>
                {seeker.certifications.length > 0 && (
                  <div className="flex items-start text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-2 mt-0.5" />
                    <div>
                      <strong className="mr-1">자격증:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {seeker.certifications.map((cert, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-50 text-green-700">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-gray-700 mb-4">
              <strong>자기소개:</strong> {seeker.introduction}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {seeker.createdAt}
                </span>
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  {seeker.views}
                </span>
                <span className="flex items-center">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  문의 {seeker.contacts}건
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <button className="flex items-center text-xs text-gray-500 hover:text-red-500">
                  <Heart className="h-3 w-3 mr-1" />
                  {seeker.likes}
                </button>

                <Button 
                  variant={seeker.status === 'available' ? 'default' : 'outline'} 
                  size="sm" 
                  disabled={seeker.status === 'hired'}
                  className="flex items-center gap-1"
                >
                  <MessageCircle className="h-3 w-3" />
                  {seeker.status === 'hired' ? '채용됨' : '연락하기'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredSeekers.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
          <Button variant="outline" size="sm">다음</Button>
        </div>
      </div>
    </div>
  );
};

export default JobSeeking;