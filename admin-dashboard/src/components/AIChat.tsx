import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { 
  Send, History, Bot, Star, MoreHorizontal, Edit3, Trash2,
  BookOpen, FileText, Users, Calendar, CheckSquare, MessageSquare,
  ChevronsLeft, ChevronsRight, Loader2, AlertCircle
} from 'lucide-react';
import { chatService, aiAgentService } from '../services/api';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  tokensUsed?: number;
  cost?: number;
  dataSources?: string[];
  processingTime?: number;
}

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  agent_id?: string;
  agent_name?: string;
  message_count: number;
  is_bookmarked?: boolean;
  messages?: ChatMessage[];
  totalTokensUsed?: number;
  totalCost?: number;
}

interface Agent {
  id: string;
  name: string;
  category: string;
  description: string;
  system_prompt?: string;
  is_active: boolean;
  usage_count?: number;
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'ministry'>('history');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load agents on mount
  useEffect(() => {
    loadAgents();
    loadChatHistories();
  }, []);

  const loadAgents = async () => {
    try {
      const response = await aiAgentService.getAgents();
      if (response && Array.isArray(response)) {
        setAgents(response);
        if (response.length > 0 && !selectedAgent) {
          setSelectedAgent(response[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
      setError('에이전트를 불러오는데 실패했습니다.');
    }
  };

  const loadChatHistories = async () => {
    try {
      const response = await chatService.getHistories(false);
      if (response?.success && response.data) {
        const histories = response.data.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        }));
        setChatHistory(histories);
      }
    } catch (error) {
      console.error('Failed to load chat histories:', error);
      setError('대화 기록을 불러오는데 실패했습니다.');
    }
  };

  const loadMessages = async (historyId: string) => {
    try {
      setIsLoading(true);
      const response = await chatService.getMessages(historyId);
      if (response?.success && response.data) {
        const loadedMessages = response.data.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.timestamp),
          tokensUsed: msg.tokens_used
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('메시지를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    if (!selectedAgent) {
      setError('에이전트를 선택해주세요.');
      return;
    }

    let chatId = currentChatId;
    
    // Create new chat if needed
    if (!chatId) {
      try {
        const newChat = await chatService.createHistory(selectedAgent.id, inputValue.substring(0, 30) + '...');
        chatId = newChat.id;
        setCurrentChatId(chatId);
        await loadChatHistories();
      } catch (error) {
        console.error('Failed to create chat:', error);
        setError('대화를 생성하는데 실패했습니다.');
        return;
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatService.sendMessage(chatId!, selectedAgent.id, userMessage.content);
      
      if (response?.success && response.data) {
        const aiResponse = response.data.ai_response;
        const assistantMessage: ChatMessage = {
          id: aiResponse.id,
          content: aiResponse.content,
          role: 'assistant',
          timestamp: new Date(aiResponse.timestamp),
          tokensUsed: aiResponse.tokens_used,
          dataSources: aiResponse.data_sources
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        await loadChatHistories();
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setError(error.response?.data?.detail || '메시지 전송에 실패했습니다.');
      // Remove the user message if sending failed
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSelect = async (chatId: string) => {
    setCurrentChatId(chatId);
    await loadMessages(chatId);
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setError(null);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await chatService.deleteHistory(chatId);
      await loadChatHistories();
      if (currentChatId === chatId) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      setError('대화 삭제에 실패했습니다.');
    }
  };

  const handleBookmarkToggle = async (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;

    try {
      await chatService.updateHistory(chatId, { is_bookmarked: !chat.is_bookmarked });
      await loadChatHistories();
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      setError('북마크 변경에 실패했습니다.');
    }
  };

  const handleRenameChat = async (chatId: string) => {
    if (!editingTitle.trim()) return;

    try {
      await chatService.updateHistory(chatId, { title: editingTitle });
      await loadChatHistories();
      setEditingChat(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Failed to rename chat:', error);
      setError('대화 이름 변경에 실패했습니다.');
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return `${Math.floor(days / 30)}개월 전`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '설교 지원': return <BookOpen className="w-5 h-5" />;
      case '목양 관리': return <Users className="w-5 h-5" />;
      case '예배 지원': return <Calendar className="w-5 h-5" />;
      case '행정 지원': return <FileText className="w-5 h-5" />;
      default: return <Bot className="w-5 h-5" />;
    }
  };

  const groupedAgents = agents.reduce((acc, agent) => {
    if (!acc[agent.category]) {
      acc[agent.category] = [];
    }
    acc[agent.category].push(agent);
    return acc;
  }, {} as Record<string, Agent[]>);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gray-50 rounded-lg overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "bg-white border-r transition-all duration-300",
        showHistory ? "w-80" : "w-0"
      )}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <Button 
              onClick={handleNewChat}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white"
            >
              <Bot className="w-4 h-4 mr-2" />
              새 대화 시작
            </Button>
            
            {/* Tab Switcher */}
            <div className="flex mt-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('history')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  activeTab === 'history' 
                    ? "bg-white text-sky-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <History className="w-4 h-4 inline mr-1" />
                대화 기록
              </button>
              <button
                onClick={() => setActiveTab('ministry')}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  activeTab === 'ministry' 
                    ? "bg-white text-sky-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Bot className="w-4 h-4 inline mr-1" />
                AI 사역자
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'history' ? (
            <div className="flex-1 overflow-y-auto p-4">
              {chatHistory.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>대화 기록이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-colors relative group",
                        currentChatId === chat.id 
                          ? "bg-sky-50 border border-sky-200" 
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => handleChatSelect(chat.id)}
                    >
                      {editingChat === chat.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameChat(chat.id);
                              }
                            }}
                            onBlur={() => handleRenameChat(chat.id)}
                            className="flex-1 px-2 py-1 border rounded"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {chat.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {chat.agent_name}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(chat.timestamp)}
                                </span>
                                {chat.message_count > 0 && (
                                  <>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">
                                      {chat.message_count}개 메시지
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            {chat.is_bookmarked && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          
                          {/* Action Menu */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(activeMenu === chat.id ? null : chat.id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            
                            {activeMenu === chat.id && (
                              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingChat(chat.id);
                                    setEditingTitle(chat.title);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                >
                                  <Edit3 className="w-4 h-4 inline mr-2" />
                                  이름 변경
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBookmarkToggle(chat.id);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                >
                                  <Star className="w-4 h-4 inline mr-2" />
                                  {chat.is_bookmarked ? '북마크 해제' : '북마크'}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteChat(chat.id);
                                    setActiveMenu(null);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 inline mr-2" />
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              {Object.entries(groupedAgents).map(([category, categoryAgents]) => (
                <div key={category} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    {getCategoryIcon(category)}
                    <h3 className="font-semibold text-gray-900">{category}</h3>
                  </div>
                  <div className="space-y-2">
                    {categoryAgents.map((agent) => (
                      <div
                        key={agent.id}
                        onClick={() => {
                          setSelectedAgent(agent);
                          handleNewChat();
                        }}
                        className={cn(
                          "p-3 rounded-lg cursor-pointer transition-colors",
                          selectedAgent?.id === agent.id
                            ? "bg-sky-50 border border-sky-200"
                            : "hover:bg-gray-50 border border-gray-200"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {agent.name}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {agent.description}
                            </p>
                          </div>
                          {agent.is_active && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              활성
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-r-lg p-2 shadow-md hover:bg-gray-50"
        style={{ left: showHistory ? '320px' : '0' }}
      >
        {showHistory ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
      </button>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedAgent ? selectedAgent.name : 'AI 교역자'}
              </h2>
              {selectedAgent && (
                <p className="text-sm text-gray-600 mt-1">
                  {selectedAgent.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}
          
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-12">
              <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">대화를 시작해보세요</h3>
              <p className="text-sm">
                {selectedAgent 
                  ? `${selectedAgent.name}가 도와드릴 준비가 되었습니다.`
                  : 'AI 사역자를 선택하고 질문을 입력해주세요.'}
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
                      "max-w-2xl px-4 py-3 rounded-lg",
                      message.role === 'user'
                        ? "bg-sky-600 text-white"
                        : "bg-white border border-gray-200"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className={cn(
                      "flex items-center gap-3 mt-2 text-xs",
                      message.role === 'user' ? "text-sky-100" : "text-gray-500"
                    )}>
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.tokensUsed && (
                        <span>토큰: {message.tokensUsed}</span>
                      )}
                      {message.dataSources && message.dataSources.length > 0 && (
                        <span>참조: {message.dataSources.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-600">AI가 응답을 생성중입니다...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder={selectedAgent ? "메시지를 입력하세요..." : "먼저 AI 사역자를 선택해주세요"}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              disabled={!selectedAgent || isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!selectedAgent || !inputValue.trim() || isLoading}
              className="bg-sky-600 hover:bg-sky-700 text-white px-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;