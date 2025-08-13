import React, { useState } from 'react';
import { ChatMessage } from '../../types/chat';
import { Copy, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { markdownComponents } from './MarkdownComponents';
import { cn } from '../../lib/utils';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, messagesEndRef }) => {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

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
    <div className="flex-1 overflow-y-auto px-1 space-y-4">
      {messages.map((message, index) => (
        <div key={message.id} className="group">
          <div className={cn(
            "flex w-full",
            message.role === 'user' ? "justify-end" : "justify-start"
          )}>
            <div className={cn(
              "max-w-[85%] relative",
              message.role === 'user' 
                ? "bg-sky-600 text-white rounded-lg px-4 py-3"
                : "bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm"
            )}>
              {message.role === 'assistant' ? (
                <div className="text-slate-700">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={markdownComponents}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              )}
              
              {/* 복사 버튼 */}
              <button
                onClick={() => copyToClipboard(message.content, message.id)}
                className={cn(
                  "absolute -top-2 -right-2 p-1.5 rounded-full shadow-md transition-all duration-200",
                  "opacity-0 group-hover:opacity-100",
                  message.role === 'user' 
                    ? "bg-sky-700 hover:bg-sky-800 text-white" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                )}
                title="복사"
              >
                <Copy className="w-3 h-3" />
              </button>
              
              {/* 복사 완료 표시 */}
              {copiedMessageId === message.id && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded">
                  복사됨!
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {/* 로딩 인디케이터 */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-sky-600 animate-pulse" />
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
