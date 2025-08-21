import { Dispatch, SetStateAction, KeyboardEvent } from 'react';
import { ChatMessage, ChatHistory, Agent } from '../types/chat';
import { saveMessageViaMCP, queryDatabaseViaMCP } from '../utils/mcpUtils';
import { churchConfigService } from '../services/api';

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

        // 백엔드에 채팅 히스토리 생성
        try {
          const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.surfmind-team.com/api/v1';
          const historyResponse = await fetch(`${API_BASE_URL}/chat/histories`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            },
            body: JSON.stringify({
              id: parseInt(effectiveChatId.replace('chat_', '')) || Date.now(),
              agent_id: 1, // 기본 agent_id 사용
              title: `새 대화 ${new Date().toLocaleString()}`
            })
          });
          
          if (historyResponse.ok) {
            const historyResult = await historyResponse.json();
            console.log('✅ 채팅 히스토리 생성 성공:', historyResult);
            
            // 생성된 실제 ID로 업데이트
            if (historyResult.id && historyResult.id !== parseInt(effectiveChatId.replace('chat_', ''))) {
              const newChatId = `chat_${historyResult.id}`;
              setCurrentChatId(newChatId);
              effectiveChatId = newChatId;
              console.log('🔄 채팅 ID 업데이트:', effectiveChatId, '->', newChatId);
            }
          } else {
            const errorText = await historyResponse.text();
            console.warn('⚠️ 채팅 히스토리 생성 실패:', errorText);
            throw new Error(`채팅 히스토리 생성 실패: ${errorText}`);
          }
        } catch (error) {
          console.warn('⚠️ 채팅 히스토리 생성 오류:', error);
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
        const fallbackAgent = agents?.[0] || {
          id: '1',
          name: '기본 AI 도우미',
          description: '도움이 되는 AI 어시스턴트입니다.',
          category: '일반',
          isActive: true
        };
        setSelectedAgentForChat(fallbackAgent);
        console.log('⚠️ 에이전트 없음, 기본 에이전트 설정:', fallbackAgent.name);
      }

      // MCP를 통한 사용자 메시지 저장
      if (effectiveChatId) {
        await saveMessageViaMCP(effectiveChatId, userMessage.content, 'user', undefined, selectedAgentForChat?.id);
      }

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
        console.log('🤖 일반 에이전트: 직접 GPT API 호출');
        
        // GPT 설정 가져오기
        const gptConfig = await churchConfigService.getGptConfig();
        console.log('🔑 GPT 설정 로드:', gptConfig);
        console.log('🔍 API 키 상세 정보:', {
          hasApiKey: !!gptConfig?.api_key,
          keyLength: gptConfig?.api_key?.length || 0,
          keyPrefix: gptConfig?.api_key?.substring(0, 7) || 'none',
          keyType: typeof gptConfig?.api_key,
          isActive: gptConfig?.is_active
        });

        if (!gptConfig?.api_key) {
          throw new Error('GPT API 키가 설정되지 않았습니다.');
        }

        if (!gptConfig?.api_key.startsWith('sk-')) {
          throw new Error('유효하지 않은 OpenAI API 키 형식입니다. sk-로 시작해야 합니다.');
        }

        // API 키 길이 체크
        if (gptConfig?.api_key && gptConfig.api_key.length < 20) {
          throw new Error('유효하지 않은 API 키입니다. 키 길이가 너무 짧습니다.');
        }

        // 에이전트의 시스템 프롬프트 사용
        const systemPrompt = selectedAgentForChat?.systemPrompt || 
          selectedAgentForChat?.system_prompt || 
          '당신은 교회 사역을 돕는 AI 도우미입니다. 한국어로 친근하고 도움이 되는 답변을 제공해주세요.';

        // GPT API 직접 호출
        const messages = [
          { role: 'system', content: systemPrompt },
          ...updatedMessages.slice(0, -1).map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: 'user', content: userMessage.content }
        ];

        const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${gptConfig.api_key}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.7
          })
        });

        if (!gptResponse.ok) {
          const errorData = await gptResponse.text();
          console.error('❌ GPT API 상세 오류:', {
            status: gptResponse.status,
            statusText: gptResponse.statusText,
            error: errorData,
            apiKey: gptConfig.api_key ? `***${gptConfig.api_key.slice(-4)}` : 'null'
          });
          
          if (gptResponse.status === 401) {
            throw new Error('GPT API 키가 유효하지 않습니다. 교회 설정에서 새로운 API 키를 입력해주세요.');
          } else if (gptResponse.status === 429) {
            throw new Error('GPT API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
          } else {
            throw new Error(`GPT API 오류 (${gptResponse.status}): ${gptResponse.statusText}`);
          }
        }

        const gptData = await gptResponse.json();
        const responseText = gptData.choices[0]?.message?.content || '죄송합니다. 응답을 생성할 수 없습니다.';

        aiResponse = {
          id: `ai-${Date.now()}`,
          content: responseText,
          role: 'assistant',
          timestamp: new Date(),
          tokensUsed: gptData.usage?.total_tokens || 0,
          cost: 0
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

      // MCP를 통한 AI 응답 저장 (백그라운드에서 실행)
      if (effectiveChatId) {
        try {
          await saveMessageViaMCP(effectiveChatId, aiResponse.content, 'assistant', aiResponse.tokensUsed, selectedAgentForChat?.id);
        } catch (error) {
          console.warn('⚠️ AI 응답 저장 실패 (UI에는 영향 없음):', error);
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
