import { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatHistory, Agent, DeleteConfirmModal } from '../types/chat';
import { chatService, agentService, memberService, announcementService, attendanceService } from '../services/api';
import { saveMessageViaMCP, loadMessagesViaMCP } from '../utils/mcpUtils';

export const useChat = () => {
  // 상태 정의
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedAgentForChat, setSelectedAgentForChat] = useState<Agent | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'agents'>('history');
  const [loadingChats, setLoadingChats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<DeleteConfirmModal>({
    isOpen: false,
    chatId: null,
    chatTitle: ''
  });
  const [messageCache, setMessageCache] = useState<{[key: string]: ChatMessage[]}>({});
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 스크롤 유틸리티
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mock AI 응답 생성 (기존 커밋과 동일)
  const getMockAIResponse = (userInput: string): ChatMessage => {
    const responses: {[key: string]: string} = {
      '결석자': '이번 주 결석자 명단을 확인해드리겠습니다.\n\n**주일예배 결석자 (11월 12일)**\n• 김철수 (연락처: 010-1234-5678)\n• 박영희 (연락처: 010-9876-5432)\n• 이민수 (연락처: 010-5555-7777)\n\n**새가족부**\n• 정수진 (새가족, 방문 필요)\n\n담당 구역장님들께 연락 부탁드립니다.',
      
      '새가족': '새가족 현황을 알려드리겠습니다.\n\n**이번 달 새가족**\n• 정수진 (30대 여성, 직장인)\n• 김영호 (40대 남성, 자영업)\n• 최미래 (20대 여성, 대학생)\n\n**필요한 조치**\n1. 환영 전화 (담당: 전도부)\n2. 새가족 예배 안내\n3. 정착반 등록 추천\n\n새가족들의 정착을 위해 많은 관심 부탁드립니다.',
      
      'default': '안녕하세요! AI 교역자입니다. 교회 사역과 관련된 다양한 질문에 도움을 드릴 수 있습니다.\n\n구체적인 질문을 해주시면 더 정확한 정보를 제공해드리겠습니다.'
    };

    let content = responses['default'];
    if (userInput.includes('결석') || userInput.includes('출석')) {
      content = responses['결석자'];
    } else if (userInput.includes('새가족')) {
      content = responses['새가족'];
    }

    return {
      id: `msg-${Date.now()}`,
      content,
      role: 'assistant',
      timestamp: new Date(),
      tokensUsed: Math.floor(Math.random() * 200) + 50,
      cost: Math.random() * 0.1 + 0.02
    };
  };

  // 데이터 로딩 최적화 (병렬 API 호출) - 기존 커밋과 동일
  const loadData = async () => {
    try {
      setLoadingChats(true);
      
      // 🚀 병렬 API 호출로 속도 2배 개선
      const [chatHistoryResult, agentsResult] = await Promise.allSettled([
        chatService.getChatHistories({ limit: 50 }),
        agentService.getAgents()
      ]);

      // 채팅 히스토리 처리
      if (chatHistoryResult.status === 'fulfilled') {
        const response = chatHistoryResult.value;
        const histories = response.data || response;
        if (Array.isArray(histories)) {
          const formattedHistories = histories.map((history: any) => ({
            ...history,
            timestamp: new Date(history.timestamp || history.created_at),
            isBookmarked: history.is_bookmarked || false
          }));
          setChatHistory(formattedHistories);
          if (formattedHistories.length > 0) {
            setCurrentChatId(formattedHistories[0].id);
          }
        } else {
          setChatHistory([]);
        }
      } else {
        // Mock 데이터 폴백
        const mockHistory: ChatHistory[] = [
          {
            id: '1',
            title: '새 대화',
            timestamp: new Date(),
            messageCount: 0,
            isBookmarked: false
          }
        ];
        setChatHistory(mockHistory);
        setCurrentChatId(mockHistory[0].id);
      }

      // 에이전트 처리
      if (agentsResult.status === 'fulfilled') {
        const response = agentsResult.value;
        console.log('🔍 AIChat - 에이전트 API 응답:', response);
        
        let agentList = [];
        
        // 새로운 API 형식 처리
        if (response?.agents && Array.isArray(response.agents)) {
          agentList = response.agents;
        } else if (response?.data && Array.isArray(response.data)) {
          agentList = response.data;
        } else if (Array.isArray(response)) {
          agentList = response;
        }
        
        const activeAgents = agentList.filter((agent: Agent) => agent.isActive);
        setAgents(activeAgents);
        console.log('✅ AIChat - 활성 에이전트:', activeAgents.length, '개');
      } else {
        // Mock 에이전트 폴백
        const mockAgents: Agent[] = [
          { id: '1', name: '교인정보 에이전트', category: '교인 관리', description: '교인 등록, 출석 관리, 연락처 관리 등을 도와드립니다.', isActive: true },
          { id: '2', name: '예배 안내 에이전트', category: '예배 정보', description: '주일예배, 특별예배 시간과 장소를 안내해드립니다.', isActive: true },
          { id: '3', name: '공지사항 에이전트', category: '정보 전달', description: '교회 소식과 중요한 공지사항을 전달해드립니다.', isActive: true },
          { id: '4', name: '상담 에이전트', category: '목회 상담', description: '신앙 상담과 개인적인 고민을 함께 나눌 수 있습니다.', isActive: true }
        ];
        setAgents(mockAgents);
        console.log('🔄 AIChat - Mock 에이전트 사용');
      }
    } catch (error) {
      console.error('❌ AIChat - 전체 데이터 로딩 실패:', error);
      
      // 완전 실패 시 Mock 데이터
      const mockHistory: ChatHistory[] = [
        {
          id: '1',
          title: '새 대화',
          timestamp: new Date(),
          messageCount: 0,
          isBookmarked: false
        }
      ];
      setChatHistory(mockHistory);
      setCurrentChatId(mockHistory[0].id);
      
      const mockAgents: Agent[] = [
        { id: '1', name: '교인정보 에이전트', category: '교인 관리', description: '교인 등록, 출석 관리, 연락처 관리 등을 도와드립니다.', isActive: true },
        { id: '2', name: '예배 안내 에이전트', category: '예배 정보', description: '주일예배, 특별예배 시간과 장소를 안내해드립니다.', isActive: true }
      ];
      setAgents(mockAgents);
    } finally {
      setLoadingChats(false);
    }
  };

  // 메시지 로드 (기존 커밋과 동일)
  const loadMessages = async () => {
    if (!currentChatId) return;

    // 🚀 캐시에서 먼저 확인 (즉시 표시)
    if (messageCache[currentChatId]) {
      setMessages(messageCache[currentChatId]);
      return;
    }

    try {
      const response = await chatService.getChatMessages(currentChatId);
      const messageList = response.data || response;
      const formattedMessages = Array.isArray(messageList) ? messageList.map((message: any) => ({
        ...message,
        timestamp: new Date(message.timestamp || message.created_at)
      })) : [];
      
      // 🛡️ 서버 응답이 비어있고 이미 로컬 메시지가 있다면 기존 메시지 유지
      if (formattedMessages.length === 0 && messages.length > 0) {
        console.log('🔄 서버 응답이 비어있지만 로컬 메시지 유지:', messages.length, '개');
        // 현재 메시지를 캐시에 저장
        setMessageCache(prev => ({
          ...prev,
          [currentChatId]: messages
        }));
        return;
      }
      
      setMessages(formattedMessages);
      
      // 💾 캐시에 저장 (다음에 즉시 로딩)
      setMessageCache(prev => ({
        ...prev,
        [currentChatId]: formattedMessages
      }));
    } catch (error) {
      console.error('메시지 로딩 실패:', error);
      // 🛡️ 에러 발생 시에도 기존 메시지가 있다면 유지
      if (messages.length === 0) {
        setMessages([]);
      }
    }
  };

  // useEffect: currentChatId 변경 시 메시지 로드
  useEffect(() => {
    loadMessages();
  }, [currentChatId]);

  // useEffect: 외부 클릭으로 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  return {
    // 상태
    messages,
    setMessages,
    inputValue,
    setInputValue,
    isLoading,
    setIsLoading,
    chatHistory,
    setChatHistory,
    currentChatId,
    setCurrentChatId,
    agents,
    setAgents,
    selectedAgent,
    setSelectedAgent,
    selectedAgentForChat,
    setSelectedAgentForChat,
    showHistory,
    setShowHistory,
    activeTab,
    setActiveTab,
    loadingChats,
    setLoadingChats,
    error,
    setError,
    openMenuId,
    setOpenMenuId,
    editingChatId,
    setEditingChatId,
    editingTitle,
    setEditingTitle,
    deleteConfirmModal,
    setDeleteConfirmModal,
    messageCache,
    setMessageCache,
    
    // Refs
    messagesEndRef,
    dropdownRef,
    
    // 함수들
    scrollToBottom,
    getMockAIResponse,
    loadData,
    loadMessages
  };
};
