import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MoreHorizontal, Trash2, Copy, RefreshCw, Users, Heart, UserPlus, BookOpen, FileText, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  messages: ChatMessage[];
}

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
    {
      id: '1',
      title: '최근 4주 연속 주일예배...',
      timestamp: new Date('2025-08-08'),
      messages: []
    },
    {
      id: '2',
      title: '새 대화',
      timestamp: new Date('2025-08-08'),
      messages: []
    }
  ]);
  const [currentChatId, setCurrentChatId] = useState<string>('1');
  const [showHistory, setShowHistory] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'bookmarks' | 'ministry'>('history');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    // 시뮬레이션된 AI 응답
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(inputValue),
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string): string => {
    const responses = {
      '결석자': `**최근 4주 연속 주일예배 결석자**

1. **최진주 권사님** (73세, 5구역)
   - 담임 구역: 김명식님
   - 마지막 출석: 7월 14일
   - 메모: 건강상 이유로 결석 중

2. **최태선 권사님** (38세, 2구역) 
   - 담임 구역: 아터서님
   - 마지막 출석: 7월 21일
   - 메모: 해외 출장으로 결석

3. **허민범 성도님** (45세, 4구역)
   - 담임 구역: 박지선님
   - 마지막 출석: 7월 7일
   - 메모: 가족 상황으로 결석

🚨 **우선 심방 대상**: 최진주 권사님 (건강상 위급 상황)`,
      default: '안녕하세요! 교회 관리와 관련된 다양한 질문에 답변드리겠습니다. 출석 현황, 교인 관리, 통계 분석 등 궁금한 내용을 말씀해 주세요.'
    };

    if (userInput.includes('결석') || userInput.includes('출석')) {
      return responses['결석자'];
    }

    return responses['default'];
  };

  const handleNewChat = () => {
    const newChat: ChatHistory = {
      id: Date.now().toString(),
      title: '새 대화',
      timestamp: new Date(),
      messages: []
    };
    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages([]);
  };

  const handleCategorySelect = (category: string, question: string) => {
    setInputValue(question);
    // 자동으로 메시지 전송
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex bg-white rounded-lg shadow-sm border border-slate-200">
      {/* 채팅 히스토리 사이드바 */}
      <div className={cn(
        "border-r border-slate-200 transition-all duration-300",
        showHistory ? "w-80" : "w-0 overflow-hidden"
      )}>
        {/* 탭바 */}
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                activeTab === 'history' 
                  ? "text-sky-600 border-sky-600" 
                  : "text-slate-500 border-transparent hover:text-slate-700"
              )}
            >
              히스토리
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                activeTab === 'bookmarks' 
                  ? "text-sky-600 border-sky-600" 
                  : "text-slate-500 border-transparent hover:text-slate-700"
              )}
            >
              즐겨찾기
            </button>
            <button
              onClick={() => setActiveTab('ministry')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                activeTab === 'ministry' 
                  ? "text-sky-600 border-sky-600" 
                  : "text-slate-500 border-transparent hover:text-slate-700"
              )}
            >
              사역 도우미
            </button>
          </div>
        </div>

        <div className="p-4">
          <Button
            onClick={handleNewChat}
            className="w-full mb-4 bg-sky-600 hover:bg-sky-700"
          >
            + 새 채팅
          </Button>
          
          {activeTab === 'history' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-600 mb-3">대화 히스토리</h3>
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setCurrentChatId(chat.id)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-colors",
                  currentChatId === chat.id 
                    ? "bg-sky-50 border-l-2 border-sky-500" 
                    : "hover:bg-slate-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {chat.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {chat.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              ))}
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-600 mb-3">즐겨찾기</h3>
              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <p className="text-sm font-medium text-slate-900">주일 출석 분석</p>
                  <p className="text-xs text-slate-500 mt-1">매주 반복되는 출석 현황 체크</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <p className="text-sm font-medium text-slate-900">새가족 관리</p>
                  <p className="text-xs text-slate-500 mt-1">신규 등록자 관리 및 후속조치</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <p className="text-sm font-medium text-slate-900">심방 대상자</p>
                  <p className="text-xs text-slate-500 mt-1">우선 심방이 필요한 성도들</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ministry' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-600 mb-3">사역 도우미</h3>
              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center mb-2">
                    <BookOpen className="w-4 h-4 text-slate-600 mr-2" />
                    <p className="text-sm font-medium text-slate-900">설교 준비</p>
                  </div>
                  <p className="text-xs text-slate-500">본문 분석, 개요 작성</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center mb-2">
                    <FileText className="w-4 h-4 text-slate-600 mr-2" />
                    <p className="text-sm font-medium text-slate-900">주보 작성</p>
                  </div>
                  <p className="text-xs text-slate-500">교회 소식 및 일정 정리</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center mb-2">
                    <Users className="w-4 h-4 text-slate-600 mr-2" />
                    <p className="text-sm font-medium text-slate-900">구역 관리</p>
                  </div>
                  <p className="text-xs text-slate-500">구역별 현황 및 관리</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-4 h-4 text-slate-600 mr-2" />
                    <p className="text-sm font-medium text-slate-900">일정 관리</p>
                  </div>
                  <p className="text-xs text-slate-500">교회 행사 및 예배 일정</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center mr-3">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">AI 교역자</h2>
              <p className="text-sm text-slate-500">
                최근 4주 연속 주일예배 결석자 명단을 보여드릴까요?
              </p>
            </div>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            // 새 채팅 초기 화면
            <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6">
                <Bot className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-xl font-semibold text-slate-900 mb-3">
                AI 부교역자에게 무엇을 도와받고 싶으신가요?
              </h2>
              
              <p className="text-slate-500 mb-8 max-w-md">
                성도 정보, 출석 활동, 설교 준비 등 다양한 것을 도와드립니다.
              </p>

              <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                <button
                  onClick={() => handleCategorySelect('생명당', '이번 주 생명당 명단을 보여주세요')}
                  className="p-6 bg-white border border-slate-200 rounded-lg hover:border-sky-300 hover:bg-sky-50 transition-colors text-left group"
                >
                  <Users className="w-8 h-8 text-slate-600 group-hover:text-sky-600 mb-3" />
                  <h3 className="font-medium text-slate-900 mb-1">생명당 조회</h3>
                  <p className="text-sm text-slate-500">이번 주 생명당 명단</p>
                </button>

                <button
                  onClick={() => handleCategorySelect('심방대상', '심방이 필요한 성도 명단을 보여주세요')}
                  className="p-6 bg-white border border-slate-200 rounded-lg hover:border-sky-300 hover:bg-sky-50 transition-colors text-left group"
                >
                  <Heart className="w-8 h-8 text-slate-600 group-hover:text-sky-600 mb-3" />
                  <h3 className="font-medium text-slate-900 mb-1">심방 대상</h3>
                  <p className="text-sm text-slate-500">결석자 및 심방 필요 성도</p>
                </button>

                <button
                  onClick={() => handleCategorySelect('새가족', '최근 등록된 새가족 현황을 보여주세요')}
                  className="p-6 bg-white border border-slate-200 rounded-lg hover:border-sky-300 hover:bg-sky-50 transition-colors text-left group"
                >
                  <UserPlus className="w-8 h-8 text-slate-600 group-hover:text-sky-600 mb-3" />
                  <h3 className="font-medium text-slate-900 mb-1">새가족</h3>
                  <p className="text-sm text-slate-500">최근 등록 새가족 현황</p>
                </button>

                <button
                  onClick={() => handleCategorySelect('기도체크', '예배시 기도 요청한 성도들을 알려주세요')}
                  className="p-6 bg-white border border-slate-200 rounded-lg hover:border-sky-300 hover:bg-sky-50 transition-colors text-left group"
                >
                  <Heart className="w-8 h-8 text-slate-600 group-hover:text-sky-600 mb-3" />
                  <h3 className="font-medium text-slate-900 mb-1">기도 체크</h3>
                  <p className="text-sm text-slate-500">예배시 기도 요청 성도</p>
                </button>

                <button
                  onClick={() => handleCategorySelect('설교준비', '다음 주 설교 준비를 도와주세요')}
                  className="p-6 bg-white border border-slate-200 rounded-lg hover:border-sky-300 hover:bg-sky-50 transition-colors text-left group"
                >
                  <BookOpen className="w-8 h-8 text-slate-600 group-hover:text-sky-600 mb-3" />
                  <h3 className="font-medium text-slate-900 mb-1">설교 준비</h3>
                  <p className="text-sm text-slate-500">설교 계획 및 구성 도움</p>
                </button>

                <button
                  onClick={() => handleCategorySelect('주보작성', '이번 주 주보 작성을 도와주세요')}
                  className="p-6 bg-white border border-slate-200 rounded-lg hover:border-sky-300 hover:bg-sky-50 transition-colors text-left group"
                >
                  <FileText className="w-8 h-8 text-slate-600 group-hover:text-sky-600 mb-3" />
                  <h3 className="font-medium text-slate-900 mb-1">주보 작성</h3>
                  <p className="text-sm text-slate-500">교회 소식 및 일정 정리</p>
                </button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.sender === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "flex max-w-3xl",
                  message.sender === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.sender === 'user' 
                      ? "bg-slate-200 ml-3" 
                      : "bg-sky-600 mr-3"
                  )}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-slate-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={cn(
                    "px-4 py-3 rounded-lg",
                    message.sender === 'user'
                      ? "bg-sky-600 text-white"
                      : "bg-slate-100 text-slate-900"
                  )}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    <div className={cn(
                      "text-xs mt-2 opacity-70",
                      message.sender === 'user' ? "text-sky-100" : "text-slate-500"
                    )}>
                      {message.timestamp.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex">
                <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center mr-3">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-100 px-4 py-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="질문을 입력하세요..."
                className="w-full p-3 pr-12 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-sky-600 hover:bg-sky-700 px-4 py-2 h-11"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Enter로 전송 • 교회 관리와 관련된 질문을 해주세요
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
