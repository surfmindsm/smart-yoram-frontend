import React, { useRef, useEffect } from 'react';
import { ChatMessage, Agent, ChatHistory } from '../../types/chat';
import { Button } from '../ui/button';
import { Bot, Send, Download, FileText, FileCode, FileImage, File } from 'lucide-react';
import MessageList from './MessageList';

interface ChatMainAreaProps {
  activeTab: 'history' | 'agents';
  messages: ChatMessage[];
  isLoading: boolean;
  selectedAgent: Agent | null;
  selectedAgentForChat: Agent | null;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  onSendMessage: () => void;
  onStartAgentChat: (agent: Agent) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onDownload: (format: 'txt' | 'md' | 'pdf' | 'docx') => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  currentChatId: string | null;
  chatHistory: ChatHistory[];
}

const ChatMainArea: React.FC<ChatMainAreaProps> = ({
  activeTab,
  messages,
  isLoading,
  selectedAgent,
  selectedAgentForChat,
  inputValue,
  setInputValue,
  onSendMessage,
  onStartAgentChat,
  onKeyPress,
  onDownload,
  messagesEndRef,
  currentChatId,
  chatHistory
}) => {
  // 입력창 포커스를 위한 ref
  const mainInputRef = useRef<HTMLTextAreaElement>(null);
  const bottomInputRef = useRef<HTMLTextAreaElement>(null);
  
  // 메시지 전송 후 입력창 포커스 복원을 위한 함수
  const handleSendWithFocus = () => {
    onSendMessage();
    // 메시지 전송 후 입력창에 포커스 복원
    setTimeout(() => {
      if (messages.length === 0) {
        mainInputRef.current?.focus();
      } else {
        bottomInputRef.current?.focus();
      }
    }, 100);
  };
  
  // 컴포넌트 마운트 시와 상태 변경 시 자동 포커스
  useEffect(() => {
    if (activeTab === 'history') {
      if (messages.length === 0 && mainInputRef.current) {
        mainInputRef.current.focus();
      } else if (messages.length > 0 && bottomInputRef.current) {
        bottomInputRef.current.focus();
      }
    }
  }, [activeTab, messages.length, selectedAgentForChat]);
  // 현재 채팅의 제목을 가져오는 함수
  const getCurrentChatTitle = () => {
    if (!currentChatId) return '새로운 채팅';
    
    const currentChat = chatHistory.find(chat => chat.id === currentChatId);
    if (currentChat && currentChat.title) {
      return currentChat.title;
    }
    
    // 제목이 없으면 에이전트 이름이나 기본값 사용
    if (selectedAgentForChat) {
      return selectedAgentForChat.name;
    }
    
    return '새로운 채팅';
  };
  // 히스토리 탭에서 메시지가 없는 경우 - 첫 화면
  if (activeTab === 'history' && messages.length === 0) {
    const recommendedAgents = [
      { id: '1', name: '교인정보 에이전트', category: '교인 관리', description: '교인 등록, 출석 관리, 연락처 관리 등을 도와드립니다.', isActive: true },
      { id: '2', name: '예배 안내 에이전트', category: '예배 정보', description: '주일예배, 특별예배 시간과 장소를 안내해드립니다.', isActive: true },
      { id: '3', name: '공지사항 에이전트', category: '정보 전달', description: '교회 소식과 중요한 공지사항을 전달해드립니다.', isActive: true },
      { id: '4', name: '상담 에이전트', category: '목회 상담', description: '신앙 상담과 개인적인 고민을 함께 나눌 수 있습니다.', isActive: true }
    ].slice(0, 4);

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        {/* 통일된 ChatGPT 스타일 첫 화면 */}
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bot className="w-10 h-10 text-sky-600" />
            </div>
            {selectedAgentForChat ? (
              // 에이전트가 선택된 경우
              <>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {selectedAgentForChat.name}
                </h1>
                <div className="inline-flex px-4 py-2 rounded-full text-sm font-medium bg-sky-100 text-sky-800 mb-4">
                  {selectedAgentForChat.category}
                </div>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  {selectedAgentForChat.description}
                </p>
              </>
            ) : (
              // 에이전트가 선택되지 않은 경우
              <>
                <h1 className="text-3xl font-bold text-slate-900 mb-4">
                  AI 교역자와 대화하기
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  교회 업무를 도와주는 다양한 AI 에이전트들과 대화해보세요.<br />
                  아래에서 원하는 에이전트를 선택하거나 직접 질문을 입력하세요.
                </p>
              </>
            )}
          </div>

          {/* 중앙 입력창 - 동일한 스타일 */}
          <div className="relative mb-12">
            <textarea
              ref={mainInputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder={selectedAgentForChat 
                ? `${selectedAgentForChat.name}에게 질문해보세요...`
                : "무엇을 도와드릴까요? 질문을 입력하거나 아래 추천 에이전트를 선택해보세요..."
              }
              className="w-full px-6 py-4 pr-16 border-2 border-slate-200 rounded-2xl resize-none focus:outline-none focus:border-sky-500 bg-white shadow-lg text-slate-700 placeholder-slate-400 text-lg"
              rows={3}
              disabled={isLoading}
              autoFocus
            />
            <Button
              onClick={handleSendWithFocus}
              disabled={!inputValue.trim() || isLoading}
              className="absolute bottom-4 right-4 w-10 h-10 p-0 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 rounded-xl"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>

          {/* 추천 에이전트 카드들 - 에이전트 미선택 시만 표시 */}
          {!selectedAgentForChat && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {recommendedAgents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => onStartAgentChat(agent)}
                  className="p-6 bg-white border border-slate-200 rounded-xl hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                      <Bot className="w-6 h-6 text-sky-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-sky-700 transition-colors">
                        {agent.name}
                      </h3>
                      <p className="text-sm text-sky-600 mb-2">{agent.category}</p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 히스토리 탭 - 메시지 영역과 입력창 완전 분리
  if (activeTab === 'history') {
    return (
      <div className="flex-1 flex flex-col bg-white relative">
        {/* 헤더 - 채팅 제목 및 다운로드 버튼 */}
        {messages.length > 0 && (
          <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white z-10">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {getCurrentChatTitle()}
              </h2>
              {selectedAgentForChat && (
                <p className="text-sm text-slate-500">
                  {selectedAgentForChat.name}
                </p>
              )}
            </div>
            <div className="relative">
              <div className="flex items-center space-x-2">
                <div className="relative group">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2 bg-white"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">내보내기</span>
                  </Button>
                  {/* 다운로드 드롭다운 메뉴 */}
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                    <button
                      onClick={() => onDownload('txt')}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <FileText className="h-4 w-4 mr-3 text-slate-500" />
                      텍스트 파일 (.txt)
                    </button>
                    <button
                      onClick={() => onDownload('md')}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <FileCode className="h-4 w-4 mr-3 text-slate-500" />
                      마크다운 (.md)
                    </button>
                    <button
                      onClick={() => onDownload('pdf')}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <FileImage className="h-4 w-4 mr-3 text-slate-500" />
                      PDF 파일 (.pdf)
                    </button>
                    <button
                      onClick={() => onDownload('docx')}
                      className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <File className="h-4 w-4 mr-3 text-slate-500" />
                      워드 문서 (.docx)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 메시지 영역 - 헤더와 입력창 높이 제외하고 스크롤 */}
        <div className={`absolute left-0 right-0 bottom-[5rem] overflow-y-auto ${messages.length > 0 ? 'top-16' : 'top-0'}`}>
          <MessageList 
            messages={messages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
          />
        </div>

        {/* 입력창 - 하단 고정 */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200">
          <div className="p-4">
            <div className="flex space-x-2">
              <textarea
                ref={bottomInputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder="메시지를 입력하세요..."
                className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                autoFocus
              />
              <Button
                onClick={handleSendWithFocus}
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
  }

  // 에이전트 탭에서 선택된 에이전트가 있는 경우
  if (activeTab === 'agents' && selectedAgent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto">
        <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mb-6">
          <Bot className="w-10 h-10 text-sky-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedAgent.name}</h2>
        <div className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800 mb-4">
          {selectedAgent.category}
        </div>
        <p className="text-slate-600 text-center leading-relaxed mb-8 max-w-sm">
          {selectedAgent.description}
        </p>
        <Button
          onClick={() => onStartAgentChat(selectedAgent)}
          className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium text-base"
        >
          대화 시작하기
        </Button>
        <p className="text-xs text-slate-400 mt-4 text-center">
          대화를 시작하면 히스토리 탭으로 이동됩니다
        </p>
      </div>
    );
  }

  // 에이전트 탭에서 선택된 에이전트가 없는 경우
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <Bot className="w-16 h-16 text-slate-300 mb-4" />
      <h3 className="text-lg font-semibold text-slate-600 mb-2">
        AI 에이전트 선택
      </h3>
      <p className="text-sm text-slate-500 text-center">
        좌측에서 원하는 에이전트를 선택하세요.<br/>
        각 에이전트는 특정 분야에 특화되어 있습니다.
      </p>
    </div>
  );
};

export default ChatMainArea;
