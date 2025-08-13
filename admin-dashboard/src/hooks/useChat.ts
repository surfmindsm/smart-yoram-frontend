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

  // Mock AI 응답 생성
  const getMockAIResponse = async (userInput: string): Promise<string> => {
    const responses = [
      "안녕하세요! 어떻게 도와드릴까요?",
      "네, 알겠습니다. 더 자세히 설명해 주시겠어요?",
      "좋은 질문이네요. 이에 대해 설명드리겠습니다.",
      "교회 관련 정보를 찾아드리겠습니다.",
      "더 필요한 정보가 있으시면 언제든지 말씀해 주세요."
    ];
    
    // 실제 AI 응답처럼 약간의 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoadingChats(true);
      setError(null);
      
      const [chatHistoryRes, agentsRes] = await Promise.all([
        chatService.getChatHistories(),
        agentService.getAgents()
      ]);

      if (chatHistoryRes.success && chatHistoryRes.data) {
        const sortedHistory = chatHistoryRes.data.sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setChatHistory(sortedHistory);
        
        if (sortedHistory.length > 0 && !currentChatId) {
          setCurrentChatId(sortedHistory[0].id);
        }
      }

      if (agentsRes.success && agentsRes.data) {
        const activeAgents = agentsRes.data.filter((agent: Agent) => agent.isActive);
        setAgents(activeAgents);
      }
    } catch (err) {
      console.error('데이터 로딩 실패:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoadingChats(false);
    }
  };

  // 메시지 로드
  const loadMessages = async () => {
    if (!currentChatId) {
      setMessages([]);
      return;
    }

    if (messageCache[currentChatId]) {
      setMessages(messageCache[currentChatId]);
      setTimeout(scrollToBottom, 100);
      return;
    }

    try {
      const cachedMessages = await loadMessagesViaMCP(currentChatId, messages);
      setMessages(cachedMessages);
      setMessageCache(prev => ({ ...prev, [currentChatId]: cachedMessages }));
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('메시지 로딩 실패:', error);
      setMessages([]);
    }
  };

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
