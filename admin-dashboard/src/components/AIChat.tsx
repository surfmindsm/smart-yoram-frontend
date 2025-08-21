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
    loadData: chatState.loadData,
    agents: chatState.agents
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
    <div className="h-[calc(100vh-7rem)] bg-slate-50 overflow-hidden">
      <div className="flex h-full w-full">
        {/* 사이드바 */}
        <div className="w-72 flex-shrink-0">
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
            onDeleteAllChats={chatState.deleteAllChats}
            dropdownRef={chatState.messagesEndRef}
          />
        </div>
        
        {/* 메인 채팅 영역 */}
        <div className="flex-1 flex flex-col bg-white">
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
            currentChatId={chatState.currentChatId}
            chatHistory={chatState.chatHistory}
          />
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        modal={chatState.deleteConfirmModal}
        onClose={() => chatState.setDeleteConfirmModal({ isOpen: false, chatTitle: '', chatId: null })}
        onConfirm={async () => {
          const modalChatId = chatState.deleteConfirmModal.chatId;
          
          // 전체 삭제인 경우
          if (modalChatId === 'ALL_CHATS') {
            console.log('🗑️ 전체 삭제 확인됨');
            await chatState.executeDeleteAllChats();
          } 
          // 개별 채팅 삭제인 경우
          else {
            console.log('🗑️ 개별 채팅 삭제 확인됨');
            chatHandlers.handleDeleteConfirmModal();
          }
          
          // 모달 닫기
          chatState.setDeleteConfirmModal({ isOpen: false, chatTitle: '', chatId: null });
        }}
      />
    </div>
  );
};

export default AIChat;
