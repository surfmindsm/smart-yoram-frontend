import React, { useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useChatHandlers } from '../hooks/useChatHandlers';
import { downloadAsTXT, downloadAsMD, downloadAsPDF, downloadAsDOCX, getCurrentChatTitle } from '../utils/fileExportUtils';
import ChatSidebar from './chat/ChatSidebar';
import ChatMainArea from './chat/ChatMainArea';
import DeleteConfirmModal from './chat/DeleteConfirmModal';

const AIChat: React.FC = () => {
  // 커스텀 훅 사용
  const chatState = useChat();
  
  const chatHandlers = useChatHandlers({
    messages: chatState.messages,
    setMessages: chatState.setMessages,
    setIsLoading: chatState.setIsLoading,
    inputValue: chatState.inputValue,
    setInputValue: chatState.setInputValue,
    currentChatId: chatState.currentChatId,
    setCurrentChatId: chatState.setCurrentChatId,
    selectedAgentForChat: chatState.selectedAgentForChat,
    setSelectedAgentForChat: chatState.setSelectedAgentForChat,
    chatHistory: chatState.chatHistory,
    setChatHistory: chatState.setChatHistory,
    setActiveTab: chatState.setActiveTab,
    setSelectedAgent: chatState.setSelectedAgent,
    messageCache: chatState.messageCache,
    setMessageCache: chatState.setMessageCache,
    editingChatId: chatState.editingChatId,
    setEditingChatId: chatState.setEditingChatId,
    editingTitle: chatState.editingTitle,
    setEditingTitle: chatState.setEditingTitle,
    setOpenMenuId: chatState.setOpenMenuId,
    setDeleteConfirmModal: chatState.setDeleteConfirmModal,
    getMockAIResponse: chatState.getMockAIResponse,
    scrollToBottom: chatState.scrollToBottom,
    loadData: chatState.loadData
  });

  // 다운로드 핸들러
  const handleDownload = (format: 'txt' | 'md' | 'pdf' | 'docx') => {
    const title = getCurrentChatTitle(chatState.currentChatId, chatState.chatHistory);
    
    switch (format) {
      case 'txt':
        downloadAsTXT(chatState.messages, title);
        break;
      case 'md':
        downloadAsMD(chatState.messages, title);
        break;
      case 'pdf':
        downloadAsPDF(chatState.messages, title);
        break;
      case 'docx':
        downloadAsDOCX(chatState.messages, title);
        break;
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    chatState.loadData();
  }, []);

  return (
    <div className="flex h-full bg-white">
      {/* 사이드바 - showHistory 조건 추가 */}
      {true && (
        <ChatSidebar
          activeTab={chatState.activeTab}
          setActiveTab={chatState.setActiveTab}
          chatHistory={chatState.chatHistory}
          agents={chatState.agents}
          currentChatId={chatState.currentChatId}
          setCurrentChatId={chatState.setCurrentChatId}
          selectedAgent={chatState.selectedAgent}
          setSelectedAgent={chatState.setSelectedAgent}
          loadingChats={chatState.isLoading}
          error={null}
          openMenuId={chatState.openMenuId}
          editingChatId={chatState.editingChatId}
          editingTitle={chatState.editingTitle}
          setEditingTitle={chatState.setEditingTitle}
          onNewChat={chatHandlers.handleNewChat}
          onToggleBookmark={chatHandlers.handleToggleBookmark}
          onStartEditTitle={chatHandlers.handleStartEditTitle}
          onSaveTitle={chatHandlers.handleSaveTitle}
          onCancelEdit={chatHandlers.handleCancelEdit}
          onToggleMenu={chatHandlers.handleToggleMenu}
          onDeleteChat={(chatId: string, title: string) => chatHandlers.handleDeleteChat(chatId)}
          dropdownRef={chatState.messagesEndRef}
        />
      )}

      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col">
        <ChatMainArea
          activeTab={chatState.activeTab}
          messages={chatState.messages}
          inputValue={chatState.inputValue}
          setInputValue={chatState.setInputValue}
          isLoading={chatState.isLoading}
          onSendMessage={chatHandlers.handleSendMessage}
          selectedAgent={chatState.selectedAgent}
          selectedAgentForChat={chatState.selectedAgentForChat}
          onStartAgentChat={chatHandlers.handleStartAgentChat}
          onKeyPress={chatHandlers.handleKeyPress}
          onDownload={handleDownload}
          messagesEndRef={chatState.messagesEndRef}
        />
      </div>

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        modal={chatState.deleteConfirmModal}
        onClose={() => chatState.setDeleteConfirmModal({ isOpen: false, chatTitle: '', chatId: null })}
        onConfirm={chatHandlers.handleDeleteConfirmModal}
      />
    </div>
  );
};

export default AIChat;
