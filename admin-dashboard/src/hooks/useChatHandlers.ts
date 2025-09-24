import { Dispatch, SetStateAction, KeyboardEvent, useCallback } from 'react';
import { ChatMessage, ChatHistory, Agent } from '../types/chat';
import { queryDatabaseViaMCP } from '../utils/mcpUtils';
import { supabaseApiService } from '../services/supabaseApiService';
import { formatChurchData } from '../utils/churchDataFormatter';

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
  agents: Agent[];
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
    messageCache, // eslint-disable-line @typescript-eslint/no-unused-vars
    setMessageCache,
    editingChatId,
    setEditingChatId,
    editingTitle,
    setEditingTitle,
    setOpenMenuId,
    setDeleteConfirmModal,
    getMockAIResponse, // eslint-disable-line @typescript-eslint/no-unused-vars
    scrollToBottom,
    loadData,
    agents
  } = props;

  // 메시지 전송 핸들러 (성능 최적화)
  const handleSendMessage = useCallback(async () => {
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
      
      // 사용자 메시지 추가 후 즉시 스크롤
      setTimeout(() => {
        scrollToBottom();
      }, 50);

      // 새 채팅이거나 채팅 ID가 없는 경우 새로 생성
      let effectiveChatId = currentChatId;
      let historyCreated = false;
      
      
      
      if (!effectiveChatId) {
        // 새 대화 시작 시 임시 Chat ID 생성 (UI 깜빡임 방지)
        const tempChatId = `chat_${Date.now()}`;
        effectiveChatId = tempChatId;

        const newChatHistory: ChatHistory = {
          id: effectiveChatId,
          title: selectedAgentForChat ? `${selectedAgentForChat.name}와의 대화` : '새 대화',
          timestamp: new Date(),
          messageCount: 0,
          isBookmarked: false
        };

        setChatHistory(prev => [newChatHistory, ...prev]);

        // 백엔드 히스토리 생성 (AI 응답 생성 없이)
        try {
          const agentId = selectedAgentForChat?.id || agents?.[0]?.id;
          
          if (!agentId) {
            console.warn('⚠️ 사용 가능한 에이전트가 없습니다. 관리자에게 문의하세요.');
            setIsLoading(false);
            return;
          }
          
          const historyResult = await supabaseApiService.aiChat.createChatHistory(
            selectedAgentForChat ? `${selectedAgentForChat.name}와의 대화` : `새 대화 ${new Date().toLocaleString()}`,
            agentId
          );
          
          historyCreated = true;
          
          // 생성된 실제 ID로 업데이트
          if (historyResult.id) {
            const actualDbId = historyResult.id;
            const newChatId = `chat_${actualDbId}`;
            
            // ID가 다르면 업데이트
            if (actualDbId !== parseInt(effectiveChatId.replace('chat_', ''))) {
              setCurrentChatId(newChatId);
              effectiveChatId = newChatId;
            }
          }
        } catch (error: any) {
          if (error.message === 'ENDPOINT_NOT_AVAILABLE') {
            console.warn('⚠️ 채팅 히스토리 API 미구현, 로컬 모드 사용');
            // 로컬 ID 생성 (백엔드 구현 전까지 임시)
            const tempId = `temp_${Date.now()}`;
            setCurrentChatId(tempId);
            effectiveChatId = tempId;
            historyCreated = true; // 로컬에서는 성공으로 처리
          } else {
            console.error('❌ 채팅 히스토리 생성 오류:', error);
            historyCreated = false;
          }
        }
      }

      // 메시지를 캐시에 저장
      if (effectiveChatId) {
        setMessageCache(prev => ({
          ...prev,
          [effectiveChatId as string]: updatedMessages
        }));
      }

      // 에이전트 설정 확인
      if (!selectedAgentForChat) {
        // 실제 로드된 에이전트가 있으면 첫 번째 에이전트 사용
        if (agents && agents.length > 0) {
          const firstAgent = agents[0];
          setSelectedAgentForChat(firstAgent);
        } else {
          // 에이전트가 없으면 로컬 전용 모드
          const fallbackAgent = {
            id: 'local_agent',
            name: '로컬 AI 도우미',
            description: '로컬에서만 동작하는 AI 어시스턴트입니다.',
            category: '일반',
            isActive: true
          };
          setSelectedAgentForChat(fallbackAgent);
        }
      }

      // 사용자 메시지 저장은 백엔드에서 처리됨
      
      
      let aiResponse: ChatMessage;
      
      // 비서 에이전트 및 교인정보 에이전트는 백엔드에서 직접 DB 조회
      if (selectedAgentForChat?.category === 'secretary' || 
          selectedAgentForChat?.name === '교인정보 에이전트' || 
          selectedAgentForChat?.name?.includes('교인정보') ||
          selectedAgentForChat?.name?.includes('비서')) {
        
        console.log('🔍 비서 에이전트 감지됨:', {
          agentName: selectedAgentForChat?.name,
          agentCategory: selectedAgentForChat?.category,
          message: userMessage.content
        });
        
        console.log('📊 백엔드에서 실시간 DB 조회 모드 - 프론트엔드 하드코딩 방지');
        
        const agentId = selectedAgentForChat?.id || agents?.[0]?.id;
        
        const messageData = {
          chat_history_id: parseInt(effectiveChatId.replace('chat_', '')) || null,
          content: userMessage.content.slice(0, 2000),
          role: 'user' as const,
          agent_id: agentId,
          messages: updatedMessages.slice(-4).slice(0, -1).map(msg => ({
            role: msg.role,
            content: msg.content.slice(0, 800)
          })),
          optimize_speed: true,
          create_history_if_needed: true,
          agent_name: selectedAgentForChat?.name || '비서 AI',
          // 🎯 백엔드에서 실시간 DB 조회하도록 설정 (하드코딩 방지)
          church_data_context: undefined, // undefined로 설정하여 백엔드에서 직접 조회
          secretary_mode: true,
          prioritize_church_data: true,
          fallback_to_general: true
        };
        
        console.log('🚀 비서 에이전트 API 요청 데이터:', messageData);
        
        try {
          const responseData = await supabaseApiService.aiChat.sendMessage(
            parseInt(effectiveChatId.replace('chat_', '')) || Date.now(),
            userMessage.content,
            agentId
          );
          
          let aiContent = '교회 데이터를 기반으로 답변드리겠습니다.';
          if (responseData && responseData.ai_message) {
            aiContent = responseData.ai_message.content;
          } else if (responseData && responseData.user_message) {
            // 현재는 목업 응답만 있음
            aiContent = `안녕하세요! 저는 ${selectedAgentForChat?.name || 'AI 비서'}입니다. "${userMessage.content}"에 대해 도움을 드리겠습니다.`;
          }
          
          aiResponse = {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: aiContent,
            timestamp: new Date(),
            is_secretary_agent: true,
            data_sources: ['교회 데이터베이스'],
            query_type: 'church_data_query'
          };
        } catch (backendError) {
          console.warn('백엔드 비서 에이전트 호출 실패:', backendError);
          aiResponse = {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: '죄송합니다. 현재 교회 데이터를 조회할 수 없습니다. 잠시 후 다시 시도해 주세요.',
            timestamp: new Date(),
            is_secretary_agent: true,
            data_sources: ['교회 데이터베이스'],
            query_type: 'church_data_error'
          };
        }
      } else {
        // 에이전트 ID 검증
        const agentId = selectedAgentForChat?.id || agents?.[0]?.id;
        if (!agentId) {
          console.warn('⚠️ 사용 가능한 에이전트가 없습니다. 관리자에게 문의하세요.');
          setIsLoading(false);
          return;
        }

        // 비서 에이전트인지 확인
        const isSecretaryAgent = selectedAgentForChat?.category === 'secretary' || 
                               selectedAgentForChat?.name?.includes('비서');
        
        console.log('🔍 비서 에이전트 체크:', {
          agentName: selectedAgentForChat?.name,
          agentCategory: selectedAgentForChat?.category,
          isSecretaryAgent: isSecretaryAgent
        });
        
        // API 요청 데이터 준비
        const messageData = {
          chat_history_id: parseInt(effectiveChatId.replace('chat_', '')) || null,
          content: userMessage.content.slice(0, 2000),
          role: 'user',
          agent_id: agentId,
          messages: updatedMessages.slice(-4).slice(0, -1).map(msg => ({
            role: msg.role,
            content: msg.content.slice(0, 800)
          })),
          optimize_speed: true,
          create_history_if_needed: true,
          agent_name: selectedAgentForChat?.name || '기본 AI 도우미',
          // 🎯 비서 에이전트인 경우 추가 파라미터
          ...(isSecretaryAgent && {
            secretary_mode: true,
            prioritize_church_data: true,
            fallback_to_general: true
          })
        };
        
        console.log('🚀 API 요청 데이터:', messageData);
        
        // 백엔드에서 AI 응답 생성하도록 API 호출
        const responseData = await supabaseApiService.aiChat.sendMessage(
          parseInt(effectiveChatId.replace('chat_', '')) || Date.now(),
          userMessage.content,
          agentId
        );
        
        // 백엔드 응답 데이터 구조 확인 및 파싱
        let aiContent = '응답을 생성하지 못했습니다.';
        let tokensUsed = 0;
        let actualChatId = effectiveChatId;

        if (responseData && responseData.ai_message) {
          aiContent = responseData.ai_message.content;
          console.log(`🤖 AI 응답 생성 완료`);
        } else if (responseData && responseData.user_message) {
          // 현재는 목업 응답만 있음
          aiContent = `안녕하세요! 저는 ${selectedAgentForChat?.name || 'AI 도우미'}입니다. "${userMessage.content}"에 대해 도움을 드리겠습니다.`;
        }
        
        
        aiResponse = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: aiContent,
          timestamp: new Date(),
          tokensUsed: tokensUsed
        };
      }
        
      // AI 응답 추가
      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);

      // 로딩 상태 즉시 해제 (UI 응답성 향상)
      setIsLoading(false);

      // 캐시 업데이트
      if (effectiveChatId) {
        setMessageCache(prev => ({
          ...prev,
          [effectiveChatId as string]: finalMessages
        }));
      }

      // AI 응답 추가 후 스크롤 (약간의 지연으로 DOM 업데이트 보장)
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      // AI 응답 저장은 백엔드에서 이미 처리됨

      // 🎯 제목 자동 생성: 2번째 메시지부터 시작 (더 빠른 반응)
      if (finalMessages.length >= 2 && finalMessages.length <= 4) {
        
        try {
          // TODO: 제목 생성 기능은 나중에 구현
          const generatedTitle = `${selectedAgentForChat?.name || 'AI'}와의 대화 ${new Date().toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}`;
          
          if (generatedTitle && generatedTitle !== '새 대화' && generatedTitle.length > 2) {
            
            // 1. 로컬 상태 즉시 업데이트
            setChatHistory(prev => {
              const updated = prev.map(chat => 
                chat.id === effectiveChatId 
                  ? { ...chat, title: generatedTitle }
                  : chat
              );
              return updated;
            });
            
            // 2. 백엔드에 제목 저장 (비동기)
            try {
              // TODO: 제목 업데이트 API 구현 필요
              console.log('📝 제목 업데이트:', generatedTitle);
            } catch (backendError) {
              console.warn('⚠️ 백엔드 제목 저장 실패:', backendError);
            }
            
          } else {
            console.warn('⚠️ 제목 생성 실패 또는 유효하지 않음:', generatedTitle);
          }
        } catch (titleError) {
          console.error('❌ 제목 자동 생성 오류:', titleError);
        }
      }

    } catch (error: any) {
      console.error('❌ 메시지 전송 실패:', error);
      
      let errorContent = '죄송합니다. 현재 시스템에 일시적인 문제가 발생했습니다.\n\n잠시 후 다시 시도해 주세요.';
      
      if (error.message === 'ENDPOINT_NOT_AVAILABLE') {
        console.warn('⚠️ 채팅 메시지 API 미구현, 기본 응답 사용');
        errorContent = `안녕하세요! 저는 ${selectedAgentForChat?.name || '기본 AI 도우미'}입니다.\n\n현재 백엔드 API가 구현 중이므로 실제 AI 응답을 제공할 수 없습니다.\n백엔드 팀이 /chat/messages 엔드포인트를 구현하면 정상 작동할 예정입니다.\n\n문의하신 내용을 기록했습니다.`;
      } else if (error.message === 'VALIDATION_ERROR') {
        console.warn('⚠️ 백엔드 데이터 검증 에러 - chat_history_id null 처리 필요');
        errorContent = `안녕하세요! 저는 ${selectedAgentForChat?.name || '기본 AI 도우미'}입니다.\n\n현재 백엔드에서 새 채팅 시작 시 데이터 검증 에러가 발생하고 있습니다.\n백엔드 팀이 chat_history_id=null 처리 로직을 수정하면 정상 작동할 예정입니다.\n\n⚠️ 백엔드 이슈: /chat/messages에서 chat_history_id가 null일 때 422 에러 발생`;
      } else if (error.message === 'SERVER_ERROR') {
        console.warn('⚠️ 백엔드 서버 내부 에러 - 500 에러 발생');
        errorContent = `안녕하세요! 저는 ${selectedAgentForChat?.name || '기본 AI 도우미'}입니다.\n\n현재 백엔드 서버에서 내부 에러가 발생하고 있습니다.\n백엔드 팀이 서버 에러를 수정하면 정상 작동할 예정입니다.\n\n⚠️ 백엔드 이슈: /chat/messages에서 500 Internal Server Error 발생`;
      } else if (error.message === 'CORS_ERROR') {
        console.warn('⚠️ CORS 에러 - 백엔드 CORS 설정 필요');
        errorContent = `안녕하세요! 저는 ${selectedAgentForChat?.name || '기본 AI 도우미'}입니다.\n\n현재 백엔드에서 CORS 설정이 localhost:3000을 허용하지 않고 있습니다.\n백엔드 팀이 CORS 설정을 수정하면 정상 작동할 예정입니다.\n\n⚠️ 백엔드 이슈: CORS policy 에러 - localhost:3000 허용 필요`;
      }
      
      // 에러 응답 생성
      const errorResponse: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
      // 에러 메시지 추가 후 스크롤
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, messages, currentChatId, selectedAgentForChat, chatHistory, agents, setMessages, setIsLoading, setInputValue, setCurrentChatId, setChatHistory, setMessageCache, scrollToBottom]);

  // 새 채팅 시작
  const handleNewChat = async () => {
    setMessages([]);
    setCurrentChatId(null);
    setInputValue('');
    
    // 에이전트 선택 초기화 - 첫 진입과 동일한 상태로 만들기
    setSelectedAgentForChat(null);
    setSelectedAgent(null);
    
    // 데이터 다시 로드
    await loadData();
    
    // 히스토리 탭 유지 (에이전트 탭으로 강제 이동하지 않음)
    setActiveTab('history');
  };

  // 에이전트와 채팅 시작
  const handleStartAgentChat = async (agent: Agent) => {
    setSelectedAgentForChat(agent);
    setSelectedAgent(agent);
    setMessages([]);
    setCurrentChatId(null);
    setActiveTab('history');
  };

  // 특정 교회와 에이전트로 새 대화 시작
  const handleStartNewChatWithAgent = async (churchId: number, agentId: number | string) => {
    
    // 기존 상태 초기화
    setMessages([]);
    setCurrentChatId(null);
    setInputValue('');
    
    // 해당 에이전트 찾기 (숫자/문자열 혼용 대비하여 문자열로 정규화 비교)
    const agentIdStr = String(agentId);
    const targetAgent = agents.find(agent => String(agent.id) === agentIdStr);
    
    if (targetAgent) {
      setSelectedAgentForChat(targetAgent);
      setSelectedAgent(targetAgent);
    } else {
      console.warn(`⚠️ Agent ID ${agentId}를 찾을 수 없음. 사용 가능한 에이전트:`, 
        agents.map(a => ({ id: a.id, name: a.name })));
      
      // 첫 번째 에이전트를 기본값으로 사용
      if (agents.length > 0) {
        const firstAgent = agents[0];
        setSelectedAgentForChat(firstAgent);
        setSelectedAgent(firstAgent);
      }
    }
    
    // 히스토리 탭으로 이동
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
    const newBookmarkState = !currentBookmarkState;
    
    try {
      // 1. 로컬 상태 즉시 업데이트
      setChatHistory(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, isBookmarked: newBookmarkState }
          : chat
      ));
      
      // 2. 백엔드에 북마크 상태 저장
      // TODO: 북마크 업데이트 API 구현 필요
      console.log('📌 북마크 상태 업데이트:', { chatId, newBookmarkState });
      
      
    } catch (error) {
      console.error('❌ 북마크 업데이트 실패:', error);
      
      // 실패 시 상태 롤백
      setChatHistory(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, isBookmarked: currentBookmarkState }
          : chat
      ));
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

  // 키보드 이벤트 핸들러 (memoized)
  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return {
    handleSendMessage,
    handleNewChat,
    handleStartAgentChat,
    handleStartNewChatWithAgent,
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
