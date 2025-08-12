import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { agentService, analyticsService, churchConfigService, promptService } from '../services/api';
import {
  Bot, Plus, Eye, Settings, MoreHorizontal, Search,
  ChevronDown, X, BookOpen, Heart, Calendar, 
  GraduationCap, FileText, AlertCircle
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  category: string;
  description: string;
  detailedDescription: string;
  icon: string;
  usage: number;
  isActive: boolean;
  templates: string[];
  // 추가된 필드들
  createdAt: Date;
  updatedAt: Date;
  totalTokensUsed: number;
  totalCost: number;
  systemPrompt?: string;
  templateId?: string;  // 공식 템플릿 기반인 경우
  version?: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  description?: string;
  icon?: string;
  systemPrompt?: string;
  isOfficial?: boolean;
  version?: string;
  createdBy?: string;
  createdAt?: Date;
}

const AIAgentManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'agents' | 'templates'>('agents');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('모든 카테고리');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [activeAgentMenu, setActiveAgentMenu] = useState<string | null>(null);
  const [showChatView, setShowChatView] = useState(false);
  const [selectedAgentForChat, setSelectedAgentForChat] = useState<Agent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  
  // API 연동을 위한 상태
  const [agents, setAgents] = useState<Agent[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  
  // 사용량 통계 상태
  const [usageStats, setUsageStats] = useState({
    currentMonth: {
      totalTokens: 0,
      totalRequests: 0,
      totalCost: 0
    },
    topAgents: []
  });
  
  // GPT API 키 및 데이터베이스 상태
  const [systemStatus, setSystemStatus] = useState({
    gptApiConfigured: false,
    databaseConnected: false,
    lastSync: null as Date | null
  });
  
  // 공식 템플릿 상태
  const [officialTemplates, setOfficialTemplates] = useState<Template[]>([]);

  const [newAgent, setNewAgent] = useState({
    name: '',
    category: '카테고리 선택',
    icon: '🤖',
    description: '',
    detailedDescription: '',
    templates: [] as string[],
    immediateActivation: true,
    systemPrompt: '',
    templateId: '',
    isFromTemplate: false,
    churchDataSources: {
      announcements: false,
      attendances: false,
      members: false,
      worship_services: false,
      pastoral_care_requests: false,
      prayer_requests: false
    }
  });

  const categories = [
    '설교 지원',
    '목양 관리', 
    '예배 지원',
    '교육 관리',
    '행정 지원'
  ];

  // 컴포넌트 마운트 시 데이터 로딩
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAgents(),
        loadTemplates(),
        loadUsageStats(),
        loadSystemStatus()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      console.log('Loading agents from API...');
      const response = await agentService.getAgents();
      
      // 백엔드 재배포 후 새로운 응답 형식: {success: true, data: {...}}
      if (response.success && response.data) {
        console.log('New API format detected, processing data...');
        
        // 새 형식에서 agents 배열 추출
        if (Array.isArray(response.data.agents)) {
          console.log('Successfully loaded agents:', response.data.agents.length);
          console.log('🔍 첫 번째 에이전트 데이터 구조:', response.data.agents[0]);
          
          // 백엔드 snake_case를 프론트엔드 camelCase로 변환
          const transformedAgents = response.data.agents.map((agent: any) => ({
            ...agent,
            isActive: agent.is_active, // snake_case -> camelCase 변환
            detailedDescription: agent.detailed_description,
            systemPrompt: agent.system_prompt,
            templateId: agent.template_id,
            totalTokensUsed: agent.total_tokens_used || 0,
            totalCost: agent.total_cost || 0,
            usage: agent.usage_count || 0,
            createdAt: new Date(agent.created_at),
            updatedAt: agent.updated_at ? new Date(agent.updated_at) : new Date()
          }));
          
          console.log('✅ 변환된 첫 번째 에이전트:', transformedAgents[0]);
          setAgents(transformedAgents);
        } else if (Array.isArray(response.data)) {
          console.log('Data is direct array:', response.data.length);
          setAgents(response.data);
        } else {
          console.warn('Data contains no agents array:', response.data);
          setAgents([]);
        }
      } 
      // 이전 응답 형식 지원 (호환성 유지)
      else if (response && response.agents && Array.isArray(response.agents)) {
        console.log('Legacy format detected, using agents array');
        setAgents(response.agents);
      } else if (Array.isArray(response)) {
        console.log('Direct array format detected');
        setAgents(response);
      } else {
        console.warn('Unknown response format:', response);
        setAgents([]);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
      setAgents([]);
    }
  };

  const loadTemplates = async () => {
    try {
      console.log('Loading templates from API...');
      const templateList = await agentService.getAgentTemplates();
      
      // 강력한 타입 검사: 배열인지 확인
      if (Array.isArray(templateList)) {
        console.log('Successfully loaded templates:', templateList.length);
        setTemplates(templateList);
      } else {
        console.warn('Template API returned non-array response:', templateList);
        setTemplates([]); // 안전한 빈 배열로 설정
      }
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      
      // 에러 응답 내용 확인 (디버깅용)
      if (error.response?.data) {
        console.error('Error response data:', error.response.data);
        
        // validation 에러 객체가 들어오는 경우 방어
        if (typeof error.response.data === 'object' && 
            (error.response.data.type || error.response.data.msg)) {
          console.warn('Detected validation error object, using empty array');
        }
      }
      
      // 어떤 경우든 안전한 빈 배열로 설정
      setTemplates([]);
      
      if (error.response?.status === 422) {
        console.warn('템플릿 API가 422 에러를 반환했습니다. 백엔드 수정 대기 중입니다.');
      }
    }
  };

  const loadUsageStats = async () => {
    try {
      const stats = await analyticsService.getUsageStats({ period: 'current_month' });
      // API 응답을 기존 상태 구조에 맞게 변환
      if (stats) {
        setUsageStats({
          currentMonth: {
            totalTokens: stats.total_tokens || 0,
            totalRequests: stats.total_requests || 0,
            totalCost: stats.total_cost || 0
          },
          topAgents: stats.topAgents || []
        });
      }
    } catch (error: any) {
      console.error('Failed to load usage stats:', error);
      // 사용량 통계 로드 실패 시 기본값으로 설정하여 화면이 정상 작동하도록 함
      setUsageStats({
        currentMonth: {
          totalTokens: 0,
          totalRequests: 0,
          totalCost: 0
        },
        topAgents: []
      });
      
      if (error.response?.status === 422) {
        console.warn('사용량 통계 API가 422 에러를 반환했습니다. 기본 설정으로 진행합니다.');
      }
    }
  };

  const loadSystemStatus = async () => {
    try {
      const config = await churchConfigService.getGptConfig();
      setSystemStatus({
        gptApiConfigured: !!config.api_key,
        databaseConnected: config.database_connected || false,
        lastSync: config.last_sync ? new Date(config.last_sync) : null
      });
    } catch (error: any) {
      console.error('Failed to load system status:', error);
      // API 호출 실패 시 기본 상태로 설정
      setSystemStatus({
        gptApiConfigured: false,
        databaseConnected: false,
        lastSync: null
      });
      
      // 405 에러 등의 경우 사용자에게 알림 (선택사항)
      if (error.response?.status === 405) {
        console.warn('시스템 상태 API 호출 방식이 변경되었습니다. 기본 설정으로 진행합니다.');
      }
    }
  };

  // 더미 데이터는 API에서 로드됨

  const totalAgents = agents.length;
  const activeAgents = agents.filter(agent => agent.isActive);
  const inactiveAgents = totalAgents - activeAgents.length;
  const totalUsage = agents.reduce((sum, agent) => sum + (agent.usage || 0), 0);
  const totalTokensUsed = agents.reduce((sum, agent) => sum + (agent.totalTokensUsed || 0), 0);
  const totalCostThisMonth = agents.reduce((sum, agent) => sum + (agent.totalCost || 0), 0);

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '모든 카테고리' || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateAgent = async () => {
    if (!newAgent.name.trim() || newAgent.category === '카테고리 선택') {
      setError('에이전트 이름과 카테고리를 입력해주세요.');
      return;
    }

    if (!newAgent.description.trim()) {
      setError('간단한 설명을 입력해주세요.');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      
      // 1단계: 시스템 프롬프트 자동 생성 (Edge Function 사용)
      console.log('🤖 시스템 프롬프트 생성 중...');
      const promptResult = await promptService.generateSystemPrompt({
        name: newAgent.name,
        category: newAgent.category,
        description: newAgent.description,
        detailedDescription: newAgent.detailedDescription || newAgent.description
      });

      console.log('✅ 시스템 프롬프트 생성 완료:', promptResult.systemPrompt);
      
      // 2단계: 에이전트 생성
      const agentData = {
        name: newAgent.name,
        category: newAgent.category,
        description: newAgent.description,
        detailed_description: newAgent.detailedDescription || newAgent.description,
        icon: newAgent.icon,
        is_active: newAgent.immediateActivation,
        system_prompt: promptResult.systemPrompt,
        template_id: newAgent.isFromTemplate ? newAgent.templateId : undefined,
        church_data_sources: newAgent.churchDataSources
      };

      console.log('🔥 에이전트 생성 중...', agentData);
      const createdAgent = await agentService.createAgent(agentData);
      
      // 로컬 상태 업데이트
      setAgents(prev => [createdAgent, ...prev]);
      
      // 모달 닫기 및 상태 초기화
      setShowCreateModal(false);
      setNewAgent({
        name: '',
        category: '카테고리 선택',
        icon: '🤖',
        description: '',
        detailedDescription: '',
        templates: [],
        immediateActivation: true,
        systemPrompt: '',
        templateId: '',
        isFromTemplate: false,
        churchDataSources: {
          announcements: false,
          attendances: false,
          members: false,
          worship_services: false,
          pastoral_care_requests: false,
          prayer_requests: false
        }
      });

      console.log('🎉 에이전트 생성 완료!');
      
    } catch (error: any) {
      console.error('Failed to create agent:', error);
      if (error?.message?.includes('시스템 프롬프트')) {
        setError('시스템 프롬프트 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('에이전트 생성에 실패했습니다.');
      }
    } finally {
      setCreating(false);
    }
  };

  const toggleAgentStatus = async (id: string) => {
    console.log('🚨 toggleAgentStatus 함수 호출됨! ID:', id);
    
    try {
      const agent = agents.find(a => a.id === id);
      if (!agent) {
        console.log('❌ 에이전트를 찾을 수 없음:', id);
        return;
      }
      
      console.log(`🔄 에이전트 ${agent.name} 상태 변경 시도: ${agent.isActive ? '비활성' : '활성'}화`);
      
      let response;
      if (agent.isActive) {
        response = await agentService.deactivateAgent(id);
      } else {
        response = await agentService.activateAgent(id);
      }
      
      console.log('✅ API 응답:', response);
      
      // 백엔드에서 업데이트된 상태를 다시 불러오기
      console.log('🔄 백엔드에서 최신 에이전트 목록 다시 로드 중...');
      await loadAgents();
      
      console.log(`🎉 에이전트 ${agent.name} 상태 변경 완료`);
      
    } catch (error: any) {
      console.error('Failed to toggle agent status:', error);
      console.error('에러 상세:', error.response?.data || error.message);
      
      // API 호출 실패 시 로컬 상태는 변경하지 않음
      if (error.response?.status === 405) {
        setError('백엔드에서 해당 API를 지원하지 않습니다. 개발팀에 문의하세요.');
      } else if (error.response?.status === 422) {
        setError('요청 데이터에 문제가 있습니다.');
      } else {
        setError('에이전트 상태 변경에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  };

  const handleAgentClick = (agent: Agent) => {
    // 선택된 에이전트 정보를 localStorage에 저장
    localStorage.setItem('selectedAgent', JSON.stringify(agent));
    // AI 채팅 화면으로 이동
    navigate('/ai-chat');
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent({...agent});
    setShowEditModal(true);
    setActiveAgentMenu(null);
  };

  const handleDeleteAgent = (agentId: string) => {
    setAgentToDelete(agentId);
    setShowDeleteModal(true);
  };

  const confirmDeleteAgent = async () => {
    if (agentToDelete) {
      try {
        await agentService.deleteAgent(agentToDelete);
        setAgents(prev => prev.filter(a => a.id !== agentToDelete));
        setShowDeleteModal(false);
        setAgentToDelete(null);
      } catch (error) {
        console.error('Failed to delete agent:', error);
        setError('에이전트 삭제에 실패했습니다.');
      }
    }
  };

  const cancelDeleteAgent = () => {
    setShowDeleteModal(false);
    setAgentToDelete(null);
  };

  const handleBackToAgentList = () => {
    setShowChatView(false);
    setSelectedAgentForChat(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">AI 시스템 관리</h1>
        <p className="text-slate-600">AI 목교역자와 에이전트를 관리합니다</p>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          className={cn(
            "px-6 py-3 font-medium text-sm border-b-2 transition-colors",
            activeTab === 'agents'
              ? "border-sky-500 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
          onClick={() => setActiveTab('agents')}
        >
          에이전트 관리
        </button>
        <button
          className={cn(
            "px-6 py-3 font-medium text-sm border-b-2 transition-colors",
            activeTab === 'templates'
              ? "border-sky-500 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          )}
          onClick={() => setActiveTab('templates')}
        >
          템플릿 관리
        </button>
      </div>

      {activeTab === 'agents' && (
        <>
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalAgents}</p>
                  <p className="text-sm text-slate-600">총 에이전트</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{activeAgents.length}</p>
                  <p className="text-sm text-slate-600">활성 에이전트</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{inactiveAgents}</p>
                  <p className="text-sm text-slate-600">비활성 에이전트</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-sky-600">{totalUsage}</p>
                  <p className="text-sm text-slate-600">총 사용 횟수</p>
                </div>
              </div>
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="에이전트 이름이나 설명으로 검색..."
                  className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="relative">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md bg-white hover:bg-slate-50"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                {selectedCategory}
                <ChevronDown className="h-4 w-4" />
              </button>
              {showCategoryDropdown && (
                <div className="absolute top-full mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-10">
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-slate-50"
                    onClick={() => {
                      setSelectedCategory('모든 카테고리');
                      setShowCategoryDropdown(false);
                    }}
                  >
                    모든 카테고리
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50"
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-slate-800 hover:bg-slate-900 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              에이전트 생성
            </Button>
          </div>

          {/* 에이전트 목록 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              에이전트 목록 ({filteredAgents.length}개)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent) => (
                <div 
                  key={agent.id} 
                  className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-md transition-shadow cursor-pointer relative"
                  onClick={() => handleAgentClick(agent)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mr-3">
                        <span className="text-lg">{agent.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{agent.name}</h4>
                        {/* <span className={`inline-block px-2 py-1 text-xs font-medium rounded mt-1 ${
                          agent.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {agent.isActive ? '활성' : '비활성'}
                        </span> */}
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        className="text-slate-400 hover:text-slate-600 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveAgentMenu(activeAgentMenu === agent.id ? null : agent.id);
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {activeAgentMenu === agent.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-md shadow-lg z-20">
                          <button
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAgent(agent);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                            수정
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAgent(agent.id);
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-4">{agent.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{agent.category}</span>
                    {/* <span>사용 {agent.usage}회</span> */}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-slate-600">활성화</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAgentStatus(agent.id);
                      }}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        agent.isActive ? "bg-sky-600" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          agent.isActive ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* AI 채팅 화면 */}
      {showChatView && selectedAgentForChat && (
        <div className="fixed inset-0 bg-white z-50">
          <div className="h-full flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToAgentList}
                  className="text-slate-600 hover:text-slate-800"
                >
                  ← 돌아가기
                </button>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <span className="text-sm">{selectedAgentForChat.icon}</span>
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">{selectedAgentForChat.name}</h2>
                  <p className="text-xs text-slate-500">{selectedAgentForChat.category}</p>
                </div>
              </div>
            </div>
            
            {/* 채팅 영역 */}
            <div className="flex-1 p-4 bg-slate-50">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">{selectedAgentForChat.icon}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {selectedAgentForChat.name}와 대화를 시작하세요
                    </h3>
                    <p className="text-slate-600 mb-6">{selectedAgentForChat.description}</p>
                    
                    {/* 추천 질문들 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        '어떤 도움을 받을 수 있나요?',
                        '주요 기능을 알려주세요',
                        '사용법을 설명해주세요',
                        '예시를 보여주세요'
                      ].map((question) => (
                        <button
                          key={question}
                          className="p-3 text-left border border-slate-200 rounded-lg hover:border-sky-300 hover:bg-sky-50 transition-colors"
                        >
                          <div className="text-sm text-slate-700">{question}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 입력 영역 */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                  <button className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg">
                    전송
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 에이전트 수정 모달 */}
      {showEditModal && editingAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">에이전트 수정</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-slate-600 mb-6">
              에이전트의 정보를 수정합니다. 수정된 내용은 즉시 적용됩니다.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  에이전트 이름
                </label>
                <input
                  type="text"
                  placeholder="예: 설교 도우미"
                  className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  value={editingAgent.name}
                  onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    카테고리
                  </label>
                  <div className="relative">
                    <select
                      className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent appearance-none bg-white"
                      value={editingAgent.category}
                      onChange={(e) => setEditingAgent({ ...editingAgent, category: e.target.value })}
                    >
                      <option disabled>카테고리 선택</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    아이콘
                  </label>
                  <div className="relative">
                    <select
                      className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent appearance-none bg-white"
                      value={editingAgent.icon}
                      onChange={(e) => setEditingAgent({ ...editingAgent, icon: e.target.value })}
                    >
                      <option value="🤖">🤖 로봇</option>
                      <option value="📖">📖 책</option>
                      <option value="❤️">❤️ 하트</option>
                      <option value="⛪">⛪ 교회</option>
                      <option value="🎓">🎓 학사모</option>
                      <option value="📋">📋 클립보드</option>
                      <option value="💡">💡 전구</option>
                      <option value="🎯">🎯 타겟</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  간단 설명
                </label>
                <textarea
                  placeholder="에이전트의 역할을 한 줄로 설명해주세요"
                  className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  value={editingAgent.description}
                  onChange={(e) => setEditingAgent({ ...editingAgent, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  상세 설명
                </label>
                <textarea
                  placeholder="에이전트의 기능과 특징을 자세히 설명해주세요"
                  rows={4}
                  className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                  value={editingAgent.detailedDescription}
                  onChange={(e) => setEditingAgent({ ...editingAgent, detailedDescription: e.target.value })}
                />
              </div>



              <div className="flex items-center justify-between py-4">
                <label className="text-sm font-medium text-slate-900">활성화</label>
                <button
                  onClick={() => setEditingAgent({ ...editingAgent, isActive: !editingAgent.isActive })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    editingAgent.isActive ? "bg-sky-600" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      editingAgent.isActive ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <Button
                variant="ghost"
                onClick={() => setShowEditModal(false)}
              >
                취소
              </Button>
              <Button
                onClick={() => {
                  if (!editingAgent.name || editingAgent.category === '카테고리 선택') {
                    alert('필수 정보를 입력해주세요.');
                    return;
                  }
                  setAgents(agents.map(agent => 
                    agent.id === editingAgent.id ? editingAgent : agent
                  ));
                  setShowEditModal(false);
                }}
                className="bg-slate-800 hover:bg-slate-900 text-white"
              >
                수정
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 에이전트 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">새 에이전트 생성</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-slate-600 mb-6">
              새로운 AI 에이전트를 생성합니다. 에이전트는 특정 역할과 기능을 가진 AI 어시스턴트입니다.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  에이전트 이름
                </label>
                <input
                  type="text"
                  placeholder="예: 설교 도우미"
                  className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    카테고리
                  </label>
                  <div className="relative">
                    <select
                      className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent appearance-none bg-white"
                      value={newAgent.category}
                      onChange={(e) => setNewAgent({ ...newAgent, category: e.target.value })}
                    >
                      <option>카테고리 선택</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    아이콘
                  </label>
                  <div className="relative">
                    <select
                      className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent appearance-none bg-white"
                      value={newAgent.icon}
                      onChange={(e) => setNewAgent({ ...newAgent, icon: e.target.value })}
                    >
                      <option value="🤖">🤖 로봇</option>
                      <option value="📖">📖 책</option>
                      <option value="❤️">❤️ 하트</option>
                      <option value="⛪">⛪ 교회</option>
                      <option value="📚">📚 도서</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  간단 설명
                </label>
                <input
                  type="text"
                  placeholder="에이전트의 역할을 한 줄로 설명해주세요"
                  className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  상세 설명
                </label>
                <textarea
                  placeholder="에이전트의 기능과 특징을 자세히 설명해주세요"
                  rows={4}
                  className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                  value={newAgent.detailedDescription}
                  onChange={(e) => setNewAgent({ ...newAgent, detailedDescription: e.target.value })}
                />
              </div>

              {/* 교회 데이터 선택 */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-3">
                  교회 데이터 연동 (선택사항)
                </label>
                <p className="text-sm text-slate-600 mb-4">
                  에이전트가 참조할 교회 데이터를 선택하세요. 선택한 데이터를 기반으로 더 정확한 답변을 제공합니다.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAgent.churchDataSources.announcements}
                      onChange={(e) => setNewAgent({
                        ...newAgent,
                        churchDataSources: {
                          ...newAgent.churchDataSources,
                          announcements: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">공지사항</div>
                      <div className="text-xs text-slate-600">교회 공지사항 및 알림</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAgent.churchDataSources.attendances}
                      onChange={(e) => setNewAgent({
                        ...newAgent,
                        churchDataSources: {
                          ...newAgent.churchDataSources,
                          attendances: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">출석현황</div>
                      <div className="text-xs text-slate-600">교인 출석 통계</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAgent.churchDataSources.members}
                      onChange={(e) => setNewAgent({
                        ...newAgent,
                        churchDataSources: {
                          ...newAgent.churchDataSources,
                          members: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">교인현황</div>
                      <div className="text-xs text-slate-600">교인 정보 및 현황</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAgent.churchDataSources.worship_services}
                      onChange={(e) => setNewAgent({
                        ...newAgent,
                        churchDataSources: {
                          ...newAgent.churchDataSources,
                          worship_services: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">예배정보</div>
                      <div className="text-xs text-slate-600">예배 일정 및 정보</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAgent.churchDataSources.pastoral_care_requests}
                      onChange={(e) => setNewAgent({
                        ...newAgent,
                        churchDataSources: {
                          ...newAgent.churchDataSources,
                          pastoral_care_requests: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">심방 신청</div>
                      <div className="text-xs text-slate-600">교인들의 심방 요청 데이터</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAgent.churchDataSources.prayer_requests}
                      onChange={(e) => setNewAgent({
                        ...newAgent,
                        churchDataSources: {
                          ...newAgent.churchDataSources,
                          prayer_requests: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">중보 기도 요청</div>
                      <div className="text-xs text-slate-600">교인들의 기도 요청 데이터</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between py-4">
                <label className="text-sm font-medium text-slate-900">즉시 활성화</label>
                <button
                  onClick={() => setNewAgent({ ...newAgent, immediateActivation: !newAgent.immediateActivation })}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    newAgent.immediateActivation ? "bg-sky-600" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      newAgent.immediateActivation ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <Button
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
              >
                취소
              </Button>
              <Button
                onClick={handleCreateAgent}
                disabled={creating}
                className="bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-50"
              >
                {creating ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>AI 프롬프트 생성 중...</span>
                  </div>
                ) : (
                  '생성'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">에이전트 삭제</h3>
              <button
                onClick={cancelDeleteAgent}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-slate-600 mb-6">
              정말로 이 에이전트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={cancelDeleteAgent}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={confirmDeleteAgent}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgentManagement;
