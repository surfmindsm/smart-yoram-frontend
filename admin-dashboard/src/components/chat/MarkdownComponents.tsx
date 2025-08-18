import React from 'react';

// ReactMarkdown용 커스텀 컴포넌트들
export const markdownComponents = {
  h1: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
    <h1 className="text-2xl font-bold mb-4" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
    <h2 className="text-xl font-bold mb-3" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
    <h3 className="text-lg font-bold mb-2" {...props}>{children}</h3>
  ),
  code: ({ children, className, ...props }: { children?: React.ReactNode; className?: string; [key: string]: any }) => {
    const match = /language-(\w+)/.exec(className || '');
    return match ? (
      <pre className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 overflow-x-auto my-2">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    ) : (
      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
    <div className="overflow-x-auto" {...props}>
      {children}
    </div>
  ),
  ul: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
    <ul className="list-disc list-inside mb-4 space-y-1" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
    <ol className="list-decimal list-inside mb-4 space-y-1" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
    <li className="mb-1" {...props}>{children}</li>
  ),
  p: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
    <p className="mb-4 leading-relaxed" {...props}>{children}</p>
  ),
  blockquote: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 dark:bg-blue-900/20 italic" {...props}>
      {children}
    </blockquote>
  ),
  a: ({ children, href, ...props }: { children?: React.ReactNode; href?: string; [key: string]: any }) => (
    <a href={href} className="text-sky-600 hover:text-sky-800 underline" target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
  strong: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
    <strong className="font-bold" {...props}>{children}</strong>
  ),
  em: ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => (
    <em className="italic" {...props}>{children}</em>
  ),
};
