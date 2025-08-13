import React from 'react';
import { ChatMessage, Agent } from '../../types/chat';
import { Button } from '../ui/button';
import { Bot, Send, Download } from 'lucide-react';
import MessageList from './MessageList';
import { cn } from '../../lib/utils';

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
  messagesEndRef
}) => {
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
        {selectedAgentForChat ? (
          // 에이전트가 선택된 상태에서 첫 메시지 입력 대기
          <div className="w-full max-w-2xl">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-sky-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                {selectedAgentForChat.name}
              </h2>
              <div className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-sky-100 text-sky-800 mb-3">
                {selectedAgentForChat.category}
              </div>
              <p className="text-slate-600 text-center max-w-md">
                {selectedAgentForChat.description}
              </p>
            </div>

            {/* 중앙 입력창 */}
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder={`${selectedAgentForChat.name}에게 질문해보세요...`}
                className="w-full px-4 py-4 pr-14 border-2 border-slate-200 rounded-2xl resize-none focus:outline-none focus:border-sky-500 bg-white shadow-sm text-slate-700 placeholder-slate-400"
                rows={3}
                disabled={isLoading}
              />
              <Button
                onClick={onSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="absolute bottom-3 right-3 w-8 h-8 p-0 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 rounded-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          // 에이전트가 선택되지 않은 초기 상태
          <div className="w-full max-w-4xl">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="w-10 h-10 text-sky-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">
                AI 교역자와 대화하기
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                교회 업무를 도와주는 다양한 AI 에이전트들과 대화해보세요.<br />
                아래에서 원하는 에이전트를 선택하거나 직접 질문을 입력하세요.
              </p>
            </div>

            {/* 중앙 입력창 */}
            <div className="relative mb-12">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={onKeyPress}
                placeholder="무엇을 도와드릴까요? 질문을 입력하거나 아래 추천 에이전트를 선택해보세요..."
                className="w-full px-6 py-4 pr-16 border-2 border-slate-200 rounded-2xl resize-none focus:outline-none focus:border-sky-500 bg-white shadow-lg text-slate-700 placeholder-slate-400 text-lg"
                rows={3}
                disabled={isLoading}
              />
              <Button
                onClick={onSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="absolute bottom-4 right-4 w-10 h-10 p-0 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 rounded-xl"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>

            {/* 추천 에이전트 카드들 */}
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
          </div>
        )}
      </div>
    );
  }

  // 히스토리 탭에서 메시지가 있는 경우 - 채팅 화면
  if (activeTab === 'history' && messages.length > 0) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white">
        {/* 채팅 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center space-x-3">
            {selectedAgentForChat && (
              <>
                <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{selectedAgentForChat.name}</h3>
                  <p className="text-xs text-slate-500">{selectedAgentForChat.category}</p>
                </div>
              </>
            )}
          </div>
          
          {/* 다운로드 메뉴 */}
          <div className="relative group">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-slate-100"
            >
              <Download className="w-4 h-4" />
            </Button>
            <div className="absolute right-0 top-8 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={() => onDownload('txt')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center"
              >
                텍스트 파일 (.txt)
              </button>
              <button
                onClick={() => onDownload('md')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center"
              >
                마크다운 (.md)
              </button>
              <button
                onClick={() => onDownload('pdf')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center"
              >
                PDF 파일 (.pdf)
              </button>
              <button
                onClick={() => onDownload('docx')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center"
              >
                워드 문서 (.docx)
              </button>
            </div>
          </div>
        </div>

        {/* 메시지 리스트 */}
        <MessageList 
          messages={messages}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />

        {/* 입력창 */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder="메시지를 입력하세요..."
              className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-lg resize-none focus:outline-none focus:border-sky-500 bg-slate-50"
              rows={2}
              disabled={isLoading}
            />
            <Button
              onClick={onSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="absolute bottom-2 right-2 w-8 h-8 p-0 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300"
            >
              <Send className="h-4 w-4" />
            </Button>
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
