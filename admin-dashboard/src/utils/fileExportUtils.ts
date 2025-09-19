import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { ChatMessage } from '../types/chat';

/**
 * 브라우저 내장 다운로드 함수
 */
export const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 현재 채팅 제목 가져오기
 */
export const getCurrentChatTitle = (currentChatId: string | null, chatHistory: any[]) => {
  const currentChat = chatHistory.find(chat => chat.id === currentChatId);
  return currentChat ? currentChat.title : '새로운 채팅';
};

/**
 * 메시지를 내보내기용으로 포맷팅
 */
export const formatMessagesForExport = (messages: ChatMessage[]) => {
  return messages.map(msg => ({
    role: msg.role === 'user' ? '사용자' : 'AI',
    content: msg.content,
    timestamp: msg.timestamp.toLocaleString('ko-KR')
  }));
};

/**
 * TXT 파일로 다운로드
 */
export const downloadAsTXT = (messages: ChatMessage[], chatTitle: string) => {
  const formattedMessages = formatMessagesForExport(messages);
  const content = formattedMessages.map(msg => 
    `[${msg.timestamp}] ${msg.role}: ${msg.content}`
  ).join('\n\n');
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  downloadFile(blob, `${chatTitle}.txt`);
};

/**
 * Markdown 파일로 다운로드
 */
export const downloadAsMD = (messages: ChatMessage[], chatTitle: string) => {
  const formattedMessages = formatMessagesForExport(messages);
  const content = `# ${chatTitle}\n\n` + 
    formattedMessages.map(msg => 
      `## ${msg.role} (${msg.timestamp})\n\n${msg.content}`
    ).join('\n\n---\n\n');
  
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  downloadFile(blob, `${chatTitle}.md`);
};

/**
 * PDF 파일로 다운로드
 */
export const downloadAsPDF = (messages: ChatMessage[], chatTitle: string) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPosition = margin;

  // 제목 추가
  doc.setFontSize(18);
  doc.text(chatTitle, margin, yPosition);
  yPosition += 15;

  // 메시지들 추가
  const formattedMessages = formatMessagesForExport(messages);
  
  formattedMessages.forEach((msg, index) => {
    // 페이지 넘김 체크
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    // 역할과 시간
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${msg.role} (${msg.timestamp})`, margin, yPosition);
    yPosition += 10;

    // 내용
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // 텍스트를 줄바꿈 처리
    const lines = doc.splitTextToSize(msg.content, doc.internal.pageSize.width - 2 * margin);
    
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });

    yPosition += 10; // 메시지 간 간격
  });

  doc.save(`${chatTitle}.pdf`);
};

/**
 * DOCX 파일로 다운로드
 */
export const downloadAsDOCX = async (messages: ChatMessage[], chatTitle: string) => {
  const formattedMessages = formatMessagesForExport(messages);
  
  const children = [
    new Paragraph({
      children: [new TextRun({ text: chatTitle, bold: true, size: 32 })],
    }),
    new Paragraph({ children: [new TextRun("")] }), // 빈 줄
  ];

  formattedMessages.forEach(msg => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${msg.role} (${msg.timestamp})`, bold: true }),
        ],
      }),
      new Paragraph({
        children: [new TextRun(msg.content)],
      }),
      new Paragraph({ children: [new TextRun("")] }) // 빈 줄
    );
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  downloadFile(blob, `${chatTitle}.docx`);
};
