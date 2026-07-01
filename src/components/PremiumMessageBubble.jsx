import ReactMarkdown from 'react-markdown';
import { Brain, User, Copy, Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function PremiumMessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 sm:gap-3 py-1.5">
        <div className="max-w-[88%] sm:max-w-[78%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-sm">
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
        </div>
        <div className="hidden sm:flex flex-shrink-0 w-9 h-9 rounded-xl bg-primary items-center justify-center shadow-sm">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 sm:gap-3 py-2">
      {/* Avatar IA premium */}
      <div className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-2xl gradient-ai items-center justify-center shadow-md shadow-ai/20 mt-0.5">
        <Brain className="w-5 h-5 text-white" />
      </div>

      {/* Card premium da resposta */}
      <div className="flex-1 max-w-full sm:max-w-[92%] group">
        {/* Label do consultor */}
        <div className="flex items-center gap-1.5 mb-1.5 px-1">
          <span className="sm:hidden w-5 h-5 rounded-lg gradient-ai flex items-center justify-center">
            <Brain className="w-3 h-3 text-white" />
          </span>
          <span className="text-xs font-semibold text-ai">Consultor FarmaLucro AI</span>
          <Sparkles className="w-3 h-3 text-ai/60" />
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-card to-ai/[0.03] border border-ai/15 rounded-2xl sm:rounded-tl-sm px-4 sm:px-5 py-4 shadow-sm">
          {/* Decoração sutil no canto */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-ai/30 via-accent/30 to-transparent" />
          <div className="absolute top-0 left-0 w-1 h-full rounded-l-full bg-gradient-to-b from-ai to-accent opacity-40" />

          <div className="prose prose-sm max-w-none
            prose-p:my-2 prose-p:leading-relaxed prose-p:text-foreground
            prose-strong:text-accent-dark prose-strong:font-semibold
            prose-ul:my-2 prose-li:my-1.5 prose-li:text-foreground
            prose-ol:my-2 prose-ol:pl-5 prose-ul:pl-5
            prose-headings:text-foreground prose-headings:font-bold
            prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2 prose-h3:border-b prose-h3:border-border prose-h3:pb-1.5
            prose-code:text-ai prose-code:bg-ai/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:font-medium
            prose-blockquote:border-l-ai/40 prose-blockquote:text-muted-foreground
            prose-table:text-sm prose-th:bg-muted prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1
          ">
            <ReactMarkdown>{message.content || ''}</ReactMarkdown>
          </div>
        </div>

        {/* Ação copiar */}
        {message.content && (
          <button
            onClick={handleCopy}
            className={cn(
              "mt-1.5 ml-1 inline-flex items-center gap-1 text-[11px] transition-all rounded-lg px-2 py-0.5",
              copied
                ? "text-accent bg-accent/10"
                : "text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
            )}
          >
            {copied ? <><Check className="w-3 h-3" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar resposta</>}
          </button>
        )}
      </div>
    </div>
  );
}
