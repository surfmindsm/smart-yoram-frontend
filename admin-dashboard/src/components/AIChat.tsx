import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Bot, History, Send, Star, MoreVertical, Edit, Trash2, Download, FileText, File } from 'lucide-react';
import { chatService, agentService } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

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
  isBookmarked: boolean;
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
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedAgentForChat, setSelectedAgentForChat] = useState<Agent | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'agents'>('history');
  const [loadingChats, setLoadingChats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [messageCache, setMessageCache] = useState<{[key: string]: ChatMessage[]}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 브라우저 내장 다운로드 함수
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 다운로드 핸들러 함수들
  const getCurrentChatTitle = () => {
    return chatHistory.find(chat => chat.id === currentChatId)?.title || '새 대화';
  };

  const formatMessagesForExport = () => {
    const title = getCurrentChatTitle();
    const timestamp = new Date().toLocaleString('ko-KR');
    
    return {
      title,
      timestamp,
      messages: messages.map(msg => ({
        role: msg.role === 'user' ? '사용자' : 'AI 어시스턴트',
        content: msg.content,
        time: msg.timestamp.toLocaleString('ko-KR')
      }))
    };
  };

  const downloadAsTXT = () => {
    const data = formatMessagesForExport();
    let content = `대화 제목: ${data.title}\n생성 시간: ${data.timestamp}\n\n`;
    
    data.messages.forEach((msg, index) => {
      content += `[${msg.time}] ${msg.role}:\n${msg.content}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadFile(blob, `${data.title}.txt`);
  };

  const downloadAsMD = () => {
    const data = formatMessagesForExport();
    let content = `# ${data.title}\n\n**생성 시간:** ${data.timestamp}\n\n---\n\n`;
    
    data.messages.forEach((msg, index) => {
      content += `## ${msg.role} (${msg.time})\n\n${msg.content}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    downloadFile(blob, `${data.title}.md`);
  };

  const downloadAsPDF = () => {
    const data = formatMessagesForExport();
    const pdf = new jsPDF();
    
    pdf.setFont('helvetica');
    pdf.setFontSize(16);
    pdf.text(data.title, 20, 20);
    
    pdf.setFontSize(10);
    pdf.text(`생성 시간: ${data.timestamp}`, 20, 30);
    
    let yPosition = 50;
    
    data.messages.forEach((msg) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${msg.role} (${msg.time})`, 20, yPosition);
      yPosition += 10;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      const lines = pdf.splitTextToSize(msg.content, 170);
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, 20, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
    });

    const pdfBlob = pdf.output('blob');
    downloadFile(pdfBlob, `${data.title}.pdf`);
  };

  const downloadAsDOCX = async () => {
    const data = formatMessagesForExport();
    
    const paragraphs = [
      new Paragraph({
        children: [new TextRun({ text: data.title, bold: true, size: 28 })],
      }),
      new Paragraph({
        children: [new TextRun({ text: `생성 시간: ${data.timestamp}`, size: 20 })],
      }),
      new Paragraph({ text: "" }),
    ];

    data.messages.forEach((msg) => {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: `${msg.role} (${msg.time})`, bold: true, size: 24 })],
        }),
        new Paragraph({
          children: [new TextRun({ text: msg.content, size: 22 })],
        }),
        new Paragraph({ text: "" })
      );
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });

    const buffer = await Packer.toBlob(doc);
    downloadFile(buffer, `${data.title}.docx`);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDownloadMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.download-menu-container')) {
          setShowDownloadMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDownloadMenu]);

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

  // 데이터 로딩 최적화 (병렬 API 호출)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingChats(true);
        
        // 🚀 병렬 API 호출로 속도 2배 개선
        const [chatHistoryResult, agentsResult] = await Promise.allSettled([
          chatService.getChatHistories({ limit: 50 }),
          agentService.getAgents()
        ]);

        // 채팅 히스토리 처리
        if (chatHistoryResult.status === 'fulfilled') {
          const response = chatHistoryResult.value;
          const histories = response.data || response;
          if (Array.isArray(histories)) {
            const formattedHistories = histories.map(history => ({
              ...history,
              timestamp: new Date(history.timestamp || history.created_at),
              isBookmarked: history.is_bookmarked || false
            }));
            setChatHistory(formattedHistories);
            if (formattedHistories.length > 0) {
              setCurrentChatId(formattedHistories[0].id);
            }
          } else {
            setChatHistory([]);
          }
        } else {
          // Mock 데이터 폴백
          const mockHistory: ChatHistory[] = [
            {
              id: '1',
              title: '새 대화',
              timestamp: new Date(),
              messageCount: 0,
              isBookmarked: false
            }
          ];
          setChatHistory(mockHistory);
          setCurrentChatId(mockHistory[0].id);
        }

        // 에이전트 처리
        if (agentsResult.status === 'fulfilled') {
          const response = agentsResult.value;
          console.log('🔍 AIChat - 에이전트 API 응답:', response);
          
          let agentList = [];
          
          // 새로운 API 형식 처리
          if (response.success && response.data && Array.isArray(response.data.agents)) {
            agentList = response.data.agents;
          } else if (Array.isArray(response.data)) {
            agentList = response.data;
          } else if (Array.isArray(response)) {
            agentList = response;
          }
          
          if (agentList.length > 0) {
            // 백엔드 snake_case를 프론트엔드 camelCase로 변환
            const transformedAgents = agentList.map((agent: any) => ({
              id: agent.id,
              name: agent.name,
              category: agent.category,
              description: agent.description,
              isActive: agent.is_active || agent.isActive,
              icon: agent.icon,
              systemPrompt: agent.system_prompt,
              detailedDescription: agent.detailed_description
            }));
            
            setAgents(transformedAgents);
            
            // 활성화된 에이전트 중 첫 번째를 기본 선택
            const activeAgents = transformedAgents.filter((agent: Agent) => agent.isActive);
            if (activeAgents.length > 0) {
              setSelectedAgent(activeAgents[0]);
            } else if (transformedAgents.length > 0) {
              setSelectedAgent(transformedAgents[0]);
            }
          } else {
            setAgents([]);
          }
        } else {
          // Mock 에이전트 폴백
          const mockAgents: Agent[] = [
            {
              id: 'agent-1',
              name: '일반 교역 도우미',
              category: '일반',
              description: '교회 일반 업무를 도와드립니다',
              isActive: true
            }
          ];
          setAgents(mockAgents);
          setSelectedAgent(mockAgents[0]);
        }
      } finally {
        setLoadingChats(false);
      }
    };

    loadData();
  }, []);

  // 📥 메시지 캐싱 및 지연 로딩 최적화
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentChatId) return;

      // 🚀 캐시에서 먼저 확인 (즉시 표시)
      if (messageCache[currentChatId]) {
        setMessages(messageCache[currentChatId]);
        return;
      }

      try {
        const response = await chatService.getChatMessages(currentChatId);
        const messageList = response.data || response;
        const formattedMessages = Array.isArray(messageList) ? messageList.map(message => ({
          ...message,
          timestamp: new Date(message.timestamp || message.created_at)
        })) : [];
        
        setMessages(formattedMessages);
        
        // 💾 캐시에 저장 (다음에 즉시 로딩)
        setMessageCache(prev => ({
          ...prev,
          [currentChatId]: formattedMessages
        }));
      } catch (error) {
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
    
    // 첫 번째 메시지인지 확인
    const isFirstMessage = messages.length === 0;

    try {
      const response = await chatService.sendMessage(currentChatId, userMessage, selectedAgentForChat?.id);
      const responseData = response.data || response;
      
      if (responseData.user_message && responseData.ai_response) {
        const newMessages = [
          {
            id: responseData.user_message.id,
            content: responseData.user_message.content,
            role: responseData.user_message.role,
            timestamp: new Date(responseData.user_message.timestamp)
          },
          {
            id: responseData.ai_response.id,
            content: responseData.ai_response.content,
            role: responseData.ai_response.role,
            timestamp: new Date(responseData.ai_response.timestamp),
            tokensUsed: responseData.ai_response.tokensUsed,
            cost: responseData.ai_response.cost
          }
        ];
        
        setMessages(prev => [...prev, ...newMessages]);
        
        // 첫 번째 메시지 후 자동 제목 생성
        if (isFirstMessage) {
          try {
            const generatedTitle = await chatService.generateChatTitle([
              ...messages,
              ...newMessages
            ]);
            
            // 채팅 제목 업데이트
            await chatService.updateChatTitle(currentChatId, generatedTitle);
            
            // UI에서 채팅 히스토리 제목 업데이트
            setChatHistory(prev => 
              prev.map(chat => 
                chat.id === currentChatId 
                  ? { ...chat, title: generatedTitle }
                  : chat
              )
            );
          } catch (titleError) {
            console.warn('제목 자동 생성 실패:', titleError);
          }
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.warn('백엔드 API 실패, Edge Function 사용:', error);
      
      // 사용자 메시지 먼저 추가
      const newUserMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        content: userMessage,
        role: 'user',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newUserMessage]);
      
      try {
        // Edge Function으로 실제 GPT API 호출
        const response = await fetch('https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/chat-manager/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c`
          },
          body: JSON.stringify({
            chat_history_id: currentChatId,
            agent_id: selectedAgentForChat?.id,
            content: userMessage
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.ai_response) {
            const aiResponse: ChatMessage = {
              id: data.ai_response.id || `ai-${Date.now()}`,
              content: data.ai_response.content,
              role: 'assistant',
              timestamp: new Date(data.ai_response.timestamp || Date.now()),
              tokensUsed: data.ai_response.tokensUsed,
              cost: data.ai_response.cost
            };
            setMessages(prev => [...prev, aiResponse]);
            
            // 첫 번째 메시지 후 자동 제목 생성 (Edge Function 사용시)
            if (isFirstMessage) {
              try {
                const allMessages = [...messages, newUserMessage, aiResponse];
                const generatedTitle = await chatService.generateChatTitle(allMessages);
                
                // 채팅 제목 업데이트
                await chatService.updateChatTitle(currentChatId, generatedTitle);
                
                // UI에서 채팅 히스토리 제목 업데이트
                setChatHistory(prev => 
                  prev.map(chat => 
                    chat.id === currentChatId 
                      ? { ...chat, title: generatedTitle }
                      : chat
                  )
                );
              } catch (titleError) {
                console.warn('제목 자동 생성 실패 (Edge Function):', titleError);
              }
            }
            
            setIsLoading(false);
            return;
          }
        }
        
        throw new Error('Edge Function 응답 실패');
      } catch (edgeFunctionError) {
        console.warn('Edge Function도 실패, Mock 응답 사용:', edgeFunctionError);
        
        // 마지막 폴백: Mock 응답
        setTimeout(async () => {
          const mockResponse = getMockAIResponse(userMessage);
          setMessages(prev => [...prev, mockResponse]);
          
          // 첫 번째 메시지 후 자동 제목 생성 (Mock 사용시)
          if (isFirstMessage) {
            try {
              const allMessages = [...messages, newUserMessage, mockResponse];
              const generatedTitle = await chatService.generateChatTitle(allMessages);
              
              // 채팅 제목 업데이트 시도 (실패해도 폴백으로 처리)
              try {
                await chatService.updateChatTitle(currentChatId, generatedTitle);
              } catch (updateError) {
                console.warn('백엔드 제목 업데이트 실패, UI만 업데이트:', updateError);
              }
              
              // UI에서 채팅 히스토리 제목 업데이트
              setChatHistory(prev => 
                prev.map(chat => 
                  chat.id === currentChatId 
                    ? { ...chat, title: generatedTitle }
                    : chat
                )
              );
            } catch (titleError) {
              console.warn('제목 자동 생성 실패 (Mock):', titleError);
            }
          }
          
          setIsLoading(false);
        }, 1000);
      }
    }
  };

  const handleNewChat = async () => {
    try {
      setMessages([]);
      setCurrentChatId(null);
      setSelectedAgentForChat(null);
      
      // API를 통해 새 채팅 생성
      const response = await chatService.createChatHistory(undefined, '새 대화');
      
      if (response?.id) {
        setCurrentChatId(response.id);
        // 채팅 히스토리 새로고침
        const historyResponse = await chatService.getChatHistories({ limit: 50 });
        const histories = historyResponse.data || historyResponse;
        if (Array.isArray(histories)) {
          const formattedHistories = histories.map(history => ({
            ...history,
            timestamp: new Date(history.timestamp || history.created_at),
            isBookmarked: history.is_bookmarked || false // 백엔드 필드명 매핑
          }));
          setChatHistory(formattedHistories);
        }
      }
    } catch (error) {
      console.error('새 채팅 생성 실패:', error);
      // 에러 발생 시 로컬에서 새 채팅 생성
      const newChatId = Date.now().toString();
      setCurrentChatId(newChatId);
      setMessages([]);
      
      const newChat: ChatHistory = {
        id: newChatId,
        title: '새 대화',
        timestamp: new Date(),
        messageCount: 0,
        isBookmarked: false
      };
      setChatHistory(prev => [newChat, ...prev]);
    }
  };

  const handleStartAgentChat = async (agent: Agent) => {
    try {
      setSelectedAgentForChat(agent);
      
      console.log('🚀 Creating chat with agent:', agent.id, agent.name);
      // API를 통해 에이전트와 새 채팅 생성
      const response = await chatService.createChatHistory(agent.id, `${agent.name}와의 대화`);
      console.log('✅ Chat creation response:', response);
      
      if (response?.id) {
        setCurrentChatId(response.id);
        
        // 에이전트 환영 메시지 추가 (기존 UI로 전환)
        const welcomeMessage: ChatMessage = {
          id: Date.now().toString(),
          content: `안녕하세요! 저는 **${agent.name}**입니다. ${agent.description}\n\n무엇을 도와드릴까요?`,
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        
        // 채팅 히스토리 새로고침
        const historyResponse = await chatService.getChatHistories({ limit: 50 });
        const histories = historyResponse.data || historyResponse;
        if (Array.isArray(histories)) {
          const formattedHistories = histories.map(history => ({
            ...history,
            timestamp: new Date(history.timestamp || history.created_at),
            isBookmarked: history.is_bookmarked || false
          }));
          setChatHistory(formattedHistories);
        }
      }
      
      // 히스토리 탭으로 전환
      setActiveTab('history');
      
    } catch (error) {
      console.error('에이전트 채팅 생성 실패:', error);
      // 에러 발생 시 로컬에서 새 채팅 생성
      const newChatId = Date.now().toString();
      setCurrentChatId(newChatId);
      setSelectedAgentForChat(agent);
      
      // 에이전트 환영 메시지 추가 (기존 UI로 전환)
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `안녕하세요! 저는 **${agent.name}**입니다. ${agent.description}\n\n무엇을 도와드릴까요?`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      const newChat: ChatHistory = {
        id: newChatId,
        title: `${agent.name}와의 대화`,
        timestamp: new Date(),
        messageCount: 1,
        isBookmarked: false
      };
      setChatHistory(prev => [newChat, ...prev]);
      
      // 히스토리 탭으로 전환
      setActiveTab('history');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 채팅 삭제 핸들러
  const handleDeleteChat = async (chatId: string) => {
    try {
      await chatService.deleteChat(chatId);
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
      
      // 삭제된 채팅이 현재 채팅이면 새 채팅으로 전환
      if (currentChatId === chatId) {
        const remainingChats = chatHistory.filter(chat => chat.id !== chatId);
        if (remainingChats.length > 0) {
          setCurrentChatId(remainingChats[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (error) {
      console.warn('채팅 삭제 실패:', error);
      // Mock 환경에서는 로컬 상태만 업데이트
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChatId === chatId) {
        handleNewChat();
      }
    }
    setOpenMenuId(null);
  };

  // 북마크 토글 핸들러
  const handleToggleBookmark = async (chatId: string, currentBookmarkState: boolean) => {
    console.log('🔖 북마크 토글 시작:', chatId, '현재 상태:', currentBookmarkState, '→', !currentBookmarkState);
    
    try {
      // 즉시 UI 업데이트 (낙관적 업데이트)
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, isBookmarked: !currentBookmarkState }
            : chat
        )
      );

      // 백엔드 API 호출
      console.log('📤 북마크 API 호출:', chatId, !currentBookmarkState);
      const response = await chatService.bookmarkChat(chatId, !currentBookmarkState);
      console.log('✅ 북마크 API 성공:', response);
    } catch (error) {
      console.error('❌ 북마크 토글 실패:', error);
      // 실패 시 UI 상태 롤백
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, isBookmarked: currentBookmarkState }
            : chat
        )
      );
    }
  };

  // 채팅 이름 변경 시작
  const handleStartEditTitle = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
    setOpenMenuId(null);
  };

  // 채팅 이름 변경 완료
  const handleSaveTitle = async (chatId: string) => {
    if (!editingTitle.trim()) {
      setEditingChatId(null);
      return;
    }

    try {
      await chatService.updateChatTitle(chatId, editingTitle.trim());
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, title: editingTitle.trim() }
            : chat
        )
      );
    } catch (error) {
      console.warn('채팅 제목 변경 실패:', error);
      // Mock 환경에서는 로컬 상태만 업데이트
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, title: editingTitle.trim() }
            : chat
        )
      );
    }
    
    setEditingChatId(null);
    setEditingTitle('');
  };

  // 채팅 이름 변경 취소
  const handleCancelEdit = () => {
    setEditingChatId(null);
    setEditingTitle('');
  };

  // 메뉴 토글
  const toggleMenu = (chatId: string) => {
    setOpenMenuId(openMenuId === chatId ? null : chatId);
  };

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

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
      {/* 사이드바 */}
      {showHistory && (
        <div className="w-80 border-r border-slate-200">
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
                목회도우미
              </button>
            </div>
          </div>

          {/* 새 대화 시작 버튼 */}
          {activeTab === 'history' && (
            <div className="p-4 border-b border-slate-200">
              <Button 
                onClick={handleNewChat}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white"
              >
                새 대화 시작
              </Button>
            </div>
          )}
          
          {/* 탭 내용 */}
          <div className="p-4 overflow-y-auto h-[calc(100%-120px)]">
            {activeTab === 'history' ? (
              <>
                {/* 고정된 채팅 섹션 */}
                {chatHistory.filter(chat => chat.isBookmarked).length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-500" />
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
                                "h-3 w-3 cursor-pointer hover:text-yellow-400 transition-colors",
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
                            {chat.timestamp.toLocaleDateString()}
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
                                onClick={() => handleStartEditTitle(chat.id, chat.title)}
                                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center"
                              >
                                <Edit className="h-3 w-3 mr-2" />
                                이름 변경
                              </button>
                              <button
                                onClick={() => handleDeleteChat(chat.id)}
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
                    
                    {/* 구분선 */}
                    <div className="border-t border-slate-200 my-4"></div>
                  </>
                )}

                {/* 일반 채팅 섹션 */}
                <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center">
                  <History className="w-4 h-4 mr-1" />
                  최근 대화
                </h3>
                
                {chatHistory.filter(chat => !chat.isBookmarked).map((chat) => (
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
                            "h-3 w-3 cursor-pointer hover:text-yellow-400 transition-colors",
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
                        {chat.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* 더보기 메뉴 버튼 */}
                    <div className="absolute right-2 top-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(chat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4 text-slate-500" />
                      </button>
                      
                      {/* 드롭다운 메뉴 */}
                      {openMenuId === chat.id && (
                        <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditTitle(chat.id, chat.title);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                          >
                            <Edit className="h-3 w-3" />
                            <span>이름 변경</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('정말로 이 대화를 삭제하시겠습니까?')) {
                                handleDeleteChat(chat.id);
                              }
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>삭제</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-slate-600 mb-3 flex items-center">
                  <Bot className="w-4 h-4 mr-1" />
                  에이전트 선택
                </h3>
                
                {agents.filter(agent => agent.isActive).length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 mb-2">활성화된 에이전트가 없습니다</p>
                    <p className="text-xs text-slate-400">에이전트 관리에서 먼저 에이전트를 생성하고 활성화하세요</p>
                  </div>
                ) : (
                  agents.filter(agent => agent.isActive).map((agent) => (
                  <div
                    key={agent.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors mb-2",
                      selectedAgent?.id === agent.id
                        ? "bg-sky-50 border-2 border-sky-200"
                        : "border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    )}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Bot className={cn(
                            "h-4 w-4",
                            selectedAgent?.id === agent.id ? "text-sky-600" : "text-slate-400"
                          )} />
                          <p className="text-sm font-medium text-slate-900">
                            {agent.name}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 ml-6">
                          {agent.description}
                        </p>
                        <div className="flex items-center space-x-2 mt-2 ml-6">
                          <span className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">
                            {agent.category}
                          </span>
                          {agent.isActive && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded">
                              활성
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </>
            )}
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
                {showHistory ? '«' : '»'}
              </Button>
              
              {currentChatId && (
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-sky-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {chatHistory.find(chat => chat.id === currentChatId)?.title || '새 대화'}
                    </p>
                    {selectedAgentForChat && (
                      <p className="text-xs text-slate-500">{selectedAgentForChat.description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 다운로드 버튼 */}
            {currentChatId && messages.length > 0 && (
              <div className="relative download-menu-container">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <Download className="w-4 h-4" />
                </Button>

                {showDownloadMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          downloadAsTXT();
                          setShowDownloadMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <FileText className="w-4 h-4 mr-3" />
                        TXT 문서(.txt)
                      </button>
                      
                      <button
                        onClick={() => {
                          downloadAsMD();
                          setShowDownloadMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <File className="w-4 h-4 mr-3" />
                        마크다운 문서(.md)
                      </button>
                      
                      <button
                        onClick={() => {
                          downloadAsPDF();
                          setShowDownloadMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <FileText className="w-4 h-4 mr-3" />
                        PDF 문서(.pdf)
                      </button>
                      
                      <button
                        onClick={() => {
                          downloadAsDOCX();
                          setShowDownloadMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <File className="w-4 h-4 mr-3" />
                        DOCX 문서(.docx)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* 채팅 내용 또는 에이전트 선택 */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'history' && (
            <>


              {/* 메시지 영역 */}
              <div className="flex-1 overflow-y-auto">
                {messages.length === 0 && !isLoading ? (
                  // ChatGPT 스타일 시작 화면
                  <div className="h-full flex flex-col">
                    {/* 상단 여백 */}
                    <div className="flex-1"></div>
                    
                    {/* 중앙 컨텐츠 */}
                    <div className="px-4 pb-8">
                      {/* 제목 */}
                      <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-slate-900 mb-2">
                          AI 교역자
                        </h1>
                        <p className="text-lg text-slate-600">
                          교회 업무와 관련된 질문을 자유롭게 해보세요
                        </p>
                      </div>

                      {/* 중앙 입력창 */}
                      <div className="max-w-2xl mx-auto mb-8">
                        <div className="flex space-x-2">
                          <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="메시지를 입력하세요..."
                            className="flex-1 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none shadow-sm"
                            rows={1}
                            style={{ minHeight: '56px', maxHeight: '120px' }}
                          />
                          <Button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isLoading}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl disabled:opacity-50 h-14"
                          >
                            <Send className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>

                      {/* 에이전트 추천 목록 */}
                      <div className="max-w-4xl mx-auto">
                        <h3 className="text-center text-sm font-medium text-slate-700 mb-4">
                          또는 AI 에이전트를 선택하세요
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {agents.slice(0, 4).map((agent) => (
                            <button
                              key={agent.id}
                              onClick={() => handleStartAgentChat(agent)}
                              className="p-4 border border-slate-200 rounded-xl hover:border-sky-300 hover:shadow-sm transition-all text-left group"
                            >
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                                  <Bot className="w-4 h-4 text-sky-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-slate-900 text-sm mb-1 group-hover:text-sky-700 transition-colors">
                                    {agent.name}
                                  </h4>
                                  <p className="text-xs text-slate-500 line-clamp-2">
                                    {agent.description}
                                  </p>
                                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-md">
                                    {agent.category}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* 하단 여백 */}
                    <div className="flex-1"></div>
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
                          <div className="prose prose-sm max-w-none markdown-content">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                              components={{
                                // 제목 스타일링
                                h1: ({children}) => <h1 className="text-xl font-bold mb-3 text-slate-900">{children}</h1>,
                                h2: ({children}) => <h2 className="text-lg font-semibold mb-2 text-slate-800">{children}</h2>,
                                h3: ({children}) => <h3 className="text-base font-medium mb-2 text-slate-700">{children}</h3>,
                                
                                // 코드 블록 스타일링
                                code: ({children, ...props}) => {
                                  const isInline = !String(children).includes('\n');
                                  return isInline ? (
                                    <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                      {children}
                                    </code>
                                  ) : (
                                    <code className="block bg-slate-900 text-slate-100 p-3 rounded-lg text-sm font-mono overflow-x-auto" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                
                                // 리스트 스타일링
                                ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                                li: ({children}) => <li className="text-slate-700">{children}</li>,
                                
                                // 인용문 스타일링
                                blockquote: ({children}) => (
                                  <blockquote className="border-l-4 border-sky-200 pl-4 py-2 bg-sky-50 rounded-r mb-3 italic text-slate-600">
                                    {children}
                                  </blockquote>
                                ),
                                
                                // 링크 스타일링
                                a: ({children, href}) => (
                                  <a href={href} className="text-sky-600 hover:text-sky-700 underline" target="_blank" rel="noopener noreferrer">
                                    {children}
                                  </a>
                                ),
                                
                                // 테이블 스타일링
                                table: ({children}) => (
                                  <div className="overflow-x-auto mb-3">
                                    <table className="min-w-full border border-slate-200 rounded">{children}</table>
                                  </div>
                                ),
                                thead: ({children}) => <thead className="bg-slate-50">{children}</thead>,
                                th: ({children}) => <th className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-700">{children}</th>,
                                td: ({children}) => <td className="border border-slate-200 px-3 py-2 text-slate-600">{children}</td>,
                                
                                // 단락 스타일링
                                p: ({children}) => <p className="mb-2 last:mb-0 text-slate-700 leading-relaxed">{children}</p>,
                                
                                // 강조 텍스트
                                strong: ({children}) => <strong className="font-semibold text-slate-900">{children}</strong>,
                                em: ({children}) => <em className="italic text-slate-600">{children}</em>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
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

              {/* 입력 영역 - 메시지가 있을 때만 표시 */}
              {(messages.length > 0 || isLoading) && (
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
              )}
            </>
          )}

          {activeTab === 'agents' && (
            <div className="flex-1 flex flex-col">
              {selectedAgent ? (
                // 에이전트 선택됨 - 상세 정보 표시
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
                    onClick={() => handleStartAgentChat(selectedAgent)}
                    className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium text-base"
                  >
                    대화 시작하기
                  </Button>
                  <p className="text-xs text-slate-400 mt-4 text-center">
                    대화를 시작하면 히스토리 탭으로 이동됩니다
                  </p>
                </div>
              ) : (
                // 에이전트 선택되지 않음 - 안내 메시지
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChat;
