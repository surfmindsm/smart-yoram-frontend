import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Library,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  Music,
  Video,
  Upload,
  Calendar,
  User,
  Tag,
  BookOpen
} from 'lucide-react';
import { sermonLibraryService } from '../services/api';

interface SermonMaterial {
  id: number;
  title: string;
  author: string;
  content?: string;
  file_url?: string;
  file_type?: string;
  category: string;
  scripture_reference?: string;
  date_preached?: string;
  tags: string[];
  is_public: boolean;
  download_count: number;
  view_count: number;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface Stats {
  total_materials: number;
  public_materials: number;
  private_materials: number;
  total_downloads: number;
  total_views: number;
}

const SermonLibrary: React.FC = () => {
  const [materials, setMaterials] = useState<SermonMaterial[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 데이터 로딩
  useEffect(() => {
    fetchMaterials();
    fetchCategories();
    fetchAuthors();
    fetchTags();
    fetchStats();
  }, [currentPage, searchTerm, selectedCategory, selectedAuthor, selectedFileType, showPublicOnly]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      console.log('🔍 fetchMaterials 호출 시작');
      
      const params: any = {};
      if (searchTerm) params.q = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedAuthor) params.author = selectedAuthor;
      if (selectedFileType) params.file_type = selectedFileType;
      if (showPublicOnly) params.public_only = true;
      params.page = currentPage;
      params.size = pageSize;

      console.log('📝 API 파라미터:', params);
      
      const response = await sermonLibraryService.getSermonMaterials(params);
      console.log('✅ 설교 자료 조회 성공:', response);
      
      // 응답이 배열인지 확인하고 안전하게 설정
      const materialsArray = Array.isArray(response) ? response : (response?.items || []);
      setMaterials(materialsArray);
      
      // 총 페이지 수는 별도 API로 가져와야 할 수 있음
      if (materials.length < pageSize) {
        setTotalPages(currentPage);
      }
    } catch (error) {
      console.error('❌ 설교 자료 조회 실패:', error);
      setMaterials([]); // 에러 시 빈 배열로 설정
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('🔍 fetchCategories 호출 시작');
      const categories = await sermonLibraryService.getCategories();
      console.log('✅ 카테고리 조회 성공:', categories);
      setCategories(categories);
    } catch (error) {
      console.error('❌ 카테고리 조회 실패:', error);
      setCategories([]); // 에러 시 빈 배열로 설정
    }
  };

  const fetchAuthors = async () => {
    try {
      console.log('🔍 fetchAuthors 호출 시작');
      const authors = await sermonLibraryService.getAuthors();
      console.log('✅ 설교자 목록 조회 성공:', authors);
      setAuthors(authors);
    } catch (error) {
      console.error('❌ 설교자 목록 조회 실패:', error);
      setAuthors([]); // 에러 시 빈 배열로 설정
    }
  };

  const fetchTags = async () => {
    try {
      console.log('🔍 fetchTags 호출 시작');
      const tags = await sermonLibraryService.getTags();
      console.log('✅ 태그 목록 조회 성공:', tags);
      setTags(tags);
    } catch (error) {
      console.error('❌ 태그 목록 조회 실패:', error);
      setTags([]); // 에러 시 빈 배열로 설정
    }
  };

  const fetchStats = async () => {
    try {
      console.log('🔍 fetchStats 호출 시작');
      const stats = await sermonLibraryService.getStats();
      console.log('✅ 통계 조회 성공:', stats);
      setStats(stats);
    } catch (error) {
      console.error('❌ 통계 조회 실패:', error);
      setStats(null); // 에러 시 null로 설정
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="w-4 h-4" />;
    
    if (fileType.includes('audio') || ['mp3', 'm4a', 'wav'].includes(fileType)) {
      return <Music className="w-4 h-4" />;
    }
    if (fileType.includes('video') || ['mp4', 'mov'].includes(fileType)) {
      return <Video className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const handleDownload = async (material: SermonMaterial) => {
    if (!material.file_url) return;
    
    try {
      console.log('🔍 handleDownload 시작:', material.file_url);
      
      const response = await sermonLibraryService.downloadFile(material.file_url);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${material.title}.${material.file_type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ 파일 다운로드 완료');
      
      // 다운로드 횟수 새로고침
      fetchMaterials();
    } catch (error) {
      console.error('❌ 파일 다운로드 실패:', error);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedAuthor('');
    setSelectedFileType('');
    setShowPublicOnly(false);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Library className="w-6 h-6 text-sky-600" />
          <h1 className="text-2xl font-bold text-slate-900">설교 자료 관리</h1>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowUploadModal(true)} className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>파일 업로드</span>
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>자료 등록</span>
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-sky-600">{stats.total_materials}</div>
              <div className="text-sm text-slate-500">총 자료 수</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.public_materials}</div>
              <div className="text-sm text-slate-500">공개 자료</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.private_materials}</div>
              <div className="text-sm text-slate-500">비공개 자료</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.total_downloads}</div>
              <div className="text-sm text-slate-500">총 다운로드</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-indigo-600">{stats.total_views}</div>
              <div className="text-sm text-slate-500">총 조회수</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="제목, 설교자, 내용 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="">전체 카테고리</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>

            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="">전체 설교자</option>
              {authors.map(author => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>

            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="">전체 형식</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="txt">텍스트</option>
              <option value="mp3">오디오</option>
              <option value="mp4">비디오</option>
            </select>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="publicOnly"
                checked={showPublicOnly}
                onChange={(e) => setShowPublicOnly(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="publicOnly" className="text-sm">공개만</label>
            </div>

            <Button variant="outline" onClick={clearFilters} className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>필터 초기화</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 설교 자료 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-12">
            <div className="text-slate-500">로딩 중...</div>
          </div>
        ) : !Array.isArray(materials) || materials.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <Library className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <div className="text-slate-500">등록된 설교 자료가 없습니다.</div>
          </div>
        ) : (
          materials.map((material) => (
            <Card key={material.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getFileIcon(material.file_type)}
                      <h3 className="font-semibold text-slate-900 line-clamp-1">
                        {material.title}
                      </h3>
                      <Badge variant={material.is_public ? "default" : "secondary"}>
                        {material.is_public ? "공개" : "비공개"}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-slate-600">
                      {material.author && (
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{material.author}</span>
                        </div>
                      )}
                      
                      {material.scripture_reference && (
                        <div className="flex items-center space-x-1">
                          <BookOpen className="w-3 h-3" />
                          <span>{material.scripture_reference}</span>
                        </div>
                      )}
                      
                      {material.date_preached && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{material.date_preached}</span>
                        </div>
                      )}
                    </div>

                    {material.content && (
                      <p className="text-sm text-slate-600 mt-3 line-clamp-2">
                        {material.content}
                      </p>
                    )}

                    {material.tags.length > 0 && (
                      <div className="flex items-center space-x-1 mt-3">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <div className="flex flex-wrap gap-1">
                          {material.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{material.view_count}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Download className="w-3 h-3" />
                      <span>{material.download_count}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {material.file_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(material)}
                        className="flex items-center space-x-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>다운로드</span>
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            이전
          </Button>
          <span className="px-4 py-2 text-sm">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
};

export default SermonLibrary;