import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Bot, History, Send, Star, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { chatService, agentService } from '../services/api';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  tokensUsed?: number;
  cost?: number;
}

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
  isBookmarked: boolean;
}

interface Agent {
  id: string;
  name: string;
  category: string;
  description: string;
  isActive: boolean;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'agents'>('history');
  const [loadingChats, setLoadingChats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock 데이터 생성
  const getMockAIResponse = (userInput: string): ChatMessage => {
    const responses: { [key: string]: string } = {
      '결석자': '최근 4주 연속 주일예배 결석자는 총 12명입니다.\n\n**우선 심방 대상:**\n• 김○○ 집사\n• 이○○ 권사\n• 박○○ 성도\n\n더 자세한 정보가 필요하시면 말씀해 주세요.',
      '새가족': '최근 한 달간 새가족 등록 현황입니다.\n\n**신규 등록자 (5명):**\n• 최○○님 (20대, 대학생)\n• 정○○님 (30대, 직장인)\n• 한○○님 (40대, 주부)',
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

  // 데이터 로딩 (API 실패 시 Mock 데이터 사용)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingChats(true);
        
        // 채팅 히스토리 로드
        try {
          const response = await chatService.getChatHistories({ limit: 50 });
          const histories = response.data || response;
          if (Array.isArray(histories)) {
            // timestamp를 Date 객체로 변환
            const formattedHistories = histories.map(history => ({
              ...history,
              timestamp: new Date(history.timestamp || history.created_at)
            }));
            setChatHistory(formattedHistories);
            if (formattedHistories.length > 0) {
              setCurrentChatId(formattedHistories[0].id);
            }
          } else {
            console.warn('채팅 히스토리가 배열이 아닙니다:', histories);
            setChatHistory([]);
          }
        } catch (error) {
          console.warn('백엔드 API 실패, Mock 채팅 생성:', error);
          const mockHistory: ChatHistory[] = [
            {
              id: '1', // 정수 형태 ID
              title: '새 대화',
              timestamp: new Date(),
              messageCount: 0,
              isBookmarked: false
            }
          ];
          setChatHistory(mockHistory);
          setCurrentChatId(mockHistory[0].id);
        }

        // 에이전트 로드
        try {
          const response = await agentService.getAgents();
          const agentList = response.data || response;
          
          if (Array.isArray(agentList)) {
            setAgents(agentList);
            if (agentList.length > 0) {
              setSelectedAgent(agentList[0]);
            }
          } else {
            console.warn('에이전트 목록이 배열이 아닙니다:', agentList);
            setAgents([]);
          }
        } catch (error) {
          console.warn('API 실패, Mock 에이전트 사용:', error);
          const mockAgents: Agent[] = [
            {
              id: 'agent-1',
              name: '일반 교역 도우미',
              category: '일반',
              description: '교회 일반 업무를 도와드립니다',
              isActive: true
            }
          ];
          setAgents(mockAgents);
          setSelectedAgent(mockAgents[0]);
        }
      } finally {
        setLoadingChats(false);
      }
    };

    loadData();
  }, []);

  // 메시지 로딩
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentChatId) return;

      try {
        const response = await chatService.getChatMessages(currentChatId);
        const messageList = response.data || response;
        // timestamp를 Date 객체로 변환
        const formattedMessages = Array.isArray(messageList) ? messageList.map(message => ({
          ...message,
          timestamp: new Date(message.timestamp || message.created_at)
        })) : [];
        setMessages(formattedMessages);
      } catch (error) {
        console.warn('메시지 로딩 실패, 빈 메시지 목록 반환:', error);
        setMessages([]);
      }
    };

    loadMessages();
  }, [currentChatId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentChatId) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    
    // 첫 번째 메시지인지 확인
    const isFirstMessage = messages.length === 0;

    try {
      const response = await chatService.sendMessage(currentChatId, userMessage, selectedAgent?.id);
      const responseData = response.data || response;
      
      if (responseData.user_message && responseData.ai_response) {
        const newMessages = [
          {
            id: responseData.user_message.id,
            content: responseData.user_message.content,
            role: responseData.user_message.role,
            timestamp: new Date(responseData.user_message.timestamp)
          },
          {
            id: responseData.ai_response.id,
            content: responseData.ai_response.content,
            role: responseData.ai_response.role,
            timestamp: new Date(responseData.ai_response.timestamp),
            tokensUsed: responseData.ai_response.tokensUsed,
            cost: responseData.ai_response.cost
          }
        ];
        
        setMessages(prev => [...prev, ...newMessages]);
        
        // 첫 번째 메시지 후 자동 제목 생성
        if (isFirstMessage) {
          try {
            const generatedTitle = await chatService.generateChatTitle([
              ...messages,
              ...newMessages
            ]);
            
            // 채팅 제목 업데이트
            await chatService.updateChatTitle(currentChatId, generatedTitle);
            
            // UI에서 채팅 히스토리 제목 업데이트
            setChatHistory(prev => 
              prev.map(chat => 
                chat.id === currentChatId 
                  ? { ...chat, title: generatedTitle }
                  : chat
              )
            );
          } catch (titleError) {
            console.warn('제목 자동 생성 실패:', titleError);
          }
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.warn('백엔드 API 실패, Edge Function 사용:', error);
      
      // 사용자 메시지 먼저 추가
      const newUserMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        content: userMessage,
        role: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newUserMessage]);
      
      try {
        // Edge Function으로 실제 GPT API 호출
        const response = await fetch('https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/chat-manager/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c`
          },
          body: JSON.stringify({
            chat_history_id: currentChatId,
            agent_id: selectedAgent?.id,
            content: userMessage
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.ai_response) {
            const aiResponse: ChatMessage = {
              id: data.ai_response.id || `ai-${Date.now()}`,
              content: data.ai_response.content,
              role: 'assistant',
              timestamp: new Date(data.ai_response.timestamp || Date.now()),
              tokensUsed: data.ai_response.tokensUsed,
              cost: data.ai_response.cost
            };
            setMessages(prev => [...prev, aiResponse]);
            
            // 첫 번째 메시지 후 자동 제목 생성 (Edge Function 사용시)
            if (isFirstMessage) {
              try {
                const allMessages = [...messages, newUserMessage, aiResponse];
                const generatedTitle = await chatService.generateChatTitle(allMessages);
                
                // 채팅 제목 업데이트
                await chatService.updateChatTitle(currentChatId, generatedTitle);
                
                // UI에서 채팅 히스토리 제목 업데이트
                setChatHistory(prev => 
                  prev.map(chat => 
                    chat.id === currentChatId 
                      ? { ...chat, title: generatedTitle }
                      : chat
                  )
                );
              } catch (titleError) {
                console.warn('제목 자동 생성 실패 (Edge Function):', titleError);
              }
            }
            
            setIsLoading(false);
            return;
          }
        }
        
        throw new Error('Edge Function 응답 실패');
      } catch (edgeFunctionError) {
        console.warn('Edge Function도 실패, Mock 응답 사용:', edgeFunctionError);
        
        // 마지막 폴백: Mock 응답
        setTimeout(async () => {
          const mockResponse = getMockAIResponse(userMessage);
          setMessages(prev => [...prev, mockResponse]);
          
          // 첫 번째 메시지 후 자동 제목 생성 (Mock 사용시)
          if (isFirstMessage) {
            try {
              const allMessages = [...messages, newUserMessage, mockResponse];
              const generatedTitle = await chatService.generateChatTitle(allMessages);
              
              // 채팅 제목 업데이트 시도 (실패해도 폴백으로 처리)
              try {
                await chatService.updateChatTitle(currentChatId, generatedTitle);
              } catch (updateError) {
                console.warn('백엔드 제목 업데이트 실패, UI만 업데이트:', updateError);
              }
              
              // UI에서 채팅 히스토리 제목 업데이트
              setChatHistory(prev => 
                prev.map(chat => 
                  chat.id === currentChatId 
                    ? { ...chat, title: generatedTitle }
                    : chat
                )
              );
            } catch (titleError) {
              console.warn('제목 자동 생성 실패 (Mock):', titleError);
            }
          }
          
          setIsLoading(false);
        }, 1000);
      }
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await chatService.createChatHistory(selectedAgent?.id);
      const responseData = response.data || response;
      
      const newChat: ChatHistory = {
        id: responseData.id,
        title: responseData.title || '새 대화',
        timestamp: new Date(responseData.timestamp || Date.now()),
        messageCount: 0,
        isBookmarked: false
      };
      
      setChatHistory(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      setMessages([]);
    } catch (error) {
      console.warn('새 채팅 생성 실패, Mock 데이터 사용:', error);
      
      const newChat: ChatHistory = {
        id: Date.now().toString(), // 백엔드가 정수 ID를 기대함
        title: '새 대화',
        timestamp: new Date(),
        messageCount: 0,
        isBookmarked: false
      };
      
      setChatHistory(prev => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      setMessages([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 채팅 삭제 핸들러
  const handleDeleteChat = async (chatId: string) => {
    try {
      await chatService.deleteChat(chatId);
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
      
      // 삭제된 채팅이 현재 채팅이면 새 채팅으로 전환
      if (currentChatId === chatId) {
        const remainingChats = chatHistory.filter(chat => chat.id !== chatId);
        if (remainingChats.length > 0) {
          setCurrentChatId(remainingChats[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (error) {
      console.warn('채팅 삭제 실패:', error);
      // Mock 환경에서는 로컬 상태만 업데이트
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChatId === chatId) {
        handleNewChat();
      }
    }
    setOpenMenuId(null);
  };

  // 채팅 이름 변경 시작
  const handleStartEditTitle = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
    setOpenMenuId(null);
  };

  // 채팅 이름 변경 완료
  const handleSaveTitle = async (chatId: string) => {
    if (!editingTitle.trim()) {
      setEditingChatId(null);
      return;
    }

    try {
      await chatService.updateChatTitle(chatId, editingTitle.trim());
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, title: editingTitle.trim() }
            : chat
        )
      );
    } catch (error) {
      console.warn('채팅 제목 변경 실패:', error);
      // Mock 환경에서는 로컬 상태만 업데이트
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, title: editingTitle.trim() }
            : chat
        )
      );
    }
    
    setEditingChatId(null);
    setEditingTitle('');
  };

  // 채팅 이름 변경 취소
  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  // 메뉴 토글
  const toggleMenu = (chatId: string) => {
    setOpenMenuId(openMenuId === chatId ? null : chatId);
  };

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  if (loadingChats) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">채팅을 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex bg-white rounded-lg shadow-sm border border-slate-200">
      {/* 사이드바 */}
      {showHistory && (
        <div className="w-80 border-r border-slate-200">
          {/* 탭 헤더 */}
          <div className="border-b border-slate-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('history')}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === 'history'
                    ? "text-sky-600 border-b-2 border-sky-600 bg-sky-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                히스토리
              </button>
              <button
                onClick={() => setActiveTab('agents')}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === 'agents'
                    ? "text-sky-600 border-b-2 border-sky-600 bg-sky-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                목회도우미
              </button>
            </div>
          </div>

          {/* 새 대화 시작 버튼 */}
          {activeTab === 'history' && (
            <div className="p-4 border-b border-slate-200">
              <Button 
                onClick={handleNewChat}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white"
              >
                새 대화 시작
              </Button>
            </div>
          )}
          
          {/* 탭 내용 */}
          <div className="p-4 overflow-y-auto h-[calc(100%-120px)]">
            {activeTab === 'history' ? (
              <>
                <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center">
                  <History className="w-4 h-4 mr-1" />
                  최근 대화
                </h3>
                
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "p-3 rounded-lg transition-colors mb-2 relative group",
                      currentChatId === chat.id 
                        ? "bg-sky-50 border-l-2 border-sky-500" 
                        : "hover:bg-slate-50"
                    )}
                  >
                    <div 
                      className="cursor-pointer"
                      onClick={() => setCurrentChatId(chat.id)}
                    >
                      <div className="flex items-center space-x-2 pr-8">
                        <Star className={cn(
                          "h-3 w-3",
                          chat.isBookmarked ? "text-yellow-500 fill-current" : "text-slate-300"
                        )} />
                        {editingChatId === chat.id ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => handleSaveTitle(chat.id)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveTitle(chat.id);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            className="flex-1 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {chat.title}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {chat.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* 더보기 메뉴 버튼 */}
                    <div className="absolute right-2 top-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(chat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4 text-slate-500" />
                      </button>
                      
                      {/* 드롭다운 메뉴 */}
                      {openMenuId === chat.id && (
                        <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditTitle(chat.id, chat.title);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                          >
                            <Edit className="h-3 w-3" />
                            <span>이름 변경</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('정말로 이 대화를 삭제하시겠습니까?')) {
                                handleDeleteChat(chat.id);
                              }
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>삭제</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center">
                  <Bot className="w-4 h-4 mr-1" />
                  에이전트 선택
                </h3>
                
                {agents.filter(agent => agent.isActive).length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-2">활성화된 에이전트가 없습니다</p>
                    <p className="text-xs text-slate-400">에이전트 관리에서 먼저 에이전트를 생성하고 활성화하세요</p>
                  </div>
                ) : (
                  agents.filter(agent => agent.isActive).map((agent) => (
                  <div
                    key={agent.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors mb-2 border",
                      selectedAgent?.id === agent.id 
                        ? "bg-sky-50 border-sky-200" 
                        : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    )}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Bot className={cn(
                            "h-4 w-4",
                            selectedAgent?.id === agent.id ? "text-sky-600" : "text-slate-400"
                          )} />
                          <p className="text-sm font-medium text-slate-900">
                            {agent.name}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 ml-6">
                          {agent.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2 ml-6">
                          <span className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">
                            {agent.category}
                          </span>
                          {agent.isActive && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded">
                              활성
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 */}
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="text-slate-600 hover:text-slate-900"
              >
                {showHistory ? '←' : '→'}
              </Button>
              
              {selectedAgent && (
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-sky-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{selectedAgent.name}</p>
                    <p className="text-xs text-slate-500">{selectedAgent.description}</p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">
                AI 교역자와 대화를 시작하세요
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                교회 업무와 관련된 질문을 자유롭게 해보세요.
              </p>
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
                    <div className="flex items-center justify-between mt-2">
                      <p
                        className={cn(
                          "text-xs",
                          message.role === 'user' ? "text-sky-100" : "text-slate-500"
                        )}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                      {message.role === 'assistant' && (
                        <div className="text-xs flex items-center space-x-2 text-slate-400">
                          {message.tokensUsed && (
                            <span>{message.tokensUsed} 토큰</span>
                          )}
                          {message.cost && (
                            <span>₩{message.cost.toFixed(2)}</span>
                          )}
                        </div>
                      )}
                    </div>
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
