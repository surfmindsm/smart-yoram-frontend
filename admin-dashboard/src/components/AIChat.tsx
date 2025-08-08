import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, MoreHorizontal, Trash2, Copy, RefreshCw } from 'lucide-react';
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: '안녕하세요! AI 교역자입니다. 최근 4주 연속 주일예배 결석자 명단을 보여드릴까요?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-lg shadow-sm border border-slate-200">
      {/* 채팅 히스토리 사이드바 */}
      <div className={cn(
        "border-r border-slate-200 transition-all duration-300",
        showHistory ? "w-64" : "w-0 overflow-hidden"
      )}>
        <div className="p-4">
          <Button
            onClick={handleNewChat}
            className="w-full mb-4 bg-sky-600 hover:bg-sky-700"
          >
            + 새 채팅
          </Button>
          
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
          {messages.map((message) => (
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
          ))}
          
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
