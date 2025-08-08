import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { 
  Send, History, Bot, Star, MoreHorizontal, Edit3, Trash2,
  BookOpen, FileText, Users, Calendar, CheckSquare, MessageSquare,
  ChevronsLeftRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  // 추가된 필드들
  tokensUsed?: number;
  cost?: number;
  dataSources?: string[];  // AI가 참조한 데이터 소스들
  processingTime?: number;  // 응답 생성 시간 (ms)
}

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  agentId?: string;
  agentName?: string;
  messageCount: number;
  isBookmarked?: boolean;
  // 옵션: 전체 메시지 배열 (로컬에서만 사용)
  messages?: ChatMessage[];
  // 통계 정보
  totalTokensUsed?: number;
  totalCost?: number;
}

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
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
    {
      id: '1',
      title: '최근 4주 연속 주일예배...',
      timestamp: new Date('2025-08-08'),
      agentId: '1',
      agentName: '설교 도우미',
      messageCount: 8,
      isBookmarked: true,
      messages: [],  // 로컬 데이터
      totalTokensUsed: 850,
      totalCost: 0.42
    },
    {
      id: '2',
      title: '새 대화',
      timestamp: new Date('2025-08-08'),
      agentId: '2',
      agentName: '심방 관리 도우미',
      messageCount: 0,
      isBookmarked: false,
      messages: [],
      totalTokensUsed: 0,
      totalCost: 0
    },
    {
      id: '3',
      title: '새가족 관리 현황',
      timestamp: new Date('2025-08-07'),
      agentId: '2',
      agentName: '심방 관리 도우미',
      messageCount: 12,
      isBookmarked: true,
      messages: [],
      totalTokensUsed: 1240,
      totalCost: 0.62
    }
  ]);
  const [currentChatId, setCurrentChatId] = useState<string>('1');
  const [showHistory, setShowHistory] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'ministry'>('history');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 컴포넌트 마운트 시 localStorage에서 선택된 에이전트 확인
  useEffect(() => {
    const savedAgent = localStorage.getItem('selectedAgent');
    if (savedAgent) {
      try {
        const agent = JSON.parse(savedAgent);
        setSelectedAgent(agent);
        // localStorage에서 제거 (일회성)
        localStorage.removeItem('selectedAgent');
      } catch (error) {
        console.error('Failed to parse selected agent:', error);
      }
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    // AI 응답 시뮬레이션
    const startTime = Date.now();
    setTimeout(() => {
      const processingTime = Date.now() - startTime;
      const aiResponseData = getAIResponse(inputValue);
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponseData.content,
        role: 'assistant',
        timestamp: new Date(),
        tokensUsed: aiResponseData.tokensUsed,
        cost: aiResponseData.cost,
        dataSources: aiResponseData.dataSources,
        processingTime
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const getAIResponse = (userInput: string): { content: string, tokensUsed: number, cost: number, dataSources: string[] } => {
    const responses = {
      '결석자': {
        content: '최근 4주 연속 주일예배 결석자는 총 12명입니다.\n\n**우선 심방 대상:**\n• 김○○ 집사 (연락처: 010-1234-5678)\n• 이○○ 권사 (연락처: 010-2345-6789)\n• 박○○ 성도 (연락처: 010-3456-7890)\n\n**심방 시 확인사항:**\n• 건강 상태 및 개인적 어려움\n• 교회 참석에 대한 의견\n• 필요한 도움이나 기도제목\n\n더 자세한 정보가 필요하시면 말씨해 주세요.',
        tokensUsed: 180,
        cost: 0.09,
        dataSources: ['attendance_records', 'member_info', 'contact_database']
      },
      '새가족': {
        content: '최근 한 달간 새가족 등록 현황입니다.\n\n**신규 등록자 (5명):**\n• 최○○님 (20대, 대학생)\n• 정○○님 (30대, 직장인)\n• 한○○님 (40대, 주부)\n• 송○○님 (50대, 자영업)\n• 조○○님 (30대, 부부)\n\n**후속조치 계획:**\n1. 새가족반 안내 및 등록\n2. 담당 목자 배정\n3. 환영 심방 계획 수립\n4. 교회 소개 자료 전달\n\n각 새가족별 상세 정보가 필요하시면 말씨해 주세요.',
        tokensUsed: 165,
        cost: 0.08,
        dataSources: ['new_member_registry', 'member_demographics', 'follow_up_schedule']
      },
      'default': {
        content: '안녕하세요! AI 교역자입니다. 교회 사역과 관련된 다양한 질문에 도움을 드릴 수 있습니다.\n\n**주요 기능:**\n• 출석 및 결석자 관리\n• 새가족 현황 및 관리\n• 심방 대상자 우선순위\n• 각종 교회 업무 지원\n\n구체적인 질문을 해주시면 더 정확한 정보를 제공해드리겠습니다.',
        tokensUsed: 95,
        cost: 0.05,
        dataSources: ['system_info']
      }
    };

    if (userInput.includes('결석') || userInput.includes('출석')) {
      return responses['결석자'];
    }
    if (userInput.includes('새가족')) {
      return responses['새가족'];
    }

    return responses['default'];
  };

  const handleNewChat = () => {
    const newChat: ChatHistory = {
      id: Date.now().toString(),
      title: '새 대화',
      timestamp: new Date(),
      agentId: selectedAgent?.id,
      agentName: selectedAgent?.name,
      messageCount: 0,
      isBookmarked: false,
      messages: [],  // 로컬 데이터
      totalTokensUsed: 0,
      totalCost: 0
    };
    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages([]);
  };

  const handleCategorySelect = (category: string, question: string) => {
    setInputValue(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleToggleChatBookmark = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatHistory(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, isBookmarked: !chat.isBookmarked }
        : chat
    ));
  };

  const handleMenuToggle = (chatId: string) => {
    setActiveMenu(activeMenu === chatId ? null : chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chatHistory.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      } else {
        setMessages([]);
        setCurrentChatId('');
      }
    }
    setActiveMenu(null);
  };

  const handleEditTitle = (chatId: string, currentTitle: string) => {
    setEditingChat(chatId);
    setEditingTitle(currentTitle);
    setActiveMenu(null);
  };

  const handleSaveTitle = (chatId: string) => {
    if (editingTitle.trim()) {
      setChatHistory(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, title: editingTitle.trim() }
          : chat
      ));
    }
    setEditingChat(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingChat(null);
    setEditingTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderChatItem = (chat: ChatHistory) => (
    <div
      key={chat.id}
      className={cn(
        "relative p-3 rounded-lg transition-colors group",
        currentChatId === chat.id 
          ? "bg-sky-50 border-l-2 border-sky-500" 
          : "hover:bg-slate-50"
      )}
    >
      <div className="flex items-center justify-between">
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setCurrentChatId(chat.id)}
        >
          {editingChat === chat.id ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTitle(chat.id);
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
                className="text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                autoFocus
              />
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  onClick={() => handleSaveTitle(chat.id)}
                  className="h-6 px-2 text-xs bg-sky-600 hover:bg-sky-700"
                >
                  저장
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="h-6 px-2 text-xs"
                >
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleToggleChatBookmark(chat.id, e)}
                  className={cn(
                    "h-4 w-4 p-0 transition-colors",
                    chat.isBookmarked 
                      ? "text-yellow-500 hover:text-yellow-600" 
                      : "text-slate-300 hover:text-slate-500"
                  )}
                  title={chat.isBookmarked ? "고정 해제" : "고정"}
                >
                  <Star className={cn(
                    "h-3 w-3",
                    chat.isBookmarked && "fill-current"
                  )} />
                </Button>
                <p className="text-sm font-medium text-slate-900 truncate flex-1">
                  {chat.title}
                </p>
              </div>
              <p className="text-xs text-slate-500">
                {chat.timestamp.toLocaleDateString()}
              </p>
            </>
          )}
        </div>
        
        {editingChat !== chat.id && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleMenuToggle(chat.id);
              }}
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
            
            {activeMenu === chat.id && (
              <div className="absolute right-0 top-6 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditTitle(chat.id, chat.title);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    이름변경
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(chat.id);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-6rem)] flex bg-white rounded-lg shadow-sm border border-slate-200">
      {/* 채팅 히스토리 사이드바 */}
      <div className={cn(
        "border-r border-slate-200 transition-all duration-300",
        showHistory ? "w-80" : "w-0 overflow-hidden"
      )}>
        {/* 탭바 */}
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                activeTab === 'history' 
                  ? "text-sky-600 border-sky-600" 
                  : "text-slate-500 border-transparent hover:text-slate-700"
              )}
            >
              히스토리
            </button>
            <button
              onClick={() => setActiveTab('ministry')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                activeTab === 'ministry' 
                  ? "text-sky-600 border-sky-600" 
                  : "text-slate-500 border-transparent hover:text-slate-700"
              )}
            >
              사역 도우미
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100%-4rem)]">
          <Button 
            onClick={handleNewChat}
            className="w-full mb-4 bg-sky-600 hover:bg-sky-700 text-white"
          >
            새 대화 시작
          </Button>
          
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* 고정된 채팅 섹션 */}
              {chatHistory.filter(chat => chat.isBookmarked).length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" />
                    즐겨찾기
                  </h3>
                  {chatHistory
                    .filter(chat => chat.isBookmarked)
                    .map(renderChatItem)}
                </div>
              )}

              {/* 모든 대화 섹션 */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-600 mb-3">모든 대화</h3>
                {chatHistory
                  .filter(chat => !chat.isBookmarked)
                  .map(renderChatItem)}
              </div>
            </div>
          )}

          {activeTab === 'ministry' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-600 mb-3">사역 도우미</h3>
              <div className="space-y-2">
                <div 
                  onClick={() => handleCategorySelect('sermon', '이번 주 설교 준비를 위한 본문 분석을 도와주세요')}
                  className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center mb-2">
                    <BookOpen className="w-4 h-4 text-slate-600 mr-2" />
                    <p className="text-sm font-medium text-slate-900">설교 준비</p>
                  </div>
                  <p className="text-xs text-slate-500">본문 분석, 개요 작성</p>
                </div>
                <div 
                  onClick={() => handleCategorySelect('bulletin', '이번 주 주보 내용을 작성해주세요')}
                  className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center mb-2">
                    <FileText className="w-4 h-4 text-slate-600 mr-2" />
                    <p className="text-sm font-medium text-slate-900">주보 작성</p>
                  </div>
                  <p className="text-xs text-slate-500">예배순서, 광고사항</p>
                </div>
                <div 
                  onClick={() => handleCategorySelect('visit', '우선 심방이 필요한 성도 목록을 알려주세요')}
                  className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center mb-2">
                    <Users className="w-4 h-4 text-slate-600 mr-2" />
                    <p className="text-sm font-medium text-slate-900">심방 계획</p>
                  </div>
                  <p className="text-xs text-slate-500">우선순위 심방 대상</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 채팅 헤더 */}
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? (
                  <ChevronsLeft className="h-5 w-5" />
                ) : (
                  <ChevronsRight className="h-5 w-5" />
                )}
              </Button>
              <div className="flex items-center space-x-2">
                {selectedAgent ? (
                  <>
                    <span className="text-xl">{selectedAgent.icon}</span>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{selectedAgent.name}</h2>
                      <p className="text-xs text-slate-500">{selectedAgent.category}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Bot className="h-6 w-6 text-sky-600" />
                    <h2 className="text-lg font-semibold text-slate-900">AI 교역자</h2>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-2xl">
                {selectedAgent ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">{selectedAgent.icon}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">{selectedAgent.name}와 대화를 시작하세요</h3>
                    <p className="text-slate-600 mb-6">{selectedAgent.description}</p>
                  </>
                ) : (
                  <>
                    <Bot className="h-12 w-12 text-sky-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">AI 교역자와 대화를 시작하세요</h3>
                    <p className="text-slate-600 mb-6">교회 운영과 관련된 다양한 질문을 해보세요. AI가 도움을 드리겠습니다.</p>
                  </>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { title: '생명당 조회', query: '최근 4주 연속 주일예배 결석자 명단과 심방 우선순위를 알려주세요' },
                    { title: '심방 대상', query: '우선적으로 심방이 필요한 성도 명단을 보여주세요' },
                    { title: '새가족', query: '최근 등록된 새가족 현황과 후속조치 계획을 알려주세요' },
                    { title: '기도 체크', query: '기도제목이 있는 성도들의 현황을 확인해주세요' },
                    { title: '설교 준비', query: '이번 주 설교 준비를 위한 본문 분석을 도와주세요' },
                    { title: '주보 작성', query: '이번 주 주보 내용을 작성해주세요' }
                  ].map((category) => (
                    <button
                      key={category.title}
                      onClick={() => handleCategorySelect(category.title, category.query)}
                      className="p-3 text-left border border-slate-200 rounded-lg hover:border-sky-300 hover:bg-sky-50 transition-colors"
                    >
                      <div className="text-sm font-medium text-slate-900">
                        {category.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {category.query.length > 40 ? category.query.substring(0, 40) + '...' : category.query}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-2xl p-3 rounded-lg",
                      message.role === 'user'
                        ? "bg-sky-600 text-white"
                        : "bg-slate-100 text-slate-900"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        message.role === 'user' ? "text-sky-100" : "text-slate-500"
                      )}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-2xl p-3 rounded-lg bg-slate-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 입력 영역 */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex space-x-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
