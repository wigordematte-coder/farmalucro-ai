import ReactMarkdown from 'react-markdown';
import { Bot, User, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
        isUser ? "bg-primary text-primary-foreground" : "gradient-farma text-white"
      )}>
        {isUser ? <User className="w-4.5 h-4.5" /> : <Bot className="w-5 h-5" />}
      </div>
      <div className={cn("flex-1 max-w-[85%] group", isUser ? "flex flex-col items-end" : "")}>
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-card border border-border rounded-tl-sm"
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-p:leading-relaxed prose-strong:text-foreground prose-ul:my-1.5 prose-li:my-0.5 prose-headings:text-foreground prose-headings:my-2 prose-code:text-accent-dark prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown>{message.content || ''}</ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && message.content && (
          <button
            onClick={handleCopy}
            className="mt-1 ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copied ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
          </button>
        )}
      </div>
    </div>
  );
}