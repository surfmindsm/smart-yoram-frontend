import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import {
  Bot, Plus, Eye, Settings, MoreHorizontal, Search,
  ChevronDown, X, BookOpen, Heart, Calendar, 
  GraduationCap, FileText
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
  
  // 사용량 통계 상태
  const [usageStats, setUsageStats] = useState({
    currentMonth: {
      totalTokens: 28100,
      totalRequests: 152,
      totalCost: 14.05
    },
    topAgents: [
      { id: '1', name: '설교 도우미', tokens: 12500, requests: 65 },
      { id: '2', name: '심방 관리 도우미', tokens: 8900, requests: 45 },
      { id: '3', name: '예배 기획자', tokens: 6700, requests: 42 }
    ]
  });
  
  // GPT API 키 및 데이터베이스 상태
  const [systemStatus, setSystemStatus] = useState({
    gptApiConfigured: true,
    databaseConnected: true,
    lastSync: new Date('2025-08-08T10:30:00Z')
  });
  
  // 공식 템플릿 상태
  const [officialTemplates, setOfficialTemplates] = useState<Template[]>([
    {
      id: 'official-1',
      name: '설교 준비 도우미',
      category: '설교 지원',
      description: '성경 해석, 설교문 작성, 적용점 개발을 도와주는 전문 AI',
      icon: '📖',
      isOfficial: true,
      version: '2.1.0',
      createdBy: 'Smart Yoram Team',
      createdAt: new Date('2025-07-01')
    },
    {
      id: 'official-2', 
      name: '목양 및 심방 도우미',
      category: '목양 관리',
      description: '성도 상담, 심방 계획, 목양 지도를 도와주는 전문 AI',
      icon: '❤️',
      isOfficial: true,
      version: '1.8.0',
      createdBy: 'Smart Yoram Team',
      createdAt: new Date('2025-06-15')
    }
  ]);

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
    isFromTemplate: false
  });

  const categories = [
    '설교 지원',
    '목양 관리', 
    '예배 지원',
    '교육 관리',
    '행정 지원'
  ];

  const templates: Template[] = [
    { id: '1', name: '본문 주석 및 해석 (설교 도우미)', category: '설교 지원' },
    { id: '2', name: '강해설교 구조 설계 (설교 도우미)', category: '설교 지원' },
    { id: '3', name: '주제설교 구조 설계 (설교 도우미)', category: '설교 지원' },
    { id: '4', name: '적용점 개발 (설교 도우미)', category: '설교 지원' }
  ];

  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      name: '설교 도우미',
      category: '설교 지원',
      description: '설교 준비와 설교 연구를 도와드리는 전문 에이전트',
      detailedDescription: '설교 준비와 설교 연구를 도와드리는 전문 에이전트',
      icon: '📖',
      usage: 45,
      isActive: true,
      templates: ['1', '2'],
      createdAt: new Date('2025-07-15'),
      updatedAt: new Date('2025-08-05'),
      totalTokensUsed: 12500,
      totalCost: 6.25,
      systemPrompt: '당신은 설교 준비를 전문적으로 도와주는 AI입니다.',
      templateId: 'template-1',
      version: '1.0.0'
    },
    {
      id: '2', 
      name: '심방 관리 도우미',
      category: '목양 관리',
      description: '심방 일정과 목양을 위한 전문 상담 에이전트',
      detailedDescription: '심방 일정과 목양을 위한 전문 상담 에이전트',
      icon: '❤️',
      usage: 32,
      isActive: true,
      templates: [],
      createdAt: new Date('2025-07-20'),
      updatedAt: new Date('2025-08-01'),
      totalTokensUsed: 8900,
      totalCost: 4.45,
      systemPrompt: '당신은 목양과 심방을 전문적으로 도와주는 AI입니다.',
      version: '1.0.0'
    },
    {
      id: '3',
      name: '예배 기획자',
      category: '예배 지원', 
      description: '예배 순서와 준비사항을 체계적으로 관리하는 에이전트',
      detailedDescription: '예배 순서와 준비사항을 체계적으로 관리하는 에이전트',
      icon: '⛪',
      usage: 28,
      isActive: true,
      templates: [],
      createdAt: new Date('2025-07-25'),
      updatedAt: new Date('2025-08-03'),
      totalTokensUsed: 6700,
      totalCost: 3.35,
      systemPrompt: '당신은 예배 순서와 기획을 전문적으로 도와주는 AI입니다.',
      version: '1.0.0'
    }
  ]);

  const totalAgents = agents.length;
  const activeAgents = agents.filter(agent => agent.isActive).length;
  const inactiveAgents = totalAgents - activeAgents;
  const totalUsage = agents.reduce((sum, agent) => sum + agent.usage, 0);
  const totalTokensUsed = agents.reduce((sum, agent) => sum + agent.totalTokensUsed, 0);
  const totalCostThisMonth = agents.reduce((sum, agent) => sum + agent.totalCost, 0);

  const handleCreateAgent = () => {
    if (!newAgent.name || newAgent.category === '카테고리 선택') {
      alert('필수 정보를 입력해주세요.');
      return;
    }

    const agent: Agent = {
      id: (agents.length + 1).toString(),
      name: newAgent.name,
      category: newAgent.category,
      description: newAgent.description,
      detailedDescription: newAgent.detailedDescription,
      icon: newAgent.icon,
      usage: 0,
      isActive: newAgent.immediateActivation,
      templates: newAgent.templates,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalTokensUsed: 0,
      totalCost: 0,
      systemPrompt: newAgent.systemPrompt || '',
      templateId: newAgent.templateId,
      version: '1.0.0'
    };

    setAgents([...agents, agent]);
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
      isFromTemplate: false
    });
  };

  const toggleAgentStatus = (id: string) => {
    setAgents(agents.map(agent => 
      agent.id === id ? { ...agent, isActive: !agent.isActive } : agent
    ));
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
    if (window.confirm('이 에이전트를 삭제하시겠습니까?')) {
      setAgents(agents.filter(agent => agent.id !== agentId));
      setActiveAgentMenu(null);
    }
  };

  const handleBackToAgentList = () => {
    setShowChatView(false);
    setSelectedAgentForChat(null);
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '모든 카테고리' || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
                  <p className="text-2xl font-bold text-green-600">{activeAgents}</p>
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
                className="bg-slate-800 hover:bg-slate-900 text-white"
              >
                생성
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAgentManagement;
