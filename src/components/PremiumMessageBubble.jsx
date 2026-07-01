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
      <div className="flex justify-end gap-3 py-1">
        <div className="max-w-[80%]">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-sm">
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
        </div>
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 py-1">
      {/* Avatar IA premium */}
      <div className="flex-shrink-0 w-10 h-10 rounded-2xl gradient-ai flex items-center justify-center shadow-md shadow-ai/20 mt-0.5">
        <Brain className="w-5 h-5 text-white" />
      </div>

      {/* Card premium da resposta */}
      <div className="flex-1 max-w-[90%] group">
        {/* Label do consultor */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-xs font-semibold text-ai">Consultor FarmaLucro AI</span>
          <Sparkles className="w-3 h-3 text-ai/60" />
        </div>

        <div className="relative bg-gradient-to-br from-card to-ai/[0.03] border border-ai/15 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
          {/* Decoração sutil no canto */}
          <div className="absolute top-0 left-0 w-1 h-full rounded-l-full bg-gradient-to-b from-ai to-purple-500 opacity-40" />

          <div className="prose prose-sm max-w-none
            prose-p:my-2 prose-p:leading-relaxed prose-p:text-foreground
            prose-strong:text-foreground prose-strong:font-semibold
            prose-ul:my-2 prose-li:my-1 prose-li:text-foreground
            prose-ol:my-2
            prose-headings:text-foreground prose-headings:font-bold
            prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2
            prose-code:text-ai prose-code:bg-ai/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:font-medium
            prose-blockquote:border-l-ai/40 prose-blockquote:text-muted-foreground
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