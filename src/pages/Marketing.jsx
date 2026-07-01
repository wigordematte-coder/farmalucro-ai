import { useState, useEffect } from 'react';
import { Instagram, MessageCircle, Printer, Sparkles, Copy, Check, Loader2, Megaphone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import EmptyState from '@/components/EmptyState';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency } from '@/lib/pricing';
import { useUserRole } from '@/lib/roles';
import { filterByTenant, withTenantId } from '@/lib/tenant';
import { cn } from '@/lib/utils';

const CHANNELS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'bg-green-500' },
  { key: 'poster', label: 'Cartaz', icon: Printer, color: 'bg-blue-500' },
];

export default function Marketing() {
  const { products, loading } = useProducts();
  const { tenantId, isSuperAdmin, loading: roleLoading } = useUserRole();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [channel, setChannel] = useState('instagram');
  const [generated, setGenerated] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    try {
      if (roleLoading) return;
      const list = await base44.entities.MarketingContent.list('-created_date', 10);
      setHistory(isSuperAdmin ? (list || []) : filterByTenant(list, tenantId));
    } catch (e) {}
  };

  useEffect(() => {
    loadHistory();
  }, [tenantId, isSuperAdmin, roleLoading]);

  const handleGenerate = async () => {
    if (!selectedProduct) return;
    setGenerating(true);
    setGenerated(null);
    try {
      const channelNames = { instagram: 'Instagram', whatsapp: 'WhatsApp', poster: 'Cartaz/Offline' };
      const prompt = `Você é um especialista em marketing farmacêutico. Crie conteúdo promocional para ${channelNames[channel]} sobre o produto:

Produto: ${selectedProduct.name}
Fabricante: ${selectedProduct.manufacturer || 'N/A'}
Categoria: ${selectedProduct.category || 'N/A'}
Preço: ${formatCurrency(selectedProduct.selected_price)}
Custo: ${formatCurrency(selectedProduct.cost)}

${channel === 'instagram' ? 'Crie: 1) Um título chamativo (máx 50 chars), 2) Uma legenda envolvente (máx 300 chars com emojis), 3) 8-10 hashtags relevantes separadas por espaço.' : ''}
${channel === 'whatsapp' ? 'Crie uma mensagem pronta para WhatsApp, direta e persuasiva (máx 200 chars), com emoji e chamada para ação.' : ''}
${channel === 'poster' ? 'Crie: 1) Um título de impacto para cartaz (máx 30 chars), 2) Uma descrição breve (máx 100 chars), 3) Uma chamada para ação forte (máx 20 chars).' : ''}

Retorne em JSON com os campos: title, caption, hashtags, cta.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            caption: { type: 'string' },
            hashtags: { type: 'string' },
            cta: { type: 'string' },
          }
        }
      });

      setGenerated(result);

      await base44.entities.MarketingContent.create(withTenantId({
        channel,
        product_name: selectedProduct.name,
        title: result.title || '',
        caption: result.caption || '',
        hashtags: result.hashtags || '',
        cta: result.cta || '',
      }, tenantId));
      loadHistory();
    } catch (e) {
      setGenerated({
        title: 'Erro ao gerar conteúdo',
        caption: 'Tente novamente em alguns instantes.',
        hashtags: '',
        cta: '',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text || '');
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Marketing</h1>
        <p className="text-sm text-muted-foreground">Gere conteúdo promocional automático para Instagram, WhatsApp e Cartaz</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <label className="text-sm font-medium text-foreground mb-2 block">1. Selecione o produto</label>
            {products.length === 0 ? (
              <EmptyState icon={Megaphone} title="Nenhum produto" description="Cadastre produtos para gerar conteúdo." />
            ) : (
              <div className="max-h-56 overflow-y-auto scrollbar-thin space-y-1">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedProduct(p); setGenerated(null); }}
                    className={cn("w-full text-left p-2.5 rounded-lg text-sm transition-colors", selectedProduct?.id === p.id ? "bg-accent/10 border border-accent/30" : "hover:bg-muted border border-transparent")}
                  >
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(p.selected_price)} · {p.category || 'Sem categoria'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4">
            <label className="text-sm font-medium text-foreground mb-2 block">2. Escolha o canal</label>
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map(ch => (
                <button
                  key={ch.key}
                  onClick={() => { setChannel(ch.key); setGenerated(null); }}
                  className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all", channel === ch.key ? "border-accent bg-accent/5" : "border-border hover:bg-muted")}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", ch.color)}>
                    <ch.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">{ch.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedProduct || generating}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando conteúdo...</> : <><Sparkles className="w-4 h-4" /> Gerar com IA</>}
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4">
          <h3 className="font-semibold text-sm text-foreground mb-3">Conteúdo Gerado</h3>
          {generating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-accent animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Criando conteúdo com IA...</p>
            </div>
          ) : generated ? (
            <div className="space-y-4">
              {generated.title && (
                <ContentBlock label="Título" text={generated.title} onCopy={() => handleCopy(generated.title, 'title')} copied={copied === 'title'} channel={channel} />
              )}
              {generated.caption && (
                <ContentBlock label={channel === 'whatsapp' ? 'Mensagem' : 'Legenda'} text={generated.caption} onCopy={() => handleCopy(generated.caption, 'caption')} copied={copied === 'caption'} channel={channel} />
              )}
              {generated.hashtags && (
                <ContentBlock label="Hashtags" text={generated.hashtags} onCopy={() => handleCopy(generated.hashtags, 'hashtags')} copied={copied === 'hashtags'} channel={channel} />
              )}
              {generated.cta && (
                <ContentBlock label="Chamada para Ação" text={generated.cta} onCopy={() => handleCopy(generated.cta, 'cta')} copied={copied === 'cta'} channel={channel} />
              )}
              {channel === 'whatsapp' && generated.caption && (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(generated.caption)}`}
                  target="_blank"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white font-medium text-sm hover:bg-green-600"
                >
                  <MessageCircle className="w-4 h-4" /> Compartilhar no WhatsApp
                </a>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="w-10 h-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Selecione um produto e gere conteúdo com IA</p>
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm text-foreground mb-2">Histórico Recente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map(h => {
              const ch = CHANNELS.find(c => c.key === h.channel);
              return (
                <div key={h.id} className="bg-card border border-border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {ch && <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white", ch.color)}><ch.icon className="w-4 h-4" /></div>}
                    <span className="text-xs font-medium truncate">{h.product_name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{h.caption || h.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ContentBlock({ label, text, onCopy, copied, channel }) {
  return (
    <div className="p-3 rounded-xl bg-muted/50 border border-border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <button onClick={onCopy} className="text-xs text-accent-dark hover:text-accent flex items-center gap-1">
          {copied ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
        </button>
      </div>
      {channel === 'whatsapp' ? <p className="text-sm text-foreground whitespace-pre-wrap">{text}</p> : <p className="text-sm text-foreground whitespace-pre-wrap">{text}</p>}
    </div>
  );
}
