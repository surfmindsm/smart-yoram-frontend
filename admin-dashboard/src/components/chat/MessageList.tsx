import React, { useState, useEffect } from 'react';
import { ChatMessage } from '../../types/chat';
import { Copy, Database } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '../../lib/utils';

// Query type 라벨 변환 함수
const getQueryTypeLabel = (queryType: string) => {
  const labels: { [key: string]: string } = {
    'pastoral_visit_schedule': '심방 일정',
    'prayer_requests': '중보기도', 
    'announcements': '공지사항',
    'visit_reports': '심방 보고서',
    'member_info': '성도 정보'
  };
  return labels[queryType] || '일반 업무';
};

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  selectedAgent?: { category?: string } | null;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, messagesEndRef, selectedAgent }) => {
  // 메시지 리스트 변경 시 자동 스크롤
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  }, [messages.length, isLoading]);
  
  return (
    <div className="max-w-5xl mx-auto px-1 space-y-4 py-4">
      {messages.map((message, index) => (
        <div key={message.id} className="max-w-5xl mx-auto px-1">
          <div className={cn(
            "max-w-4xl group mx-auto",
            message.role === 'user' ? "text-right" : "text-left"
          )}>
            {/* 비서 에이전트 응답 헤더 */}
            {message.role === 'assistant' && message.is_secretary_agent && (
              <div className="mb-3 flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  👩‍💼 비서 AI
                </span>
                {message.query_type && (
                  <span className="text-xs text-slate-500">
                    {getQueryTypeLabel(message.query_type)}
                  </span>
                )}
              </div>
            )}
            
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
                {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
              </ReactMarkdown>
            </div>
            
            {/* 비서 에이전트 데이터 소스 표시 */}
            {message.role === 'assistant' && message.is_secretary_agent && message.data_sources && message.data_sources.length > 0 && (
              <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2">
                <div className="flex items-center space-x-1">
                  <Database className="w-3 h-3" />
                  <span>조회된 데이터:</span>
                  <span>{message.data_sources.join(', ')}</span>
                </div>
              </div>
            )}
            
            {/* 복사 버튼 */}
            <div className={cn(
              "mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
              message.role === 'user' ? "text-right" : "text-left"
            )}>
              <button
                onClick={() => {
                  const textContent = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
                  navigator.clipboard.writeText(textContent);
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
              <span className="ml-3 text-sm text-slate-500">
                {selectedAgent?.category === 'secretary' 
                  ? '교회 데이터 조회 중...' 
                  : '생각하는 중...'
                }
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* 스크롤 타깃 - 더 나은 가시성을 위해 약간의 여백 추가 */}
      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
};

export default MessageList;
