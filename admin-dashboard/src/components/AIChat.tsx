import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { chatService, agentService } from '../services/api';
import { Send, Bot, History, Star } from 'lucide-react';

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
  isBookmarked?: boolean;
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
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
          const histories = await chatService.getChatHistories({ limit: 50 });
          setChatHistory(histories);
          if (histories.length > 0) {
            setCurrentChatId(histories[0].id);
          }
        } catch (error) {
          console.warn('API 실패, Mock 데이터 사용:', error);
          const mockHistory: ChatHistory[] = [
            {
              id: 'chat-1',
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
          const agentList = await agentService.getAgents();
          if (agentList.length > 0) {
            setSelectedAgent(agentList[0]);
          }
        } catch (error) {
          console.warn('API 실패, Mock 에이전트 사용:', error);
          const mockAgent: Agent = {
            id: 'agent-1',
            name: '일반 교역 도우미',
            category: '일반',
            description: '교회 업무 전반을 도와드립니다',
            isActive: true
          };
          setSelectedAgent(mockAgent);
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
        const messageList = await chatService.getChatMessages(currentChatId);
        setMessages(messageList);
      } catch (error) {
        console.warn('메시지 로딩 실패, 빈 채팅으로 시작:', error);
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

    // 사용자 메시지 추가
    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: userMessage,
      role: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // API 시도
      const response = await chatService.sendMessage(currentChatId, userMessage, selectedAgent?.id);
      
      if (response.ai_message) {
        setMessages(prev => [...prev, {
          id: response.ai_message.id,
          content: response.ai_message.content,
          role: 'assistant',
          timestamp: new Date(response.ai_message.timestamp),
          tokensUsed: response.ai_message.tokens_used,
          cost: response.ai_message.cost
        }]);
      }
      setIsLoading(false);
    } catch (error) {
      console.warn('API 실패, Mock 응답 사용:', error);
      
      // Mock 응답 생성
      setTimeout(() => {
        const mockResponse = getMockAIResponse(userMessage);
        setMessages(prev => [...prev, mockResponse]);
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleNewChat = () => {
    const newChat: ChatHistory = {
      id: `chat-${Date.now()}`,
      title: '새 대화',
      timestamp: new Date(),
      messageCount: 0,
      isBookmarked: false
    };
    
    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
      {/* 채팅 히스토리 사이드바 */}
      {showHistory && (
        <div className="w-80 border-r border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <Button 
              onClick={handleNewChat}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white"
            >
              새 대화 시작
            </Button>
          </div>
          
          <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
            <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center">
              <History className="w-4 h-4 mr-1" />
              최근 대화
            </h3>
            
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-colors mb-2",
                  currentChatId === chat.id 
                    ? "bg-sky-50 border-l-2 border-sky-500" 
                    : "hover:bg-slate-50"
                )}
                onClick={() => setCurrentChatId(chat.id)}
              >
                <div className="flex items-center space-x-2">
                  <Star className={cn(
                    "h-3 w-3",
                    chat.isBookmarked ? "text-yellow-500 fill-current" : "text-slate-300"
                  )} />
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {chat.title}
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {chat.timestamp.toLocaleDateString()}
                </p>
              </div>
            ))}
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
