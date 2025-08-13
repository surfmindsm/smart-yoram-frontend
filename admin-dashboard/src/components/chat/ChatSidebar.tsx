import React from 'react';
import { ChatHistory, Agent } from '../../types/chat';
import { Button } from '../ui/button';
import { Plus, History, Users, Bot, Bookmark, MoreVertical, Edit, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChatSidebarProps {
  showHistory: boolean;
  setShowHistory: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: 'history' | 'agents';
  setActiveTab: React.Dispatch<React.SetStateAction<'history' | 'agents'>>;
  chatHistory: ChatHistory[];
  agents: Agent[];
  currentChatId: string | null;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedAgent: Agent | null;
  setSelectedAgent: React.Dispatch<React.SetStateAction<Agent | null>>;
  loadingChats: boolean;
  error: string | null;
  openMenuId: string | null;
  editingChatId: string | null;
  editingTitle: string;
  setEditingTitle: React.Dispatch<React.SetStateAction<string>>;
  onNewChat: () => void;
  onToggleBookmark: (chatId: string, isBookmarked: boolean) => void;
  onStartEditTitle: (chatId: string, title: string) => void;
  onSaveTitle: (chatId: string) => void;
  onCancelEdit: () => void;
  onToggleMenu: (chatId: string) => void;
  onDeleteChat: (chatId: string, title: string) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  showHistory,
  setShowHistory,
  activeTab,
  setActiveTab,
  chatHistory,
  agents,
  currentChatId,
  setCurrentChatId,
  selectedAgent,
  setSelectedAgent,
  loadingChats,
  error,
  openMenuId,
  editingChatId,
  editingTitle,
  setEditingTitle,
  onNewChat,
  onToggleBookmark,
  onStartEditTitle,
  onSaveTitle,
  onCancelEdit,
  onToggleMenu,
  onDeleteChat,
  dropdownRef
}) => {
  if (!showHistory) return null;

  return (
    <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <Bot className="w-6 h-6 text-sky-600" />
          <h2 className="font-semibold text-slate-900">AI 교역자</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(false)}
          className="p-1 hover:bg-slate-200"
        >
          ←
        </Button>
      </div>

      {/* 새 채팅 버튼 */}
      <div className="p-4">
        <Button
          onClick={onNewChat}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-3 font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          새 채팅
        </Button>
      </div>

      {/* 탭 전환 */}
      <div className="px-4 mb-4">
        <div className="flex bg-slate-200 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors",
              activeTab === 'history'
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <History className="w-4 h-4 mr-2" />
            히스토리
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={cn(
              "flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors",
              activeTab === 'agents'
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Users className="w-4 h-4 mr-2" />
            에이전트
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'history' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto px-4">
              {loadingChats ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-slate-500">로딩 중...</div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-sm p-4 bg-red-50 rounded-lg">
                  {error}
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
                  <p className="text-sm text-center">
                    아직 채팅 기록이 없습니다.<br />
                    새 채팅을 시작해보세요!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chatHistory.map((chat) => (
                    <div key={chat.id} className="group relative">
                      <div
                        onClick={() => {
                          setCurrentChatId(chat.id);
                          setActiveTab('history');
                        }}
                        className={cn(
                          "w-full p-3 text-left rounded-lg border transition-all cursor-pointer",
                          currentChatId === chat.id
                            ? "bg-sky-50 border-sky-200 text-sky-900"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            {editingChatId === chat.id ? (
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onBlur={() => onSaveTitle(chat.id)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    onSaveTitle(chat.id);
                                  } else if (e.key === 'Escape') {
                                    onCancelEdit();
                                  }
                                }}
                                className="w-full text-sm font-medium bg-transparent border-none outline-none"
                                autoFocus
                              />
                            ) : (
                              <h3 className="text-sm font-medium truncate">
                                {chat.title}
                              </h3>
                            )}
                            <div className="flex items-center mt-1 text-xs text-slate-500">
                              <span>{chat.messageCount}개 메시지</span>
                              <span className="mx-1">•</span>
                              <span>{new Date(chat.timestamp).toLocaleDateString('ko-KR')}</span>
                              {chat.isBookmarked && (
                                <>
                                  <span className="mx-1">•</span>
                                  <Bookmark className="w-3 h-3 fill-current text-yellow-500" />
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="relative" ref={dropdownRef}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleMenu(chat.id);
                              }}
                              className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-200"
                            >
                              <MoreVertical className="w-4 h-4 text-slate-500" />
                            </button>
                            
                            {openMenuId === chat.id && (
                              <div className="absolute right-0 top-8 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleBookmark(chat.id, chat.isBookmarked);
                                    onToggleMenu(chat.id);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center"
                                >
                                  <Bookmark className="w-4 h-4 mr-2" />
                                  {chat.isBookmarked ? '북마크 해제' : '북마크 추가'}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStartEditTitle(chat.id, chat.title);
                                    onToggleMenu(chat.id);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  이름 변경
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChat(chat.id, chat.title);
                                    onToggleMenu(chat.id);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 text-red-600 flex items-center"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="h-full overflow-y-auto px-4">
            {agents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <Bot className="w-12 h-12 mb-3 text-slate-300" />
                <p className="text-sm text-center">
                  사용 가능한 에이전트가<br />
                  없습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all",
                      selectedAgent?.id === agent.id
                        ? "bg-sky-50 border-sky-200"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center mr-3">
                        <Bot className="w-4 h-4 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 truncate">
                          {agent.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {agent.category}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {agent.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
