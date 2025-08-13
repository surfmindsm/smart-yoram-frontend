import { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatHistory, Agent, DeleteConfirmModal } from '../types/chat';
import { chatService, agentService } from '../services/api';
import { saveMessageViaMCP, loadMessagesViaMCP } from '../utils/mcpUtils';

// 🚀 localStorage 캐시 키
const CACHE_KEYS = {
  CHAT_HISTORY: 'chat_history_cache',
  AGENTS: 'agents_cache',
  CACHE_TIMESTAMP: 'cache_timestamp'
};

// 🚀 캐시 유효 시간 (5분)
const CACHE_DURATION = 5 * 60 * 1000;

export const useChat = () => {
  // 🚀 localStorage에서 즉시 캐시된 데이터 로드
  const getInitialChatHistory = (): ChatHistory[] => {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.CHAT_HISTORY);
      const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < CACHE_DURATION) {
          const parsedHistory = JSON.parse(cached).map((history: any) => ({
            ...history,
            timestamp: new Date(history.timestamp)
          }));
          console.log('🚀 캐시된 채팅 히스토리 즉시 로드:', parsedHistory.length, '개');
          return parsedHistory;
        }
      }
    } catch (error) {
      console.error('캐시 로드 실패:', error);
    }
    return [];
  };
  
  const getInitialAgents = (): Agent[] => {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.AGENTS);
      const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < CACHE_DURATION) {
          console.log('🚀 캐시된 에이전트 즉시 로드:', JSON.parse(cached).length, '개');
          return JSON.parse(cached);
        }
      }
    } catch (error) {
      console.error('캐시 로드 실패:', error);
    }
    return [];
  };
  
  // 🚀 초기 캐시 데이터 로드
  const initialHistory = getInitialChatHistory();
  const initialAgents = getInitialAgents();

  // 상태 정의
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>(initialHistory);
  const [currentChatId, setCurrentChatId] = useState<string | null>(
    initialHistory.length > 0 ? initialHistory[0].id : null
  );
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
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
  
  // 🚀 중복 로딩 방지를 위한 상태
  const [isDataLoaded, setIsDataLoaded] = useState(initialHistory.length > 0 && initialAgents.length > 0);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // 🚀 캐시 저장 함수
  const saveChatHistoryToCache = (histories: ChatHistory[]) => {
    try {
      localStorage.setItem(CACHE_KEYS.CHAT_HISTORY, JSON.stringify(histories));
      localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
      console.log('💾 채팅 히스토리 캐시 저장:', histories.length, '개');
    } catch (error) {
      console.error('캐시 저장 실패:', error);
    }
  };
  
  const saveAgentsToCache = (agentList: Agent[]) => {
    try {
      localStorage.setItem(CACHE_KEYS.AGENTS, JSON.stringify(agentList));
      localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
      console.log('💾 에이전트 캐시 저장:', agentList.length, '개');
    } catch (error) {
      console.error('캐시 저장 실패:', error);
    }
  };
  
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

  // 🚀 데이터 로딩 최적화 - 중복 호출 방지 + 캐시 활용
  const loadData = async () => {
    // 이미 로딩 중이거나 로드 완료된 경우 중복 호출 방지
    if (isLoadingData || isDataLoaded) {
      console.log('⚡ 중복 로딩 방지:', { isLoadingData, isDataLoaded });
      return;
    }
    
    // 🚀 캐시가 있으면 API 호출 생략
    const hasCachedHistory = chatHistory.length > 0;
    const hasCachedAgents = agents.length > 0;
    
    if (hasCachedHistory && hasCachedAgents) {
      console.log('🚀 캐시된 데이터 사용 - API 호출 생략');
      setIsDataLoaded(true);
      setLoadingChats(false);
      
      // currentChatId가 없으면 첫 번째 채팅으로 설정
      if (!currentChatId && chatHistory.length > 0) {
        setCurrentChatId(chatHistory[0].id);
      }
      return;
    }
    
    try {
      setIsLoadingData(true);
      setLoadingChats(true);
      
      // 병렬 API 호출 (에이전트, 채팅 히스토리)
      const [agentsResult, chatsResult] = await Promise.allSettled([
        agentService.getAgents(),
        chatService.getChatHistories({ limit: 50 })
      ]);

      // 채팅 히스토리 처리
      if (chatsResult.status === 'fulfilled') {
        const response = chatsResult.value;
        const histories = response.data || response;
        if (Array.isArray(histories)) {
          const formattedHistories = histories.map((history: any) => ({
            ...history,
            timestamp: new Date(history.timestamp || history.created_at),
            isBookmarked: history.is_bookmarked || false
          }));
          setChatHistory(formattedHistories);
          saveChatHistoryToCache(formattedHistories); // 🚀 캐시 저장
          if (formattedHistories.length > 0 && !currentChatId) {
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
        saveChatHistoryToCache(mockHistory); // 🚀 캐시 저장
        if (!currentChatId) {
          setCurrentChatId(mockHistory[0].id);
        }
      }

      // 에이전트 처리 (기존 커밋과 동일한 로직)
      if (agentsResult.status === 'fulfilled') {
        const response = agentsResult.value;
        console.log('🔍 AIChat - 에이전트 API 응답:', response);
        
        let agentList = [];
        
        // 새로운 API 형식 처리 (기존 커밋과 동일)
        if (response.success && response.data && Array.isArray(response.data.agents)) {
          agentList = response.data.agents;
        } else if (Array.isArray(response.data)) {
          agentList = response.data;
        } else if (Array.isArray(response)) {
          agentList = response;
        }
        
        if (agentList.length > 0) {
          // 백엔드 snake_case를 프론트엔드 camelCase로 변환
          const transformedAgents = agentList.map((agent: any) => ({
            id: agent.id,
            name: agent.name,
            category: agent.category,
            description: agent.description,
            isActive: agent.is_active || agent.isActive,
            icon: agent.icon,
            systemPrompt: agent.system_prompt,
            detailedDescription: agent.detailed_description
          }));
          
          setAgents(transformedAgents);
          saveAgentsToCache(transformedAgents); // 🚀 캐시 저장
          console.log('✅ AIChat - 에이전트 로드 성공:', transformedAgents.length, '개');
        } else {
          console.log('⚠️ AIChat - 에이전트 목록이 비어있음');
          setAgents([]);
        }
      } else {
        console.log('❌ AIChat - 에이전트 로딩 실패, Mock 데이터 사용');
        const mockAgents: Agent[] = [
          { id: '1', name: '교인정보 에이전트', category: '교인 관리', description: '교인 등록, 출석 관리, 연락처 관리 등을 도와드립니다.', isActive: true },
          { id: '2', name: '예배 안내 에이전트', category: '예배 정보', description: '주일예배, 특별예배 시간과 장소를 안내해드립니다.', isActive: true },
          { id: '3', name: '공지사항 에이전트', category: '정보 전달', description: '교회 소식과 중요한 공지사항을 전달해드립니다.', isActive: true },
          { id: '4', name: '상담 에이전트', category: '목회 상담', description: '신앙 상담과 개인적인 고민을 함께 나눌 수 있습니다.', isActive: true }
        ];
        setAgents(mockAgents);
        console.log('🔄 AIChat - Mock 에이전트 사용:', mockAgents.length, '개');
      }
      
      // ✅ 데이터 로딩 완료 표시
      setIsDataLoaded(true);
      console.log('✅ 데이터 로딩 완료!');
      
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
      
      // ⚠️ 오류 시에도 로딩 완료로 표시 (재시도 방지)
      setIsDataLoaded(true);
    } finally {
      setLoadingChats(false);
      setIsLoadingData(false);
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
    if (currentChatId) {
      loadMessages();
    }
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
    isDataLoaded,
    isLoadingData,
    
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
