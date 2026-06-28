import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Sparkles, Bot, MessageSquare, Plus, Trash2, FileText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MessageBubble from '@/components/MessageBubble';
import { useProducts } from '@/hooks/useProducts';
import { useOpportunities } from '@/hooks/useOpportunities';
import { usePharmacy } from '@/lib/pharmacyContext';
import { formatCurrency, calculatePotentialProfit, calculateInventoryValue, isExpiringSoon } from '@/lib/pricing';
import { PHARMACY_BENCHMARKS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const SUGGESTED_QUESTIONS = [
  'Quais produtos devo promover?',
  'Onde estou perdendo margem?',
  'Quais produtos devo aumentar preço?',
  'Qual categoria gera mais lucro?',
  'Quais produtos possuem baixo giro?',
];

export default function AIAssistant() {
  const { products } = useProducts();
  const { settings } = usePharmacy();
  const { opportunities, stats: oppStats } = useOpportunities(products, settings);
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const list = await base44.entities.ChatConversation.list('-created_date', 50);
      setConversations(list || []);
      if (list && list.length > 0 && !currentConvId) {
        setCurrentConvId(list[0].id);
      }
    } catch (e) {
      setConversations([]);
    }
  }, [currentConvId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      const list = await base44.entities.ChatMessage.filter({ conversation_id: convId }, '-created_date', 200);
      const sorted = (list || []).reverse();
      setMessages(sorted);
    } catch (e) {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (currentConvId) loadMessages(currentConvId);
  }, [currentConvId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = useCallback(() => {
    if (!products || products.length === 0) return 'Nenhum produto cadastrado ainda.';
    const classA = products.filter(p => p.abc_class === 'A').slice(0, 10);
    const classB = products.filter(p => p.abc_class === 'B').slice(0, 10);
    const classC = products.filter(p => p.abc_class === 'C').slice(0, 10);
    const highMargin = products.filter(p => p.high_margin || (p.margin_pct || 0) >= 35).slice(0, 10);
    const expiring = products.filter(p => isExpiringSoon(p.expiration_date)).slice(0, 5);
    const potentialProfit = calculatePotentialProfit(products);
    const inventoryValue = calculateInventoryValue(products);
    const classCValue = calculateInventoryValue(classC);

    return `DADOS DA FARMÁCIA:
- Nome: ${settings?.name || 'Farmácia'}
- Cidade: ${settings?.city || 'Não definida'}
- Objetivo principal: ${settings?.objective || 'profit'}
- Margem mínima: ${settings?.min_margin || 15}%, ideal: ${settings?.ideal_margin || 30}%, máxima: ${settings?.max_margin || 50}%

RESUMO DO ESTOQUE:
- Total de produtos: ${products.length}
- Lucro potencial total: ${formatCurrency(potentialProfit)}
- Valor em estoque: ${formatCurrency(inventoryValue)}
- Capital parado (Curva C): ${formatCurrency(classCValue)}

PRODUTOS CURVA A (alta venda, isca):
${classA.map(p => `- ${p.name} | Custo: ${formatCurrency(p.cost)} | Preço: ${formatCurrency(p.selected_price)} | Margem: ${(p.margin_pct || 0).toFixed(1)}% | Vendas/mês: ${p.monthly_sales || 0}`).join('\n') || 'Nenhum'}

PRODUTOS CURVA B (venda média):
${classB.map(p => `- ${p.name} | Custo: ${formatCurrency(p.cost)} | Preço: ${formatCurrency(p.selected_price)} | Margem: ${(p.margin_pct || 0).toFixed(1)}%`).join('\n') || 'Nenhum'}

PRODUTOS CURVA C (baixa venda, risco encalhe):
${classC.map(p => `- ${p.name} | Custo: ${formatCurrency(p.cost)} | Estoque: ${p.quantity || 0} | Valor parado: ${formatCurrency((p.cost || 0) * (p.quantity || 0))}`).join('\n') || 'Nenhum'}

PRODUTOS ALTA MARGEM:
${highMargin.map(p => `- ${p.name} | Margem: ${(p.margin_pct || 0).toFixed(1)}% | Lucro/un: ${formatCurrency(p.unit_profit || 0)}`).join('\n') || 'Nenhum'}

PRODUTOS PRÓXIMOS DO VENCIMENTO:
${expiring.map(p => `- ${p.name} | Validade: ${p.expiration_date}`).join('\n') || 'Nenhum'}

OPORTUNIDADES IDENTIFICADAS PELO MOTOR DE INTELIGÊNCIA (${opportunities.length} total):
- Lucro potencial mensal: ${formatCurrency(oppStats?.totalMonthly || 0)}
- Lucro potencial anual: ${formatCurrency(oppStats?.totalAnnual || 0)}
- Margem baixa: ${oppStats?.byType?.margem_baixa || 0} oportunidades
- Estoque parado: ${oppStats?.byType?.estoque_parado || 0} oportunidades
- Promoções recomendadas: ${oppStats?.byType?.promocao_recomendada || 0} oportunidades
- Reposição inteligente: ${oppStats?.byType?.reposicao_inteligente || 0} oportunidades

TOP OPORTUNIDADES (prioridade alta):
${opportunities.filter(o => o.priority === 'alta').slice(0, 10).map(o => `- [${o.type}] ${o.product_name}: ${o.description} (Impacto: ${formatCurrency(o.financial_impact_monthly)}/mês, Confiança: ${o.confidence}%)`).join('\n') || 'Nenhuma'}

BENCHMARKS DO SETOR FARMACÊUTICO:
${Object.entries(PHARMACY_BENCHMARKS.categories).map(([cat, data]) => `- ${cat}: margem típica ${data.typical_margin}%, markup ${data.typical_markup}%, giro ${data.turnover_days} dias`).join('\n')}`;
  }, [products, settings, opportunities, oppStats]);

  const handleSend = async (text) => {
    const question = text || input;
    if (!question.trim() || loading) return;

    let convId = currentConvId;
    if (!convId) {
      try {
        const conv = await base44.entities.ChatConversation.create({ title: question.substring(0, 40) });
        convId = conv.id;
        setCurrentConvId(convId);
        setConversations(prev => [conv, ...prev]);
      } catch (e) {
        return;
      }
    }

    const userMsg = { role: 'user', content: question, conversation_id: convId };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      await base44.entities.ChatMessage.create({ conversation_id: convId, role: 'user', content: question });

      const context = buildContext();
      const prompt = `Você é o "Consultor FarmaLucro AI", um especialista em gestão farmacêutica com décadas de experiência em precificação, marketing e giro de estoque de farmácias.

REGRA FUNDAMENTAL — JUSTIFICAR TODA RECOMENDAÇÃO:
Toda recomendação que você fizer (aumentar preço, criar promoção, descontinuar produto, etc.) DEVE obrigatoriamente incluir a justificativa baseada nos dados da farmácia. NUNCA diga apenas "aumente o preço" — sempre explique o PORQUÊ.

Exemplo CORRETO: "Aumente o preço do produto X porque sua margem atual está 12% abaixo da meta de 30% definida, e o produto possui alto giro (vende 45 unidades/mês), então o aumento não deve impactar negativamente o volume de vendas."

Exemplo INCORRETO: "Aumente o preço do produto X."

Estrutura de cada recomendação:
1. **Ação recomendada** (o que fazer)
2. **Justificativa** (por que, com dados: margem atual vs meta, giro de estoque, curva ABC, vencimento, etc.)
3. **Impacto estimado** (lucro adicional, redução de prejuízo, etc.)

Responda à pergunta do usuário de forma prática, direta e acionável. Use os dados da farmácia fornecidos abaixo. Cite nomes de produtos, valores em R$ e porcentagens quando relevante. Use formatação markdown (listas, negrito) para facilitar a leitura.

${context}

PERGUNTA DO USUÁRIO: ${question}

Forneça uma resposta estruturada e prática, justificando cada recomendação com dados:`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'gemini_3_flash',
        add_context_from_internet: true,
      });

      const responseText = typeof result === 'string' ? result : (result?.response || JSON.stringify(result));

      const assistantMsg = { role: 'assistant', content: responseText, conversation_id: convId };
      setMessages(prev => [...prev, assistantMsg]);

      await base44.entities.ChatMessage.create({ conversation_id: convId, role: 'assistant', content: responseText });
      await base44.entities.ChatConversation.update(convId, { last_message: question.substring(0, 50) });
      loadConversations();
    } catch (e) {
      const errorMsg = 'Desculpe, tive um problema ao processar sua solicitação. Tente novamente.';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, conversation_id: convId }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = async () => {
    setCurrentConvId(null);
    setMessages([]);
    setShowSidebar(false);
  };

  const handleDeleteConversation = async (id) => {
    try {
      await base44.entities.ChatMessage.deleteMany({ conversation_id: id });
      await base44.entities.ChatConversation.delete(id);
      if (currentConvId === id) {
        setCurrentConvId(null);
        setMessages([]);
      }
      loadConversations();
    } catch (e) {}
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)]">
      <div className={cn(
        "lg:w-64 lg:flex-shrink-0 lg:relative lg:block",
        showSidebar ? "fixed inset-0 z-40 lg:relative" : "hidden lg:block"
      )}>
        <div className="lg:bg-card lg:border lg:border-border lg:rounded-2xl h-full flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="font-semibold text-sm text-foreground">Conversas</span>
            <button onClick={() => setShowSidebar(false)} className="lg:hidden text-muted-foreground">✕</button>
          </div>
          <button
            onClick={handleNewConversation}
            className="m-3 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark"
          >
            <Plus className="w-4 h-4" /> Nova Conversa
          </button>
          <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2 space-y-1">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                  currentConvId === conv.id ? "bg-primary/10" : "hover:bg-muted"
                )}
                onClick={() => { setCurrentConvId(conv.id); setShowSidebar(false); }}
              >
                <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">{conv.title || 'Conversa'}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma conversa ainda</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(true)} className="lg:hidden text-muted-foreground"><MessageSquare className="w-5 h-5" /></button>
            <div className="w-10 h-10 rounded-xl gradient-farma flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Consultor FarmaLucro AI</p>
              <p className="text-xs text-accent-dark flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> Online</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 rounded-2xl gradient-farma flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Consultor FarmaLucro AI</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">Seu especialista em gestão farmacêutica. Pergunte sobre preços, promoções, lucro e muito mais.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    disabled={loading}
                    className="flex items-center gap-2 p-3 rounded-xl border border-border bg-background hover:border-accent hover:bg-accent/5 text-left text-sm transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="text-foreground">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl gradient-farma flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando dados da farmácia...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Pergunte ao Consultor FarmaLucro AI..."
              rows={1}
              className="flex-1 resize-none px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 max-h-32"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-11 h-11 rounded-xl bg-accent text-accent-foreground flex items-center justify-center hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}