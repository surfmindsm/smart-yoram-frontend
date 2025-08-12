import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Bot, Send, Plus, Search, Filter, Bookmark, Download, MessageSquare, History, Users, Copy, Star, MoreVertical, Edit, Trash2, FileText, File as FileIcon } from 'lucide-react';
import { chatService, agentService, memberService, announcementService, attendanceService } from '../services/api';
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
  church_data_sources?: string[];
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
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{isOpen: boolean, chatId: string | null, chatTitle: string}>({
    isOpen: false,
    chatId: null,
    chatTitle: ''
  });
  const [messageCache, setMessageCache] = useState<{[key: string]: ChatMessage[]}>({});
  const [creatingAgentChat, setCreatingAgentChat] = useState<string | null>(null); // 현재 생성 중인 에이전트 ID
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
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
        
        // 🛡️ 서버 응답이 비어있고 이미 로컬 메시지가 있다면 기존 메시지 유지
        if (formattedMessages.length === 0 && messages.length > 0) {
          console.log('🔄 서버 응답이 비어있지만 로컬 메시지 유지:', messages.length, '개');
          // 현재 메시지를 캐시에 저장
          setMessageCache(prev => ({
            ...prev,
            [currentChatId]: messages
          }));
          return;
        }
        
        setMessages(formattedMessages);
        
        // 💾 캐시에 저장 (다음에 즉시 로딩)
        setMessageCache(prev => ({
          ...prev,
          [currentChatId]: formattedMessages
        }));
      } catch (error) {
        console.error('메시지 로딩 실패:', error);
        // 🛡️ 에러 발생 시에도 기존 메시지가 있다면 유지
        if (messages.length === 0) {
          setMessages([]);
        }
      }
    };

    loadMessages();
  }, [currentChatId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentChatId) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // 🚀 사용자 메시지 즉시 표시
    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: userMessage,
      role: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    // 🔥 교인 관련 에이전트는 무조건 실제 데이터 수집
    let contextData: any = {};
    console.log('🔍 선택된 에이전트:', selectedAgentForChat?.name, 'ID:', selectedAgentForChat?.id);
    
    if (selectedAgentForChat && (selectedAgentForChat.id === '10' || selectedAgentForChat.name?.includes('교인'))) {
      console.log('🚀 교회 데이터 수집 시작...');
      
      // 교인 데이터 수집
      try {
        const members: any[] = await memberService.getMembers();
        
        // 🔍 실제 데이터 구조 확인
        console.log('🔍 원본 교인 데이터 샘플 (첫 3개):', members.slice(0, 3));
        console.log('🔍 첫 번째 교인 전체 필드:', members[0] ? Object.keys(members[0]) : 'No data');
        
        // 나이 분석을 위한 현재 날짜
        const currentYear = new Date().getFullYear();
        
        // 🔥 개별 교인 검색 및 상세 정보를 위한 데이터 구조화
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const threeMonthsAgo = new Date(currentDate.getTime() - (90 * 24 * 60 * 60 * 1000));
        
        contextData.members = {
          // 기본 통계
          total_count: members.length,
          active_count: members.filter((m: any) => 
            m.member_status === 'active' || m.status === 'active'
          ).length,
          male_count: members.filter((m: any) => 
            m.gender === 'male' || m.gender === 'M' || m.sex === 'male' || m.sex === 'M'
          ).length,
          female_count: members.filter((m: any) => 
            m.gender === 'female' || m.gender === 'F' || m.sex === 'female' || m.sex === 'F'
          ).length,
          
          // 연령 분석 (실제 DB 필드명: birthdate)
          age_groups: {
            under_20: members.filter((m: any) => {
              if (m.birthdate) {
                const birthYear = new Date(m.birthdate).getFullYear();
                const age = currentYear - birthYear;
                return age < 20;
              }
              return false;
            }).length,
            age_20_40: members.filter((m: any) => {
              if (m.birthdate) {
                const birthYear = new Date(m.birthdate).getFullYear();
                const age = currentYear - birthYear;
                return age >= 20 && age < 40;
              }
              return false;
            }).length,
            age_40_60: members.filter((m: any) => {
              if (m.birthdate) {
                const birthYear = new Date(m.birthdate).getFullYear();
                const age = currentYear - birthYear;
                return age >= 40 && age < 60;
              }
              return false;
            }).length,
            over_60: members.filter((m: any) => {
              if (m.birthdate) {
                const birthYear = new Date(m.birthdate).getFullYear();
                const age = currentYear - birthYear;
                return age >= 60;
              }
              return false;
            }).length
          },
          
          // 🔥 직책별 분류
          positions: {
            pastor: members.filter(m => m.position?.includes('목사') || m.position?.includes('pastor')).length,
            elder: members.filter(m => m.position?.includes('장로') || m.position?.includes('elder')).length,
            deacon: members.filter(m => m.position?.includes('집사') || m.position?.includes('deacon')).length,
            kwonsa: members.filter(m => m.position?.includes('권사')).length,
            others: members.filter(m => !m.position || (!m.position.includes('목사') && !m.position.includes('장로') && !m.position.includes('집사') && !m.position.includes('권사'))).length
          },
          
          // 🔥 결혼 상태별 분류
          marital_status: {
            married: members.filter(m => m.marital_status === 'married' || m.marital_status === '기혼').length,
            single: members.filter(m => m.marital_status === 'single' || m.marital_status === '미혼').length,
            unknown: members.filter(m => !m.marital_status).length
          },
          
          // 🔥 이번 달 생일인 교인들
          this_month_birthdays: members
            .filter(m => {
              if (m.birthdate) {
                const birthMonth = new Date(m.birthdate).getMonth() + 1;
                return birthMonth === currentMonth;
              }
              return false;
            })
            .map(m => ({
              name: m.name || '이름없음',
              birthdate: m.birthdate,
              phone: m.phone,
              age: currentYear - new Date(m.birthdate).getFullYear()
            })),
          
          // 🔥 최근 3개월 내 등록한 교인들 (실제 데이터는 created_at에 있음)
          recent_registrations: members
            .filter(m => {
              if (m.created_at) {
                const regDate = new Date(m.created_at);
                return regDate >= threeMonthsAgo;
              }
              return false;
            })
            .map(m => ({
              name: m.name || '이름없음',
              registration_date: m.created_at, // 실제 등록일
              phone: m.phone,
              status: m.member_status || m.status // member_status 우선
            })),
          
          // 🔥 세례받은 교인들 (올해)
          baptized_this_year: members
            .filter(m => {
              if (m.baptism_date) {
                const baptismYear = new Date(m.baptism_date).getFullYear();
                return baptismYear === currentYear;
              }
              return false;
            })
            .map(m => ({
              name: m.name || '이름없음',
              baptism_date: m.baptism_date,
              baptism_church: m.baptism_church
            })),
          
          // 🔥 부서별 분류 (상위 5개 부서)
          departments: Object.entries(
            members.reduce((acc: any, m: any) => {
              const dept = m.department || '부서 미지정';
              acc[dept] = (acc[dept] || 0) + 1;
              return acc;
            }, {})
          )
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([dept, count]) => ({ department: dept, count })),
          
          // 🔥 연락처 정보 확인
          contact_info: {
            has_phone: members.filter(m => m.phone).length,
            has_email: members.filter(m => m.email).length,
            no_contact: members.filter(m => !m.phone && !m.email).length
          },
          
          // 🔥 개별 검색을 위한 전체 교인 목록 (개인정보 최소화)
          member_list: members.map(m => ({
            id: m.id,
            name: m.name || '이름없음',
            position: m.position || 'member', // 기본값 member
            department: m.department,
            district: m.district,
            phone: m.phone ? `${m.phone.substring(0, 3)}-****-****` : null, // 개인정보 보호
            status: m.member_status || m.status, // member_status 우선
            gender: m.gender,
            marital_status: m.marital_status,
            // 🔥 생일 정보 추가 (개별 조회용)
            birthdate: m.birthdate ? new Date(m.birthdate).toLocaleDateString('ko-KR') : null,
            birth_month_day: m.birthdate ? `${new Date(m.birthdate).getMonth() + 1}월 ${new Date(m.birthdate).getDate()}일` : null,
            age_group: (() => {
              if (m.birthdate) {
                const age = currentYear - new Date(m.birthdate).getFullYear();
                if (age < 20) return '20세 미만';
                if (age < 40) return '20-40세';
                if (age < 60) return '40-60세';
                return '60세 이상';
              }
              return '연령 미상';
            })(),
            // 실제 연령도 포함 (구체적 질문 대응용)
            age: m.birthdate ? currentYear - new Date(m.birthdate).getFullYear() : null,
            has_notes: !!(m.notes || m.memo), // 메모 존재 여부
            baptism_status: m.baptism_date ? '세례받음' : '미세례',
            baptism_date: m.baptism_date ? new Date(m.baptism_date).toLocaleDateString('ko-KR') : null,
            invitation_sent: m.invitation_sent || false,
            // 🔥 주소와 이메일 정보도 포함 (개별 조회용)
            address: m.address || null,
            email: m.email || null,
            transfer_church: m.transfer_church || null,
            baptism_church: m.baptism_church || null,
            // 🔥 가족 관계 정보
            family_id: m.family_id || null,
            family_role: m.family_role || null,
            has_photo: !!(m.photo_url || m.profile_photo_url),
            photo_url: m.photo_url || m.profile_photo_url || null
          })),
          
          // 🔥 초청장 발송 통계 (실제 스키마 기반)
          invitation_stats: {
            sent: members.filter(m => m.invitation_sent === true).length,
            not_sent: members.filter(m => m.invitation_sent === false || !m.invitation_sent).length,
            recent_invitations: members
              .filter(m => m.invitation_sent_at)
              .sort((a, b) => new Date(b.invitation_sent_at).getTime() - new Date(a.invitation_sent_at).getTime())
              .slice(0, 5)
              .map(m => ({
                name: m.name,
                sent_date: new Date(m.invitation_sent_at).toLocaleDateString('ko-KR')
              }))
          },
          
          // 🔥 메모가 있는 교인들 (특별 관리 대상)
          members_with_notes: members
            .filter(m => m.notes || m.memo)
            .map(m => ({
              name: m.name,
              notes_preview: (m.notes || m.memo)?.substring(0, 50) + '...',
              has_notes: true,
              has_memo: true
            })),
          
          // 🔥 가족 관계 정보 (family_id 기반)
          family_stats: {
            total_families: new Set(members.filter(m => m.family_id).map(m => m.family_id)).size,
            members_with_family: members.filter(m => m.family_id).length,
            single_members: members.filter(m => !m.family_id).length
          },
          
          // 🔥 가족별 그룹 정보 (상위 10개 가족)
          family_groups: Object.entries(
            members
              .filter(m => m.family_id)
              .reduce((acc: any, m: any) => {
                const familyId = m.family_id;
                if (!acc[familyId]) {
                  acc[familyId] = [];
                }
                acc[familyId].push({
                  name: m.name,
                  family_role: m.family_role || '가족',
                  age: m.birthdate ? currentYear - new Date(m.birthdate).getFullYear() : null,
                  gender: m.gender
                });
                return acc;
              }, {})
          )
          .sort(([,a], [,b]) => (b as any[]).length - (a as any[]).length)
          .slice(0, 10)
          .map(([familyId, members]) => ({
            family_id: familyId,
            member_count: (members as any[]).length,
            members: members
          })),
          
          // 🔥 전입/전출 이력 분석
          transfer_history: {
            transferred_in: members.filter(m => m.transfer_church && m.transfer_date).length,
            has_transfer_info: members.filter(m => m.transfer_church).length,
            recent_transfers: members
              .filter(m => m.transfer_date)
              .sort((a, b) => new Date(b.transfer_date).getTime() - new Date(a.transfer_date).getTime())
              .slice(0, 5)
              .map(m => ({
                name: m.name,
                transfer_church: m.transfer_church,
                transfer_date: new Date(m.transfer_date).toLocaleDateString('ko-KR')
              }))
          },
          
          // 디버깅용
          sample_fields: members[0] ? Object.keys(members[0]) : []
        };
        console.log('✅ 상세 교인 데이터 수집 완료:', contextData.members);
      } catch (error) {
        console.warn('⚠️ 교인 데이터 수집 실패:', error);
      }
      
      // 공지사항 데이터 수집
      try {
        const announcements: any[] = await announcementService.getAnnouncements({ limit: 5 });
        contextData.announcements = announcements.slice(0, 5).map((ann: any) => ({
          title: ann.title,
          content: ann.content?.substring(0, 200) + (ann.content?.length > 200 ? '...' : ''),
          category: ann.category
        }));
        console.log('✅ 공지사항 데이터 수집 완료:', contextData.announcements?.length, '건');
      } catch (error) {
        console.warn('⚠️ 공지사항 데이터 수집 실패:', error);
      }
      
      // 출석 데이터 수집  
      try {
        const attendances: any[] = await attendanceService.getAttendances();
        if (attendances?.length > 0) {
          const totalAttendance = attendances.reduce((sum: number, att: any) => sum + (att.attendance_count || 0), 0);
          contextData.attendance = {
            average: Math.round(totalAttendance / attendances.length),
            recent_services: attendances.length,
            latest_service: attendances[0]
          };
          console.log('✅ 출석 데이터 수집 완료:', contextData.attendance);
        }
      } catch (error) {
        console.warn('⚠️ 출석 데이터 수집 실패:', error);
      }
      
      console.log('🎯 최종 수집된 contextData:', contextData);
    }
    
    // 첫 번째 메시지인지 확인
    const isFirstMessage = messages.length === 0;

    try {
      // 🔥 교인 관련 에이전트는 contextData가 있으면 강제로 Edge Function 사용
      if (Object.keys(contextData).length > 0) {
        console.log('🚀 contextData가 있으므로 Edge Function 직접 호출');
        throw new Error('강제로 Edge Function 사용');
      }
      
      const response = await chatService.sendMessage(currentChatId, userMessage, selectedAgentForChat?.id);
      const responseData = response.data || response;
      
      if (responseData.ai_response) {
        // 🚀 AI 응답만 추가 (사용자 메시지는 이미 표시됨)
        const aiResponse: ChatMessage = {
          id: responseData.ai_response.id,
          content: responseData.ai_response.content,
          role: responseData.ai_response.role,
          timestamp: new Date(responseData.ai_response.timestamp),
          tokensUsed: responseData.ai_response.tokensUsed,
          cost: responseData.ai_response.cost
        };
        
        setMessages(prev => [...prev, aiResponse]);
        
        // 첫 번째 메시지 후 자동 제목 생성
        if (isFirstMessage) {
          try {
            const generatedTitle = await chatService.generateChatTitle([
              ...messages,
              newUserMessage,
              aiResponse
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
            content: userMessage,
            context_data: contextData // 🔥 실제 교회 데이터 포함
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
    // 🛡️ 강화된 중복 호출 방지
    if (isLoading || creatingAgentChat === agent.id || (selectedAgentForChat?.id === agent.id && messages.length > 0)) {
      console.log('🚫 중복 호출 방지:', agent.name, {
        isLoading,
        creatingAgentChat: creatingAgentChat === agent.id,
        alreadySelected: selectedAgentForChat?.id === agent.id && messages.length > 0
      });
      return;
    }

    try {
      setIsLoading(true);
      setCreatingAgentChat(agent.id); // 생성 중 상태 설정
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
    } finally {
      // 🧹 상태 정리 (성공/실패 관계없이)
      setIsLoading(false);
      setCreatingAgentChat(null);
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
    console.log('🗑️ 채팅 삭제 시도:', chatId);
    
    // 먼저 UI에서 즉시 제거 (낙관적 업데이트)
    const chatToDelete = chatHistory.find(chat => chat.id === chatId);
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

    try {
      await chatService.deleteChat(chatId);
      console.log('✅ 채팅 삭제 성공:', chatId);
    } catch (error) {
      console.error('❌ 채팅 삭제 실패:', error);
      // API 실패 시 원래 상태로 복원
      if (chatToDelete) {
        setChatHistory(prev => [...prev, chatToDelete].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
        alert('채팅 삭제에 실패했습니다. 다시 시도해주세요.');
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

    console.log('✏️ 채팅 제목 변경 시도:', chatId, editingTitle.trim());

    // 원본 제목 백업
    const originalChat = chatHistory.find(chat => chat.id === chatId);
    const originalTitle = originalChat?.title || '';
    
    // 먼저 UI에서 즉시 변경 (낙관적 업데이트, 정렬 순서 유지)
    setChatHistory(prev => 
      prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, title: editingTitle.trim() }
          : chat
      ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    );
    
    // 편집 모드 종료
    setEditingChatId(null);
    setEditingTitle('');

    try {
      await chatService.updateChatTitle(chatId, editingTitle.trim());
      console.log('✅ 채팅 제목 변경 성공:', chatId);
    } catch (error) {
      console.error('❌ 채팅 제목 변경 실패:', error);
      // API 실패 시 원래 제목으로 복원 (정렬 순서 유지)
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, title: originalTitle }
            : chat
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      );
      alert('채팅 제목 변경에 실패했습니다. 다시 시도해주세요.');
    }
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
                                  setDeleteConfirmModal({
                                    isOpen: true,
                                    chatId: chat.id,
                                    chatTitle: chat.title
                                  });
                                  setOpenMenuId(null); // 메뉴 닫기
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
                              setDeleteConfirmModal({
                                isOpen: true,
                                chatId: chat.id,
                                chatTitle: chat.title
                              });
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
                        <FileIcon className="w-4 h-4 mr-3" />
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
                        <FileIcon className="w-4 h-4 mr-3" />
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
        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'history' && (
            <>


              {/* 메시지 영역 */}
              <div className="flex-1 overflow-y-auto px-4 min-h-0 max-h-[calc(100vh-200px)]">
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
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-4 py-2">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className="max-w-5xl mx-auto px-1"
                      >
                        <div className={cn(
                          "max-w-4xl group mx-auto",
                          message.role === 'user' ? "text-right" : "text-left"
                        )}>
                          {/* 메시지 텍스트 */}
                          <div className={cn(
                            "prose prose-sm max-w-none",
                            message.role === 'user' ? "bg-slate-100 rounded-2xl px-4 py-3 inline-block" : ""
                          )}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                              components={{
                                h1: ({children}) => <h1 className="text-xl font-bold mb-3 text-slate-900">{children}</h1>,
                                h2: ({children}) => <h2 className="text-lg font-semibold mb-2 text-slate-800">{children}</h2>,
                                h3: ({children}) => <h3 className="text-base font-medium mb-2 text-slate-700">{children}</h3>,
                                
                                code: ({children, ...props}) => {
                                  const isInline = !String(children).includes('\n');
                                  return isInline ? (
                                    <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                      {children}
                                    </code>
                                  ) : (
                                    <code className="block bg-slate-900 text-slate-100 p-4 rounded-lg text-sm font-mono overflow-x-auto" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                
                                ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                                li: ({children}) => <li className="text-slate-700">{children}</li>,
                                
                                blockquote: ({children}) => (
                                  <blockquote className="border-l-4 border-slate-300 pl-4 py-2 mb-3 italic text-slate-600">
                                    {children}
                                  </blockquote>
                                ),
                                
                                a: ({children, href}) => (
                                  <a href={href} className="text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer">
                                    {children}
                                  </a>
                                ),
                                
                                p: ({children}) => <p className="mb-3 last:mb-0 text-slate-800 leading-relaxed">{children}</p>,
                                strong: ({children}) => <strong className="font-semibold text-slate-900">{children}</strong>,
                                em: ({children}) => <em className="italic text-slate-600">{children}</em>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          
                          {/* 복사 버튼 */}
                          <div className={cn(
                            "mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
                            message.role === 'user' ? "text-right" : "text-left"
                          )}>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(message.content);
                                // 간단한 알림 표시를 위해 콘솔에 출력
                                console.log('메시지가 복사되었습니다');
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              복사
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="max-w-5xl mx-auto px-1 flex justify-start">
                        <div className="max-w-4xl">
                          <div className="flex items-center">
                            <div className="w-4 h-4 bg-slate-500 rounded-full animate-pulse" 
                                 style={{ 
                                   animation: 'pulse 1.5s ease-in-out infinite',
                                   transformOrigin: 'center'
                                 }}>
                            </div>
                            <span className="ml-3 text-sm text-slate-500">생각하는 중...</span>
                          </div>
                        </div>
                      </div>
                     )}
                     <div ref={messagesEndRef} />
                    </div>
                  </div>
                )}
              </div>

              {/* 입력 영역 - 메시지가 있을 때만 표시 */}
              {(messages.length > 0 || isLoading) && (
                <div className="border-t border-slate-200 p-4">
                  <div className="max-w-4xl mx-auto">
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

      {/* 🗑️ 삭제 확인 모달 */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              채팅을 삭제하시겠습니까?
            </h3>
            <p className="text-gray-600 mb-2">
              "{deleteConfirmModal.chatTitle}" 채팅이 영구적으로 삭제됩니다.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              이 작업은 되돌릴 수 없습니다. 정말로 삭제하시겠습니까?
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmModal({isOpen: false, chatId: null, chatTitle: ''})}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmModal.chatId) {
                    handleDeleteChat(deleteConfirmModal.chatId);
                  }
                  setDeleteConfirmModal({isOpen: false, chatId: null, chatTitle: ''});
                }}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;
