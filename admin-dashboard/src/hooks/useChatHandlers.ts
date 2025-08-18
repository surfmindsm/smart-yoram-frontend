import { Dispatch, SetStateAction, KeyboardEvent } from 'react';
import { ChatMessage, ChatHistory, Agent } from '../types/chat';
import { saveMessageViaMCP, queryDatabaseViaMCP } from '../utils/mcpUtils';
import { getAIResponse } from '../services/agentService';

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
    // messageCache는 실제로 사용됨 (캐시 업데이트에서)
    messageCache, // eslint-disable-line @typescript-eslint/no-unused-vars
    setMessageCache,
    editingChatId,
    setEditingChatId,
    editingTitle,
    setEditingTitle,
    setOpenMenuId,
    setDeleteConfirmModal,
    // getMockAIResponse는 MCP 시스템에서 사용하지 않음
    getMockAIResponse, // eslint-disable-line @typescript-eslint/no-unused-vars
    scrollToBottom,
    loadData
  } = props;

  // 🚀 MCP 기반 스마트 메시지 전송 핸들러
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
          title: selectedAgentForChat ? `${selectedAgentForChat.name}와의 대화` : '새 대화',
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

      // 🚀 모든 에이전트가 MCP를 통해 실제 데이터베이스 조회
      try {
        console.log('🚀 MCP 기반 스마트 에이전트 처리:', selectedAgentForChat?.name);
        
        // 1. 사용자 질문을 분석해서 관련 데이터베이스 조회
        const dbResult = await queryDatabaseViaMCP(userMessage.content);
        
        console.log('📊 DB 조회 결과:', dbResult);
        
        let aiResponse: ChatMessage;
        
        // 2. 조회된 실제 데이터를 컨텍스트로 GPT API 호출
        if (dbResult.success && dbResult.data.length > 0) {
          console.log('✅ 실제 데이터로 GPT API 호출');
          
          const contextData = {
            query: userMessage.content,
            database_results: dbResult.data,
            agent_info: {
              name: selectedAgentForChat?.name || '스마트 교회 에이전트',
              description: selectedAgentForChat?.description || '교회 데이터를 활용한 맞춤형 서비스'
            },
            data_summary: {
              total_records: dbResult.data.length,
              query_analysis: `사용자가 "${userMessage.content}"에 대해 질문했습니다.`
            }
          };
          
          // getAIResponse는 ChatMessage 객체를 반환함
          aiResponse = await getAIResponse(
            effectiveChatId || `temp_${Date.now()}`,
            selectedAgentForChat,
            userMessage.content,
            messages
          );
        } else if (dbResult.error) {
          console.log('⚠️ DB 조회 실패, 에러 메시지와 함께 응답');
          
          aiResponse = {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: `죄송합니다. 요청하신 정보를 조회하는 중 문제가 발생했습니다.\n\n**오류 내용:** ${dbResult.error}\n\n다시 시도해 주시거나, 다른 방식으로 질문해 주세요.`,
            timestamp: new Date()
          };
        } else {
          console.log('📭 조회된 데이터가 없음, 일반 응답');
          
          const contextData = {
            query: userMessage.content,
            message: '요청하신 조건에 맞는 데이터를 찾을 수 없습니다.',
            agent_info: {
              name: selectedAgentForChat?.name || '스마트 교회 에이전트',
              description: selectedAgentForChat?.description || '교회 데이터를 활용한 맞춤형 서비스'
            }
          };
          
          // getAIResponse는 ChatMessage 객체를 반환함
          aiResponse = await getAIResponse(
            effectiveChatId || `temp_${Date.now()}`,
            selectedAgentForChat,
            userMessage.content,
            messages
          );
        }

        // AI 응답을 메시지에 추가
        const finalMessages = [...updatedMessages, aiResponse];
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
          await saveMessageViaMCP(effectiveChatId, aiResponse.content, 'assistant');
        }

        scrollToBottom();

      } catch (aiError) {
        console.error('❌ MCP 스마트 에이전트 처리 실패:', aiError);
        
        // 에러 발생 시 사용자에게 친화적인 메시지 제공
        const errorResponse: ChatMessage = {
          id: `ai_error_${Date.now()}`,
          role: 'assistant',
          content: `죄송합니다. 현재 시스템에 일시적인 문제가 발생했습니다.\n\n**문제 상황:** 데이터베이스 연결 또는 AI 처리 과정에서 오류\n**해결 방법:** 잠시 후 다시 시도해 주세요\n\n문제가 지속되면 관리자에게 문의해 주세요.`,
          timestamp: new Date()
        };
        
        const finalMessages = [...updatedMessages, errorResponse];
        setMessages(finalMessages);

        // 캐시 업데이트
        if (effectiveChatId) {
          setMessageCache(prev => ({
            ...prev,
            [effectiveChatId as string]: finalMessages
          }));
        }

        // MCP를 통한 에러 응답 저장
        if (effectiveChatId) {
          await saveMessageViaMCP(effectiveChatId, errorResponse.content, 'assistant');
        }

        scrollToBottom();
      }

    } catch (error) {
      console.error('❌ 메시지 전송 실패:', error);
      
      // 전체 프로세스 실패 시 사용자에게 알림
      const systemErrorResponse: ChatMessage = {
        id: `system_error_${Date.now()}`,
        role: 'assistant',
        content: `시스템 오류가 발생했습니다. 네트워크 연결을 확인하고 다시 시도해 주세요.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, systemErrorResponse]);
      scrollToBottom();
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

  // 삭제 확인 (개별 채팅만 처리)
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
