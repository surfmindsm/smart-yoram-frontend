import React, { useState } from 'react';
import { ChatMessage } from '../../types/chat';
import { Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '../../lib/utils';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, messagesEndRef }) => {
  return (
    <div className="max-w-5xl mx-auto px-1 space-y-4 py-4">
      {messages.map((message, index) => (
        <div key={message.id} className="max-w-5xl mx-auto px-1">
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
                {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
              </ReactMarkdown>
            </div>
            
            {/* 복사 버튼 */}
            <div className={cn(
              "mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
              message.role === 'user' ? "text-right" : "text-left"
            )}>
              <button
                onClick={() => {
                  const textContent = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
                  navigator.clipboard.writeText(textContent);
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
  );
};

export default MessageList;
