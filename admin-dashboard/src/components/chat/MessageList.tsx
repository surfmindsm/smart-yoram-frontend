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
  const [, setCopiedMessageId] = useState<string | null>(null);

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-1 space-y-4">
        {messages.map((message, index) => (
          <div key={message.id} className="group">
            <div className={cn(
              "flex",
              message.role === 'user' ? "justify-end" : "justify-start"
            )}>
              <div className={cn(
                "max-w-4xl",
                message.role === 'user' ? "text-right" : ""
              )}>
                <div className={cn(
                  "inline-block px-4 py-3 rounded-lg text-left",
                  message.role === 'user' 
                    ? "bg-sky-600 text-white" 
                    : "bg-slate-50 border border-slate-200 text-slate-800"
                )}>
                  {message.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        h1: ({children}) => <h1 className="text-xl font-bold mb-4 text-slate-900">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-semibold mb-3 text-slate-900">{children}</h2>,
                        h3: ({children}) => <h3 className="text-base font-semibold mb-2 text-slate-900">{children}</h3>,
                        
                        ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1 text-slate-800">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-slate-800">{children}</ol>,
                        li: ({children}) => <li className="text-slate-800">{children}</li>,
                        
                        blockquote: ({children}) => (
                          <blockquote className="border-l-4 border-sky-500 pl-4 py-2 mb-3 bg-sky-50 text-slate-700 italic">
                            {children}
                          </blockquote>
                        ),
                        
                        code: ({children, ...props}: any) => {
                          const isInline = !props.className || !props.className.includes('language-');
                          return isInline ? (
                            <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-slate-100 p-3 rounded-lg mb-3 overflow-x-auto">
                              <code className="text-slate-800 text-sm font-mono" {...props}>
                                {children}
                              </code>
                            </pre>
                          );
                        },
                        
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
                  ) : (
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  )}
                </div>
                
                {/* 복사 버튼 */}
                <div className={cn(
                  "mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
                  message.role === 'user' ? "text-right" : "text-left"
                )}>
                  <button
                    onClick={() => copyToClipboard(message.content, message.id)}
                    className="inline-flex items-center px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    복사
                  </button>
                </div>
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
  );
};

export default MessageList;
