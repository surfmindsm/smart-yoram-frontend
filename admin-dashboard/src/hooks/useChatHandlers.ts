import { useState, useRef, Dispatch, SetStateAction, KeyboardEvent } from 'react';
import { ChatMessage, ChatHistory, Agent } from '../types/chat';
import { saveMessageViaMCP } from '../utils/mcpUtils';

interface UseChatHandlersProps {
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
  currentChatId: string | null;
  setCurrentChatId: Dispatch<SetStateAction<string | null>>;
  selectedAgentForChat: Agent | null;
  setSelectedAgentForChat: Dispatch<SetStateAction<Agent | null>>;
  chatHistory: ChatHistory[];
  setChatHistory: Dispatch<SetStateAction<ChatHistory[]>>;
  setActiveTab: Dispatch<SetStateAction<'history' | 'agents'>>;
  setSelectedAgent: Dispatch<SetStateAction<Agent | null>>;
  messageCache: Record<string, ChatMessage[]>;
  setMessageCache: Dispatch<SetStateAction<Record<string, ChatMessage[]>>>;
  editingChatId: string | null;
  setEditingChatId: Dispatch<SetStateAction<string | null>>;
  editingTitle: string;
  setEditingTitle: Dispatch<SetStateAction<string>>;
  setOpenMenuId: Dispatch<SetStateAction<string | null>>;
  setDeleteConfirmModal: Dispatch<SetStateAction<{ isOpen: boolean; chatTitle: string; chatId: string | null }>>;
  getMockAIResponse: (input: string) => ChatMessage;
  scrollToBottom: () => void;
  loadData: () => Promise<void>;
}

export function useChatHandlers(props: UseChatHandlersProps) {
  const {
    messages,
    setMessages,
    setIsLoading,
    inputValue,
    setInputValue,
    currentChatId,
    setCurrentChatId,
    selectedAgentForChat,
    setSelectedAgentForChat,
    chatHistory,
    setChatHistory,
    setActiveTab,
    setSelectedAgent,
    messageCache,
    setMessageCache,
    editingChatId,
    setEditingChatId,
    editingTitle,
    setEditingTitle,
    setOpenMenuId,
    setDeleteConfirmModal,
    getMockAIResponse,
    scrollToBottom,
    loadData
  } = props;

  // 메시지 전송 핸들러
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    setIsLoading(true);
    
    try {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: inputValue.trim(),
        timestamp: new Date()
      };

      // 사용자 메시지 즉시 표시
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInputValue('');

      // 새 채팅이거나 채팅 ID가 없는 경우 새로 생성
      let effectiveChatId = currentChatId;
      if (!effectiveChatId) {
        effectiveChatId = `chat_${Date.now()}`;
        setCurrentChatId(effectiveChatId);

        const newChatHistory: ChatHistory = {
          id: effectiveChatId,
          title: '새 대화',
          timestamp: new Date(),
          messageCount: 0,
          isBookmarked: false
        };

        setChatHistory(prev => [newChatHistory, ...prev]);
      }

      // 메시지를 캐시에 저장
      if (effectiveChatId) {
        setMessageCache(prev => ({
          ...prev,
          [effectiveChatId as string]: updatedMessages
        }));
      }

      // MCP를 통한 사용자 메시지 저장
      if (effectiveChatId) {
        await saveMessageViaMCP(effectiveChatId, userMessage.content, 'user');
      }

      // AI 응답 생성 (기존 커밋과 동일)
      const mockResponse = getMockAIResponse(userMessage.content);
      const aiMessage: ChatMessage = mockResponse;

      // 메시지 목록 업데이트
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // 캐시 업데이트
      if (effectiveChatId) {
        setMessageCache(prev => ({
          ...prev,
          [effectiveChatId as string]: finalMessages
        }));
      }

      // MCP를 통한 AI 응답 저장
      if (effectiveChatId) {
        await saveMessageViaMCP(effectiveChatId, aiMessage.content, 'assistant');
      }

      scrollToBottom();
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 새 채팅 시작
  const handleNewChat = async () => {
    setMessages([]);
    setCurrentChatId(null);
    setSelectedAgentForChat(null);
    setInputValue('');
    
    // 데이터 다시 로드
    await loadData();
    
    // 에이전트 탭으로 전환
    setActiveTab('agents');
    setSelectedAgent(null);
  };

  // 에이전트와 채팅 시작
  const handleStartAgentChat = async (agent: Agent) => {
    setSelectedAgentForChat(agent);
    setSelectedAgent(agent);
    setMessages([]);
    setCurrentChatId(null);
    setActiveTab('history');
    
    // 자동으로 첫 메시지 전송
    // await handleSendMessage();
  };

  // 채팅 삭제
  const handleDeleteChat = async (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    setDeleteConfirmModal({
      isOpen: true,
      chatTitle: chat?.title || '대화',
      chatId: chatId || null
    });
  };

  // 삭제 확인
  const handleDeleteConfirmModal = async () => {
    const chatId = chatHistory[0]?.id; // 임시로 첫 번째 채팅 ID 사용
    if (chatId) {
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
      
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
        setSelectedAgentForChat(null);
      }

      // 캐시에서도 제거
      setMessageCache(prev => {
        const newCache = { ...prev };
        delete newCache[chatId];
        return newCache;
      });
    }
    
    setDeleteConfirmModal({ isOpen: false, chatTitle: '', chatId: null });
  };

  // 북마크 토글
  const handleToggleBookmark = async (chatId: string, currentBookmarkState: boolean) => {
    try {
      setChatHistory(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, isBookmarked: !currentBookmarkState }
          : chat
      ));
    } catch (error) {
      console.error('북마크 업데이트 실패:', error);
    }
  };

  // 제목 편집 시작
  const handleStartEditTitle = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  // 제목 저장
  const handleSaveTitle = async (chatId: string) => {
    if (!editingTitle.trim()) return;

    try {
      setChatHistory(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, title: editingTitle.trim() }
          : chat
      ));

      setEditingChatId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('제목 업데이트 실패:', error);
    }
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  // 메뉴 토글
  const handleToggleMenu = (chatId: string) => {
    setOpenMenuId(prev => prev === chatId ? null : chatId);
  };

  // 외부 클릭으로 메뉴 닫기
  const handleClickOutside = () => {
    setOpenMenuId(null);
  };

  // 키보드 이벤트 핸들러
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return {
    handleSendMessage,
    handleNewChat,
    handleStartAgentChat,
    handleKeyPress,
    handleDeleteChat,
    handleToggleBookmark,
    handleStartEditTitle,
    handleSaveTitle,
    handleCancelEdit,
    handleToggleMenu,
    handleClickOutside,
    handleDeleteConfirmModal
  };
}
