import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FileText,
  Grid3X3,
  List
} from 'lucide-react';
import { Button } from '../ui/button';
import { communityService, JobSeeker } from '../../services/communityService';
import { formatCreatedAt } from '../../utils/dateUtils';


const JobSeeking: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await communityService.getJobSeekers({
          ministryField: selectedField === 'all' ? undefined : selectedField,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          search: searchTerm || undefined,
          limit: 50
        });
        setJobSeekers(data);
      } catch (error) {
        console.error('JobSeeking 데이터 로드 실패:', error);
        setJobSeekers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedField, selectedStatus, searchTerm]);

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">사역자 지원</h1>
          <p className="text-gray-600">
            사역자분들의 이력을 확인하고 연락해보세요
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 뷰 모드 토글 */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>

          <Button 
            className="flex items-center gap-2"
            onClick={() => navigate('/community/job-seeking/create')}
          >
            <Plus className="h-4 w-4" />
            사역자 지원 등록
          </Button>
        </div>
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
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">사역자 지원 목록을 불러오는 중...</p>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            /* 테이블 뷰 */
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사역 분야
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        교회명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        희망 지역
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        등록일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        조회수
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobSeekers.map((seeker) => (
                      <tr key={seeker.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{seeker.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{seeker.introduction}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {(seeker.ministryField || []).slice(0, 2).map((field, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {field}
                              </span>
                            ))}
                            {(seeker.ministryField || []).length > 2 && (
                              <span className="text-xs text-gray-500">+{(seeker.ministryField || []).length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {seeker.userName || seeker.name || '익명'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {seeker.church || '협력사'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(seeker.preferredLocation || []).join(', ') || '정보 없음'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(seeker.status)}`}>
                            {getStatusText(seeker.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCreatedAt(seeker.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {seeker.views}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* 카드 뷰 */
            <div className="space-y-4">
              {jobSeekers.map((seeker) => (
              <div key={seeker.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {(seeker.ministryField || []).map((field, index) => (
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
                {seeker.availability || '정보 없음'}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {seeker.title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <UserPlus className="h-4 w-4 mr-2" />
                  <strong className="mr-1">이름:</strong> {seeker.userName || seeker.name || '익명'}
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
                  <strong className="mr-1">희망 지역:</strong> {(seeker.preferredLocation || []).join(', ') || '정보 없음'}
                </div>
                {(seeker.certifications || []).length > 0 && (
                  <div className="flex items-start text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-2 mt-0.5" />
                    <div>
                      <strong className="mr-1">자격증:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(seeker.certifications || []).map((cert, index) => (
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
                  {formatCreatedAt(seeker.createdAt)}
                </span>
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  {seeker.views}
                </span>
                <span className="flex items-center">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  매칭 {seeker.matches}건
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <button className="flex items-center text-xs text-gray-500 hover:text-red-500">
                  <Heart className="h-3 w-3 mr-1" />
                  {seeker.likes}
                </button>

                <Button 
                  variant={seeker.status === 'active' ? 'default' : 'outline'} 
                  size="sm" 
                  disabled={seeker.status === 'inactive'}
                  className="flex items-center gap-1"
                >
                  <MessageCircle className="h-3 w-3" />
                  {seeker.status === 'inactive' ? '비활성' : '연락하기'}
                </Button>
              </div>
            </div>
              </div>
            ))}
            </div>
          )}
        </>
      )}

      {/* 빈 상태 */}
      {!loading && jobSeekers.length === 0 && (
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