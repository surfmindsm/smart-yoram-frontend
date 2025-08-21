import React from 'react';
import { ChatHistory, Agent } from '../../types/chat';
import { Button } from '../ui/button';
import { Bot, MoreVertical, Edit, Trash2, Star } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChatSidebarProps {
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
  onDeleteAllChats: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
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
  onDeleteAllChats,
  dropdownRef
}) => {
  const toggleMenu = (chatId: string) => {
    onToggleMenu(chatId);
  };

  const handleToggleBookmark = (chatId: string, isBookmarked: boolean) => {
    onToggleBookmark(chatId, isBookmarked);
  };

  const handleStartEditTitle = (chatId: string, title: string) => {
    onStartEditTitle(chatId, title);
  };

  const handleSaveTitle = (chatId: string) => {
    onSaveTitle(chatId);
  };

  const handleCancelEdit = () => {
    onCancelEdit();
  };

  return (
    <div className="w-72 border-r border-slate-200 flex flex-col h-full">
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
            에이전트
          </button>
        </div>
      </div>

      {/* 새 대화 시작 버튼 */}
      {activeTab === 'history' && (
        <div className="p-4 border-b border-slate-200">
          <Button 
            onClick={onNewChat}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white"
          >
            새 대화 시작
          </Button>
        </div>
      )}
      
      {/* 탭 내용 */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'history' ? (
          <>
            {/* 고정된 채팅 섹션 */}
            {chatHistory.filter(chat => chat.isBookmarked).length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center">
                  <Star className="w-3 h-3 mr-1 text-yellow-500" />
                  고정된 대화
                </h3>
                
                {chatHistory.filter(chat => chat.isBookmarked).map((chat) => (
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
                        <Star 
                          className={cn(
                            "w-3 h-3 cursor-pointer hover:text-yellow-400 transition-colors",
                            chat.isBookmarked ? "text-yellow-500 fill-current" : "text-slate-300"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleBookmark(chat.id, chat.isBookmarked);
                          }}
                        />
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
                        {new Date(chat.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* 더보기 메뉴 버튼 */}
                    <div className="absolute right-2 top-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(chat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
                      >
                        <MoreVertical className="h-3 w-3 text-slate-400" />
                      </button>
                      
                      {/* 드롭다운 메뉴 */}
                      {openMenuId === chat.id && (
                        <div 
                          className="absolute right-0 top-6 bg-white border border-slate-200 rounded-md shadow-lg z-10 min-w-32"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleStartEditTitle(chat.id, chat.title);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center"
                          >
                            <Edit className="h-3 w-3 mr-2" />
                            이름 변경
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onDeleteChat(chat.id, chat.title);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="border-t border-slate-200 my-4"></div>
              </>
            )}

            {/* 일반 채팅 섹션 */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-600">
                최근 대화
              </h3>
              {chatHistory.filter(chat => !chat.isBookmarked).length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('🔴 전체 삭제 버튼 클릭됨!');
                    onDeleteAllChats();
                  }}
                  className="text-xs text-slate-500 hover:text-red-600 px-2 py-1 h-auto"
                >
                  전체 삭제
                </Button>
              )}
            </div>
            
            {chatHistory.filter(chat => !chat.isBookmarked).length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-8">
                대화 기록이 없습니다.
              </div>
            ) : (
              chatHistory.filter(chat => !chat.isBookmarked).map((chat) => (
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
                      <Star 
                        className={cn(
                          "w-3 h-3 cursor-pointer hover:text-yellow-400 transition-colors",
                          chat.isBookmarked ? "text-yellow-500 fill-current" : "text-slate-300"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBookmark(chat.id, chat.isBookmarked);
                        }}
                      />
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
                      {new Date(chat.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* 더보기 메뉴 버튼 */}
                  <div className="absolute right-2 top-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
                    >
                      <MoreVertical className="h-3 w-3 text-slate-400" />
                    </button>
                    
                    {/* 드롭다운 메뉴 */}
                    {openMenuId === chat.id && (
                      <div 
                        className="absolute right-0 top-6 bg-white border border-slate-200 rounded-md shadow-lg z-10 min-w-32"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStartEditTitle(chat.id, chat.title);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center"
                        >
                          <Edit className="h-3 w-3 mr-2" />
                          이름 변경
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeleteChat(chat.id, chat.title);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            {/* 에이전트 리스트 */}
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={cn(
                  "p-3 rounded-lg border transition-colors mb-3 cursor-pointer",
                  selectedAgent?.id === agent.id 
                    ? "bg-sky-50 border-sky-200" 
                    : "border-slate-200 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center mr-3">
                    <Bot className="w-4 h-4 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {agent.category}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  {agent.description}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
