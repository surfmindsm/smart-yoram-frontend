import { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, ChatHistory, Agent, DeleteConfirmModal } from '../types/chat';
import { supabaseApiService } from '../services/supabaseApiService';
import { saveMessageViaMCP, loadMessagesViaMCP } from '../utils/mcpUtils';
import { AGENT_CONFIG } from '../constants/agents';

// 🚀 localStorage 캐시 키
const CACHE_KEYS = {
  CHAT_HISTORY: 'chat_history_cache',
  AGENTS: 'agents_cache',
  CACHE_TIMESTAMP: 'cache_timestamp',
  CURRENT_CHAT_STATE: 'current_chat_state'
};

// 🚀 캐시 유효 시간 (5분)
const CACHE_DURATION = 5 * 60 * 1000;

export const useChat = () => {
  // 🚀 현재 채팅 상태 복구
  const initialChatState = useMemo(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEYS.CURRENT_CHAT_STATE);
      return saved ? JSON.parse(saved) : { currentChatId: null, selectedAgentForChat: null };
    } catch (error) {
      console.error('채팅 상태 복구 실패:', error);
      return { currentChatId: null, selectedAgentForChat: null };
    }
  }, []);

  // 🚀 localStorage에서 즉시 캐시된 데이터 로드 (useMemo로 최적화)
  const initialHistory = useMemo((): ChatHistory[] => {
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
          return parsedHistory;
        }
      }
    } catch (error) {
      console.error('캐시 로드 실패:', error);
    }
    return [];
  }, []);
  
  const initialAgents = useMemo((): Agent[] => {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.AGENTS);
      const timestamp = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < CACHE_DURATION) {
          return JSON.parse(cached);
        }
      }
    } catch (error) {
      console.error('캐시 로드 실패:', error);
    }
    return [];
  }, []);

  // 상태 정의
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>(initialHistory);
  const [currentChatId, setCurrentChatId] = useState<string | null>(initialChatState.currentChatId);
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedAgentForChat, setSelectedAgentForChat] = useState<Agent | null>(initialChatState.selectedAgentForChat);
  const [showHistory, setShowHistory] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'agents'>('history');
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0, currentTitle: '' });
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
    } catch (error) {
      console.error('캐시 저장 실패:', error);
    }
  };
  
  const saveAgentsToCache = (agentList: Agent[]) => {
    try {
      localStorage.setItem(CACHE_KEYS.AGENTS, JSON.stringify(agentList));
      localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
    } catch (error) {
      console.error('캐시 저장 실패:', error);
    }
  };

  // 🚀 현재 채팅 상태 저장
  const saveChatState = (chatId: string | null, agent: Agent | null) => {
    try {
      localStorage.setItem(CACHE_KEYS.CURRENT_CHAT_STATE, JSON.stringify({
        currentChatId: chatId,
        selectedAgentForChat: agent
      }));
    } catch (error) {
      console.error('채팅 상태 저장 실패:', error);
    }
  };
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 스크롤 유틸리티
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 전체 채팅 삭제 시작 (다이얼로그 표시)
  const deleteAllChats = () => {
    
    // 일반 채팅만 삭제 (북마크된 채팅은 제외)
    const nonBookmarkedChats = chatHistory.filter(chat => !chat.isBookmarked);
    
    if (nonBookmarkedChats.length === 0) {
      return;
    }
    
    // 전체 삭제용 다이얼로그 표시
    setDeleteConfirmModal({
      isOpen: true,
      chatId: 'ALL_CHATS', // 전체 삭제를 나타내는 특별한 ID
      chatTitle: `${nonBookmarkedChats.length}개의 모든 채팅`
    });
  };

  // 실제 전체 채팅 삭제 실행
  const executeDeleteAllChats = async () => {
    setIsDeletingAll(true);
    
    try {
      // 일반 채팅만 삭제 (북마크된 채팅은 제외)
      const nonBookmarkedChats = chatHistory.filter(chat => !chat.isBookmarked);
      
      console.log(`🗑️ ${nonBookmarkedChats.length}개의 채팅 삭제 시작...`);
      
      // 진행률 초기화
      setDeleteProgress({ current: 0, total: nonBookmarkedChats.length, currentTitle: '' });
      
      // 성공적으로 삭제된 채팅 ID 추적
      const successfullyDeletedIds = new Set<string>();
      
      // 각 채팅 삭제 API 호출
      for (let i = 0; i < nonBookmarkedChats.length; i++) {
        const chat = nonBookmarkedChats[i];
        
        // 현재 진행 상황 업데이트
        setDeleteProgress({ 
          current: i, 
          total: nonBookmarkedChats.length, 
          currentTitle: chat.title 
        });
        
        try {
          console.log(`🗑️ 삭제 중... (${i + 1}/${nonBookmarkedChats.length}): ${chat.title}`);
          
          // 실제 DB에서 채팅 삭제
          const deleteResponse = await supabaseApiService.aiChat.deleteChatHistory(chat.id);
          console.log(`✅ 삭제 API 응답:`, {
            chatId: chat.id,
            chatTitle: chat.title,
            response: deleteResponse,
            status: 'success'
          });
          
          // 성공적으로 삭제된 채팅 ID 기록
          successfullyDeletedIds.add(chat.id);
          
          // 완료 진행률 업데이트
          setDeleteProgress({ 
            current: i + 1, 
            total: nonBookmarkedChats.length, 
            currentTitle: chat.title 
          });
          
          // 약간의 지연을 추가하여 시각적 피드백 제공
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (apiError: any) {
          console.error(`❌ API 삭제 실패 - 채팅 ID: ${chat.id}`, {
            chatId: chat.id,
            chatTitle: chat.title,
            error: apiError,
            errorMessage: apiError?.message,
            errorResponse: apiError?.response?.data,
            errorStatus: apiError?.response?.status
          });
          
          // 삭제 실패한 채팅은 successfullyDeletedIds에 추가하지 않음
          // 이렇게 하면 실패한 채팅은 UI에서 계속 보임
        }
      }
      
      // 실제로 성공적으로 삭제된 채팅만 상태에서 제거
      const updatedHistory = chatHistory.filter(chat => 
        chat.isBookmarked || !successfullyDeletedIds.has(chat.id)
      );
      
      console.log(`📊 삭제 결과:`, {
        totalAttempted: nonBookmarkedChats.length,
        successfullyDeleted: successfullyDeletedIds.size,
        failed: nonBookmarkedChats.length - successfullyDeletedIds.size,
        successfulIds: Array.from(successfullyDeletedIds)
      });
      setChatHistory(updatedHistory);
      
      // 캐시 업데이트
      saveChatHistoryToCache(updatedHistory);
      
      // 현재 선택된 채팅이 삭제된 경우 초기화
      const currentChat = chatHistory.find(chat => chat.id === currentChatId);
      if (currentChat && !currentChat.isBookmarked) {
        setCurrentChatId(null);
        setMessages([]);
      }
      
      console.log('✅ 전체 채팅 삭제 완료');
      
      // 모달 자동 닫기
      setDeleteConfirmModal({ isOpen: false, chatTitle: '', chatId: null });
      
    } catch (error) {
      console.error('❌ 전체 채팅 삭제 실패:', error);
    } finally {
      setIsDeletingAll(false);
      setDeleteProgress({ current: 0, total: 0, currentTitle: '' });
    }
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

  // 🚀 데이터 로딩 최적화 - 강제 새로고침 옵션 추가
  const loadData = async (forceRefresh = false) => {
    // 강제 새로고침이 아니고 이미 로딩 중이거나 로드 완료된 경우 중복 호출 방지
    if (!forceRefresh && (isLoadingData || isDataLoaded)) {
      return;
    }
    
    // 🚀 강제 새로고침이 아니고 캐시가 있으면 API 호출 생략
    const hasCachedHistory = chatHistory.length > 0;
    const hasCachedAgents = agents.length > 0;
    
    if (!forceRefresh && hasCachedHistory && hasCachedAgents) {
      setIsDataLoaded(true);
      setLoadingChats(false);
      
      // currentChatId가 없으면 첫 번째 채팅으로 설정
      if (!currentChatId && chatHistory.length > 0) {
        setCurrentChatId(chatHistory[0].id);
      }
      return;
    }
    
    // 강제 새로고침 시 캐시 무효화
    if (forceRefresh) {
      setIsDataLoaded(false);
    }
    
    try {
      setIsLoadingData(true);
      setLoadingChats(true);
      
      // 병렬 API 호출 (에이전트, 채팅 히스토리)
      const [agentsResult, chatsResult] = await Promise.allSettled([
        supabaseApiService.aiChat.getAgents(),
        supabaseApiService.aiChat.getChatHistories({ limit: 50 })
      ]);

      // 채팅 히스토리 처리
      if (chatsResult.status === 'fulfilled') {
        const response = chatsResult.value;
        
        console.log('🔍 useChat - 채팅 히스토리 응답 분석:', {
          responseType: typeof response,
          hasSuccess: 'success' in response,
          hasData: 'data' in response,
          isArray: Array.isArray(response),
          responseStructure: response,
          keys: Object.keys(response || {})
        });
        
        // API 응답 구조 다양성 처리
        let histories = [];
        if (response.success && Array.isArray(response.data)) {
          histories = response.data;
          console.log('📝 Case 1: response.success && Array.isArray(response.data)', histories.length);
        } else if (Array.isArray(response.data)) {
          histories = response.data;
          console.log('📝 Case 2: Array.isArray(response.data)', histories.length);
        } else if (Array.isArray(response)) {
          histories = response;
          console.log('📝 Case 3: Array.isArray(response)', histories.length);
        } else {
          console.warn('⚠️ 예상치 못한 API 응답 구조:', response);
          histories = [];
        }
        
        // 배포용: 과도한 히스토리 로깅 제거
        
        if (Array.isArray(histories) && histories.length > 0) {
          console.log('✅ 히스토리 배열 처리 시작:', histories.length, '개');
          
          const formattedHistories = histories.map((history: any) => {
            // ID 형식 통일 (chat_ 접두사 추가)
            const formattedId = history.id?.toString().startsWith('chat_') 
              ? history.id 
              : `chat_${history.id}`;
              
            return {
              id: formattedId,
              title: history.title || '새 대화',
              timestamp: new Date(history.timestamp || history.created_at || history.updated_at || Date.now()),
              messageCount: history.message_count || history.messageCount || 0,
              isBookmarked: history.is_bookmarked || history.isBookmarked || false
            };
          });
          
          // 날짜순으로 정렬 (리좌트 순)
          formattedHistories.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          console.log('🎯 최종 설정할 채팅 히스토리:', {
            count: formattedHistories.length,
            first3: formattedHistories.slice(0, 3),
            allTitles: formattedHistories.map(h => h.title)
          });
          setChatHistory(formattedHistories);
          saveChatHistoryToCache(formattedHistories); // 🚀 캐시 저장
          
          // 항상 새 대화 상태로 시작 (자동 선택 비활성화)
        } else {
          console.warn('⚠️ 채팅 히스토리가 비어있거나 배열이 아님:', {
            historiesType: typeof histories,
            historiesLength: Array.isArray(histories) ? histories.length : 'N/A',
            histories
          });
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
      }

      // 에이전트 처리 (기존 커밋과 동일한 로직)
      if (agentsResult.status === 'fulfilled') {
        const response = agentsResult.value;
        
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
        } else {
          console.warn('⚠️ AIChat - 에이전트 목록이 비어있음');
          setAgents([]);
        }
      } else {
        console.warn('❌ AIChat - 에이전트 로딩 실패, Mock 데이터 사용');
        const mockAgents: Agent[] = [
          { id: 'default', name: '기본 AI 도우미', category: '일반', description: '일반적인 질문과 교회 업무를 도와드립니다.', isActive: true }, // 기본 에이전트
          { id: 1, name: '교인정보 에이전트', category: '교인 관리', description: '교인 등록, 출석 관리, 연락처 관리 등을 도와드립니다.', isActive: true },
          { id: 2, name: '예배 안내 에이전트', category: '예배 정보', description: '주일예배, 특별예배 시간과 장소를 안내해드립니다.', isActive: true },
          { id: 3, name: '공지사항 에이전트', category: '정보 전달', description: '교회 소식과 중요한 공지사항을 전달해드립니다.', isActive: true },
          { id: 4, name: '상담 에이전트', category: '목회 상담', description: '신앙 상담과 개인적인 고민을 함께 나눌 수 있습니다.', isActive: true }
        ];
        setAgents(mockAgents);
      }
      
      // ✅ 데이터 로딩 완료 표시
      setIsDataLoaded(true);
      
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
      // 자동 선택 비활성화
      
      const mockAgents: Agent[] = [
        { id: 'default', name: '기본 AI 도우미', category: '일반', description: '일반적인 질문과 교회 업무를 도와드립니다.', isActive: true }, // 기본 에이전트
        { id: 1, name: '교인정보 에이전트', category: '교인 관리', description: '교인 등록, 출석 관리, 연락처 관리 등을 도와드립니다.', isActive: true },
        { id: 2, name: '예배 안내 에이전트', category: '예배 정보', description: '주일예배, 특별예배 시간과 장소를 안내해드립니다.', isActive: true }
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
      // TODO: Implement message retrieval from Supabase
      const response = { data: [] }; // Temporary fallback
      const messageList = response.data || response;
      const formattedMessages = Array.isArray(messageList) ? messageList.map((message: any) => ({
        ...message,
        timestamp: new Date(message.timestamp || message.created_at)
      })) : [];
      
      // 🛡️ 서버 응답이 비어있고 이미 로컬 메시지가 있다면 기존 메시지 유지
      if (formattedMessages.length === 0 && messages.length > 0) {
        console.warn('🔄 서버 응답이 비어있지만 로컬 메시지 유지:', messages.length, '개');
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
      
      // 404 오류인 경우 (히스토리가 아직 생성되지 않은 경우) 빈 메시지로 시작
      if ((error as any)?.response?.status === 404) {
        console.warn('🔄 히스토리가 아직 생성되지 않음, 빈 메시지로 시작');
        setMessages([]);
        return;
      }
      
      // 로컬 스토리지에서 메시지 복구 시도
      try {
        const localKey = `chat_messages_${currentChatId}`;
        const localData = localStorage.getItem(localKey);
        
        if (localData) {
          const localMessages = JSON.parse(localData);
          if (Array.isArray(localMessages) && localMessages.length > 0) {
            const formattedLocalMessages = localMessages.map((msg: any) => ({
              id: msg.id || `msg-${Date.now()}`,
              content: msg.content,
              role: msg.role,
              timestamp: new Date(msg.created_at || msg.timestamp || Date.now()),
              tokensUsed: msg.tokens_used || msg.tokensUsed
            }));
            setMessages(formattedLocalMessages);
            
            // 캐시에도 저장
            setMessageCache(prev => ({
              ...prev,
              [currentChatId]: formattedLocalMessages
            }));
            return;
          }
        }
      } catch (localError) {
        console.warn('⚠️ 로컬 스토리지 복구 실패:', localError);
      }
      
      // 🛡️ 에러 발생 시에도 기존 메시지가 있다면 유지
      if (messages.length === 0) {
        setMessages([]);
      }
    }
  };

  // useEffect: currentChatId와 selectedAgentForChat 변경 시 상태 저장
  useEffect(() => {
    saveChatState(currentChatId, selectedAgentForChat);
  }, [currentChatId, selectedAgentForChat]);

  // useEffect: 컴포넌트 마운트 시 데이터 자동 로드
  useEffect(() => {
    // 캐시된 데이터가 있으면 강제 새로고침하지 않음
    const hasCache = initialHistory.length > 0 && initialAgents.length > 0;
    loadData(!hasCache);
  }, []); // 빈 의존성 배열로 마운트 시에만 실행

  // useEffect: currentChatId 변경 시 메시지 로드 (첫 메시지 전송 중이 아닐 때만)
  useEffect(() => {
    if (currentChatId && !messageCache[currentChatId] && !isLoading) {
      loadMessages();
    }
  }, [currentChatId, isLoading]);

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
    isDeletingAll,
    deleteProgress,
    isDataLoaded,
    isLoadingData,
    
    // Refs
    messagesEndRef,
    dropdownRef,
    
    // 함수들
    scrollToBottom,
    getMockAIResponse,
    loadData,
    loadMessages,
    deleteAllChats,
    executeDeleteAllChats
  };
};
