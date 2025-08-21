import { Dispatch, SetStateAction, KeyboardEvent } from 'react';
import { ChatMessage, ChatHistory, Agent } from '../types/chat';
import { saveMessageViaMCP, queryDatabaseViaMCP } from '../utils/mcpUtils';
import { churchConfigService, chatService } from '../services/api';

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
      let historyCreated = false;
      
      console.log('🔍 채팅 ID 상태 확인:', { 
        currentChatId, 
        effectiveChatId, 
        needsNewHistory: !effectiveChatId,
        selectedAgentName: selectedAgentForChat?.name,
        selectedAgentId: selectedAgentForChat?.id
      });
      
      if (!effectiveChatId) {
        // 새 대화 시작 시 임시 Chat ID 생성 (UI 깜빡임 방지)
        const tempChatId = `chat_${Date.now()}`;
        console.log('🆕 임시 채팅 ID 생성:', tempChatId);
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
          const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.surfmind-team.com/api/v1';
          const agentId = selectedAgentForChat?.id || agents?.[0]?.id;
          
          console.log('📡 히스토리 생성 API 호출 (AI 응답 생성 없이):', {
            url: `${API_BASE_URL}/chat/histories`,
            agentId,
            effectiveChatId
          });

          const historyResponse = await fetch(`${API_BASE_URL}/chat/histories`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
              'X-Skip-AI-Response': 'true'  // AI 응답 생성 차단
            },
            body: JSON.stringify({
              id: parseInt(effectiveChatId.replace('chat_', '')) || Date.now(),
              agent_id: agentId,
              title: selectedAgentForChat ? `${selectedAgentForChat.name}와의 대화` : `새 대화 ${new Date().toLocaleString()}`,
              skip_ai_generation: true,  // AI 응답 생성 건너뛰기
              history_only: true         // 히스토리만 생성
            })
          });
          
          if (historyResponse.ok) {
            const historyResult = await historyResponse.json();
            console.log('✅ 채팅 히스토리 생성 성공:', historyResult);
            historyCreated = true;
            
            // 생성된 실제 ID로 업데이트
            if (historyResult.id) {
              const actualDbId = historyResult.id;
              const newChatId = `chat_${actualDbId}`;
              
              // ID가 다르면 업데이트
              if (actualDbId !== parseInt(effectiveChatId.replace('chat_', ''))) {
                setCurrentChatId(newChatId);
                effectiveChatId = newChatId;
                console.log('🔄 채팅 ID 업데이트:', effectiveChatId, '->', newChatId);
              }
            }
          } else {
            const errorText = await historyResponse.text();
            console.warn('⚠️ 채팅 히스토리 생성 실패:', errorText);
            historyCreated = false;
          }
        } catch (error) {
          console.error('❌ 채팅 히스토리 생성 오류:', error);
          historyCreated = false;
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
          console.log('✅ 로드된 첫 번째 에이전트 자동 선택:', firstAgent.name, 'ID:', firstAgent.id);
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
          console.log('⚠️ 로드된 에이전트 없음, 로컬 전용 에이전트 설정:', fallbackAgent.name);
        }
      }

      // 사용자 메시지 저장은 백엔드에서 처리됨
      console.log('📝 사용자 메시지는 백엔드 AI 응답 생성 시 함께 저장됨');

      console.log('🚀 스마트 에이전트 처리:', selectedAgentForChat?.name);
      
      let aiResponse: ChatMessage;
      
      // 교인정보 에이전트만 DB 조회 실행
      if (selectedAgentForChat?.name === '교인정보 에이전트' || selectedAgentForChat?.name?.includes('교인정보')) {
        console.log('🔍 교인정보 에이전트: DB 조회 실행');
        
        const dbResult = await queryDatabaseViaMCP(userMessage.content);
        console.log('📊 DB 조회 결과:', dbResult);
        
        if (dbResult.success && dbResult.data.length > 0) {
          console.log('✅ 실제 데이터로 응답 생성');
          aiResponse = {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: `조회된 데이터를 바탕으로 답변드리겠습니다:\n\n${JSON.stringify(dbResult.data, null, 2)}`,
            timestamp: new Date()
          };
        } else if (dbResult.error) {
          aiResponse = {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: `죄송합니다. 요청하신 정보를 조회하는 중 문제가 발생했습니다.\n\n**오류 내용:** ${dbResult.error}\n\n다시 시도해 주시거나, 다른 방식으로 질문해 주세요.`,
            timestamp: new Date()
          };
        } else {
          aiResponse = {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: '조회된 데이터가 없습니다. 다른 검색어로 시도해보세요.',
            timestamp: new Date()
          };
        }
      } else {
        // 백엔드에서 AI 응답 생성하도록 API 호출
        console.log('📡 백엔드 AI 응답 생성 API 호출');
        
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${apiUrl}/chat/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            chat_history_id: parseInt(effectiveChatId.replace('chat_', '')) || null,
            content: userMessage.content,
            role: 'user',
            agent_id: selectedAgentForChat?.id || agents?.[0]?.id,
            messages: updatedMessages.slice(0, -1).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            create_history_if_needed: true,  // 히스토리가 없으면 자동 생성
            agent_name: selectedAgentForChat?.name || '기본 AI 도우미'
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`백엔드 AI 응답 생성 실패: ${response.status} ${errorText}`);
        }

        const responseData = await response.json();
        console.log('✅ 백엔드 AI 응답 성공:', responseData);
        
        // 백엔드 응답 데이터 구조 확인 및 파싱
        let aiContent = '응답을 생성하지 못했습니다.';
        let tokensUsed = 0;
        let actualChatId = effectiveChatId;
        
        if (responseData.success && responseData.data) {
          const data = responseData.data;
          console.log('🔍 백엔드 응답 상세 데이터:', data);
          
          let rawContent = data.ai_response || data.content || data.message;
          
          // 객체인 경우 적절한 파싱 시도
          if (typeof rawContent === 'object' && rawContent !== null) {
            if (rawContent.content) {
              aiContent = rawContent.content;
            } else if (rawContent.message) {
              aiContent = rawContent.message;
            } else if (rawContent.text) {
              aiContent = rawContent.text;
            } else {
              // 최후 수단으로 JSON 문자열화
              aiContent = JSON.stringify(rawContent, null, 2);
            }
          } else if (typeof rawContent === 'string') {
            aiContent = rawContent;
          } else {
            aiContent = String(rawContent) || '응답을 생성하지 못했습니다.';
          }
          
          tokensUsed = data.tokens_used || data.tokensUsed || 0;
          
          // 백엔드에서 실제 생성된 chat_history_id 받기
          if (data.chat_history_id) {
            actualChatId = `chat_${data.chat_history_id}`;
            console.log('🔄 백엔드에서 실제 Chat ID 받음:', actualChatId);
            
            // 임시 ID와 다르면 업데이트
            if (actualChatId !== effectiveChatId) {
              setCurrentChatId(actualChatId);
              effectiveChatId = actualChatId;
            }
          }
        } else if (responseData.ai_response) {
          let rawContent = responseData.ai_response;
          if (typeof rawContent === 'object' && rawContent !== null) {
            aiContent = rawContent.content || rawContent.message || rawContent.text || JSON.stringify(rawContent, null, 2);
          } else {
            aiContent = typeof rawContent === 'string' ? rawContent : String(rawContent);
          }
          tokensUsed = responseData.tokens_used || 0;
        } else if (responseData.content) {
          let rawContent = responseData.content;
          if (typeof rawContent === 'object' && rawContent !== null) {
            aiContent = rawContent.content || rawContent.message || rawContent.text || JSON.stringify(rawContent, null, 2);
          } else {
            aiContent = typeof rawContent === 'string' ? rawContent : String(rawContent);
          }
          tokensUsed = responseData.tokens_used || 0;
        }
        
        console.log('🔍 파싱된 AI 응답:', { aiContent, tokensUsed, actualChatId });
        
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

      scrollToBottom();

      // AI 응답 저장은 백엔드에서 이미 처리됨
      console.log('📝 AI 응답은 백엔드에서 이미 DB에 저장됨');

      // 🎯 제목 자동 생성: 2번째 AI 응답 후 (총 4개 메시지: 사용자→AI→사용자→AI)
      if (finalMessages.length >= 4 && finalMessages.length <= 6) {
        console.log('🎯 채팅 제목 자동 생성 시작...');
        try {
          const generatedTitle = await chatService.generateChatTitle(
            finalMessages.map(msg => ({
              content: msg.content,
              role: msg.role
            }))
          );
          
          if (generatedTitle && generatedTitle !== '새 대화' && generatedTitle.length > 2) {
            console.log('✅ 생성된 제목:', generatedTitle);
            
            // 채팅 히스토리 제목 업데이트
            setChatHistory(prev => prev.map(chat => 
              chat.id === effectiveChatId 
                ? { ...chat, title: generatedTitle }
                : chat
            ));
            
            console.log('💾 채팅 제목 업데이트 완료:', generatedTitle);
          }
        } catch (titleError) {
          console.warn('⚠️ 제목 자동 생성 실패:', titleError);
        }
      }

    } catch (error) {
      console.error('❌ 메시지 전송 실패:', error);
      
      // 에러 응답 생성
      const errorResponse: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `죄송합니다. 현재 시스템에 일시적인 문제가 발생했습니다.\n\n잠시 후 다시 시도해 주세요.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
      scrollToBottom();
    } finally {
      setIsLoading(false);
    }
  };

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
