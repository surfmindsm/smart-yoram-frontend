import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
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
  BookOpen,
  Grid,
  List
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
  total_downloads: number;
  total_views: number;
}

const SermonLibrary: React.FC = () => {
  const [materials, setMaterials] = useState<SermonMaterial[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<SermonMaterial | null>(null);
  
  // 새 자료 등록 상태
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    author: '',
    content: '',
    scripture_reference: ''
  });
  
  // 파일 업로드 상태
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // 파일 업로드 메타데이터
  const [uploadMetadata, setUploadMetadata] = useState({
    title: '',
    author: '',
    scripture_reference: ''
  });

  // 데이터 로딩
  useEffect(() => {
    fetchMaterials();
    fetchCategories();
    fetchAuthors();
    fetchStats();
  }, [currentPage, searchTerm, selectedCategory, selectedAuthor, selectedFileType]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      console.log('🔍 fetchMaterials 호출 시작');
      
      const params: any = {};
      if (searchTerm) params.q = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedAuthor) params.author = selectedAuthor;
      if (selectedFileType) params.file_type = selectedFileType;
      params.page = currentPage;
      params.size = pageSize;

      console.log('📝 API 파라미터:', params);
      
      const response = await sermonLibraryService.getSermonMaterials(params);
      console.log('✅ 설교 자료 조회 성공:', response);
      
      // 페이지네이션 응답 구조에서 items 추출
      const { items = [], total = 0, pages = 1 } = response || {};
      setMaterials(items);
      
      // 총 페이지 수 설정
      setTotalPages(pages);
    } catch (error) {
      console.error('❌ 설교 자료 조회 실패:', error);
      setMaterials([]); // 에러 시 빈 배열로 설정
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categories = await sermonLibraryService.getCategories();
      setCategories(Array.isArray(categories) ? categories : []);
    } catch (error) {
      console.error('❌ 카테고리 조회 실패:', error);
      setCategories([]);
    }
  };

  const fetchAuthors = async () => {
    try {
      const authors = await sermonLibraryService.getAuthors();
      setAuthors(Array.isArray(authors) ? authors : []);
    } catch (error) {
      console.error('❌ 설교자 목록 조회 실패:', error);
      setAuthors([]);
    }
  };


  const fetchStats = async () => {
    try {
      const stats = await sermonLibraryService.getStats();
      setStats(stats);
    } catch (error) {
      console.error('❌ 통계 조회 실패:', error);
      setStats(null);
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
    setCurrentPage(1);
  };

  const handleEditMaterial = (material: SermonMaterial) => {
    setEditingMaterial(material);
    
    // 파일이 있는 자료인지 확인
    if (material.file_url) {
      // 파일 자료의 경우 파일 업로드 메타데이터만 수정
      setUploadMetadata({
        title: material.title || '',
        author: material.author || '',
        scripture_reference: material.scripture_reference || ''
      });
      setShowUploadModal(true);
    } else {
      // 일반 자료의 경우 전체 내용 수정
      setNewMaterial({
        title: material.title || '',
        author: material.author || '',
        content: material.content || '',
        scripture_reference: material.scripture_reference || ''
      });
      setShowEditModal(true);
    }
  };

  const handleUpdateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    
    setCreating(true);
    
    try {
      console.log('🔄 자료 수정 시작:', editingMaterial.id);
      
      await sermonLibraryService.updateMaterial(editingMaterial.id, newMaterial);
      
      console.log('✅ 자료 수정 성공');
      
      // 모달 닫기 및 상태 초기화
      setShowEditModal(false);
      setEditingMaterial(null);
      setNewMaterial({
        title: '',
        author: '',
        content: '',
        scripture_reference: ''
      });
      
      // 목록 새로고침
      fetchMaterials();
    } catch (error) {
      console.error('❌ 자료 수정 실패:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMaterial = async (material: SermonMaterial) => {
    if (!window.confirm(`"${material.title}" 자료를 삭제하시겠습니까?`)) return;
    
    try {
      console.log('🗑️ 자료 삭제 시작:', material.id);
      
      await sermonLibraryService.deleteMaterial(material.id);
      
      console.log('✅ 자료 삭제 성공');
      
      // 목록 새로고침
      fetchMaterials();
    } catch (error) {
      console.error('❌ 자료 삭제 실패:', error);
      alert('자료 삭제에 실패했습니다.');
    }
  };

  // 자료 등록 함수
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      console.log('🚀 새 자료 등록 시작:', newMaterial);
      
      await sermonLibraryService.createMaterial(newMaterial);
      
      console.log('✅ 자료 등록 성공');
      
      // 모달 닫기 및 상태 초기화
      setShowCreateModal(false);
      setNewMaterial({
        title: '',
        author: '',
        content: '',
        scripture_reference: ''
      });
      
      // 목록 새로고침
      fetchMaterials();
    } catch (error) {
      console.error('❌ 자료 등록 실패:', error);
    } finally {
      setCreating(false);
    }
  };

  // 파일 자료 수정 함수 (파일은 그대로, 메타데이터만 수정)
  const handleUpdateFileMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    
    setUploading(true);
    
    try {
      console.log('🔄 파일 자료 메타데이터 수정 시작:', editingMaterial.id);
      
      await sermonLibraryService.updateMaterial(editingMaterial.id, {
        ...uploadMetadata,
        file_url: editingMaterial.file_url, // 기존 파일 URL 유지
        file_type: editingMaterial.file_type // 기존 파일 타입 유지
      });
      
      console.log('✅ 파일 자료 수정 성공');
      
      // 모달 닫기 및 상태 초기화
      setShowUploadModal(false);
      setEditingMaterial(null);
      setUploadMetadata({
        title: '',
        author: '',
        scripture_reference: ''
      });
      
      // 목록 새로고침
      fetchMaterials();
    } catch (error) {
      console.error('❌ 파일 자료 수정 실패:', error);
    } finally {
      setUploading(false);
    }
  };

  // 파일 업로드 또는 파일 자료 수정 함수
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 편집 모드인지 확인
    if (editingMaterial && editingMaterial.file_url) {
      // 파일 자료 수정
      return handleUpdateFileMaterial(e);
    }
    
    // 새로운 파일 업로드
    if (!uploadFile) return;
    
    setUploading(true);
    
    try {
      console.log('🚀 파일 업로드 시작:', uploadFile.name);
      
      const formData = new FormData();
      formData.append('file', uploadFile);
      
      // 메타데이터도 함께 전송
      Object.entries(uploadMetadata).forEach(([key, value]) => {
        if (value) {
          formData.append(key, value);
        }
      });
      
      const uploadResult = await sermonLibraryService.uploadFile(formData);
      console.log('📁 업로드 결과:', uploadResult);
      
      // 파일 업로드 후 자료도 생성해야 하는 경우
      if (uploadResult?.file_url) {
        console.log('📝 자료 생성 시작 - 업로드된 파일과 연결');
        const materialData = {
          ...uploadMetadata,
          file_url: uploadResult.file_url,
          file_type: uploadResult.file_type
        };
        console.log('📤 자료 생성 데이터:', materialData);
        const createResult = await sermonLibraryService.createMaterial(materialData);
        console.log('📥 자료 생성 결과:', createResult);
      }
      
      console.log('✅ 파일 업로드 성공');
      
      // 모달 닫기 및 상태 초기화
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadMetadata({
        title: '',
        author: '',
        scripture_reference: ''
      });
      
      // 목록 새로고침
      fetchMaterials();
    } catch (error) {
      console.error('❌ 파일 업로드 실패:', error);
    } finally {
      setUploading(false);
    }
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
          <div className="flex border border-slate-300 rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="rounded-none border-0"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none border-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-sky-600">{stats.total_materials}</div>
              <div className="text-sm text-slate-500">총 자료 수</div>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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


            <Button variant="outline" onClick={clearFilters} className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>필터 초기화</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 설교 자료 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-slate-500">로딩 중...</div>
        </div>
      ) : !Array.isArray(materials) || materials.length === 0 ? (
        <div className="text-center py-12">
          <Library className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <div className="text-slate-500">등록된 설교 자료가 없습니다.</div>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {materials.map((material) => (
            <Card key={material.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getFileIcon(material.file_type)}
                      <h3 className="font-semibold text-slate-900 line-clamp-1">
                        {material.title}
                      </h3>
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
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditMaterial(material)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteMaterial(material)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 font-medium text-slate-700">유형</th>
                    <th className="text-left p-4 font-medium text-slate-700">제목</th>
                    <th className="text-left p-4 font-medium text-slate-700">설교자</th>
                    <th className="text-left p-4 font-medium text-slate-700">성경구절</th>
                    <th className="text-left p-4 font-medium text-slate-700">등록일</th>
                    <th className="text-left p-4 font-medium text-slate-700">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material) => (
                    <tr key={material.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(material.file_type)}
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                            {material.file_url ? '파일' : '자료'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{material.title}</div>
                        {material.content && (
                          <p className="text-sm text-slate-600 mt-1 line-clamp-1">{material.content}</p>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">{material.author || '-'}</td>
                      <td className="p-4 text-slate-600">{material.scripture_reference || '-'}</td>
                      <td className="p-4 text-slate-600">
                        {material.created_at ? new Date(material.created_at).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1">
                          {material.file_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownload(material)}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditMaterial(material)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteMaterial(material)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
      
      {/* 자료 등록 모달 */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 설교 자료 등록</DialogTitle>
            <DialogDescription>
              새로운 설교 자료를 등록합니다.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateMaterial} className="space-y-4">
            <div>
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={newMaterial.title}
                onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                placeholder="설교 제목을 입력하세요"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="author">설교자</Label>
                <Input
                  id="author"
                  value={newMaterial.author}
                  onChange={(e) => setNewMaterial({...newMaterial, author: e.target.value})}
                  placeholder="설교자 이름"
                />
              </div>
              
              <div>
                <Label htmlFor="scripture_reference">성경 구절</Label>
                <Input
                  id="scripture_reference"
                  value={newMaterial.scripture_reference}
                  onChange={(e) => setNewMaterial({...newMaterial, scripture_reference: e.target.value})}
                  placeholder="예: 요한복음 3:16"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={newMaterial.content}
                onChange={(e) => setNewMaterial({...newMaterial, content: e.target.value})}
                placeholder="설교 내용을 입력하세요"
                rows={6}
              />
            </div>
            
            
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                취소
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? '등록 중...' : '등록'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* 파일 업로드 모달 */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? '파일 자료 수정' : '파일 업로드'}
            </DialogTitle>
            <DialogDescription>
              {editingMaterial 
                ? '파일 자료의 메타데이터를 수정합니다. (파일은 변경되지 않습니다)'
                : '설교 자료 파일과 메타데이터를 함께 업로드합니다.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleFileUpload} className="space-y-4">
            {editingMaterial ? (
              // 편집 모드: 기존 파일 정보 표시
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm font-medium text-blue-800">기존 파일:</p>
                <p className="text-sm text-blue-600">
                  {editingMaterial.file_url?.split('/').pop()} ({editingMaterial.file_type?.toUpperCase()})
                </p>
                <p className="text-xs text-blue-500">파일은 변경되지 않으며, 메타데이터만 수정됩니다.</p>
              </div>
            ) : (
              // 새 업로드 모드: 파일 선택
              <>
                <div>
                  <Label htmlFor="file">파일 선택 *</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      // 파일 크기 체크 (10MB 제한)
                      if (file && file.size > 10 * 1024 * 1024) {
                        alert('파일 크기는 10MB 이하로 업로드해주세요.');
                        e.target.value = '';
                        return;
                      }
                      setUploadFile(file);
                      // 파일명에서 제목 자동 설정
                      if (file && !uploadMetadata.title) {
                        const fileName = file.name.replace(/\.[^/.]+$/, "");
                        setUploadMetadata(prev => ({...prev, title: fileName}));
                      }
                    }}
                    accept=".pdf,.doc,.docx,.txt,.mp3,.mp4,.wav,.m4a"
                    required
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    지원 파일: PDF, DOC, DOCX, TXT, MP3, MP4, WAV, M4A (최대 10MB)
                  </p>
                </div>
                
                {uploadFile && (
                  <div className="p-3 bg-slate-50 rounded-md">
                    <p className="text-sm font-medium">선택된 파일:</p>
                    <p className="text-sm text-slate-600">{uploadFile.name}</p>
                    <p className="text-xs text-slate-500">크기: {(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                )}
              </>
            )}

            <div>
              <Label htmlFor="upload_title">제목 *</Label>
              <Input
                id="upload_title"
                value={uploadMetadata.title}
                onChange={(e) => setUploadMetadata({...uploadMetadata, title: e.target.value})}
                placeholder="설교 제목을 입력하세요"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="upload_author">설교자</Label>
                <Input
                  id="upload_author"
                  value={uploadMetadata.author}
                  onChange={(e) => setUploadMetadata({...uploadMetadata, author: e.target.value})}
                  placeholder="설교자 이름"
                />
              </div>
              
              <div>
                <Label htmlFor="upload_scripture">성경 구절</Label>
                <Input
                  id="upload_scripture"
                  value={uploadMetadata.scripture_reference}
                  onChange={(e) => setUploadMetadata({...uploadMetadata, scripture_reference: e.target.value})}
                  placeholder="예: 요한복음 3:16"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setEditingMaterial(null);
                  setUploadMetadata({
                    title: '',
                    author: '',
                    scripture_reference: ''
                  });
                }}
              >
                취소
              </Button>
              <Button type="submit" disabled={uploading || (!editingMaterial && !uploadFile)}>
                {uploading ? 
                  (editingMaterial ? '수정 중...' : '업로드 중...') : 
                  (editingMaterial ? '수정' : '업로드')
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 자료 수정 모달 */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>설교 자료 수정</DialogTitle>
            <DialogDescription>
              설교 자료 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateMaterial} className="space-y-4">
            <div>
              <Label htmlFor="edit_title">제목 *</Label>
              <Input
                id="edit_title"
                value={newMaterial.title}
                onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                placeholder="설교 제목을 입력하세요"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_author">설교자</Label>
                <Input
                  id="edit_author"
                  value={newMaterial.author}
                  onChange={(e) => setNewMaterial({...newMaterial, author: e.target.value})}
                  placeholder="설교자 이름"
                />
              </div>
              
              <div>
                <Label htmlFor="edit_scripture_reference">성경 구절</Label>
                <Input
                  id="edit_scripture_reference"
                  value={newMaterial.scripture_reference}
                  onChange={(e) => setNewMaterial({...newMaterial, scripture_reference: e.target.value})}
                  placeholder="예: 요한복음 3:16"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_content">내용</Label>
              <Textarea
                id="edit_content"
                value={newMaterial.content}
                onChange={(e) => setNewMaterial({...newMaterial, content: e.target.value})}
                placeholder="설교 내용을 입력하세요"
                rows={6}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                취소
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? '수정 중...' : '수정'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SermonLibrary;