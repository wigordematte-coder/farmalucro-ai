import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Sparkles, Plus, Trash2, MessageSquare, Loader2, Brain, TrendingUp, PackageSearch, DollarSign, RefreshCw, ChevronRight, ShieldCheck, Database, Target } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PremiumMessageBubble from '@/components/PremiumMessageBubble';
import { useProducts } from '@/hooks/useProducts';
import { useRecommendations } from '@/hooks/useRecommendations';
import { usePharmacy } from '@/lib/pharmacyContext';
import { formatCurrency, calculatePotentialProfit, calculateInventoryValue, isExpiringSoon } from '@/lib/pricing';
import { PHARMACY_BENCHMARKS } from '@/lib/constants';
import { buildRecommendationStats } from '@/lib/recommendationMetrics';
import { useUserRole } from '@/lib/roles';
import { belongsToTenant, filterByTenant, TENANT_REQUIRED_MESSAGE, withRequiredTenantId } from '@/lib/tenant';
import { cn } from '@/lib/utils';

const SUGGESTED_QUESTIONS = [
  { icon: PackageSearch, label: 'Quais produtos devo revisar primeiro?', color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100 hover:border-amber-300' },
  { icon: TrendingUp, label: 'Onde estou perdendo margem?', color: 'text-red-500', bg: 'bg-red-50 border-red-100 hover:border-red-300' },
  { icon: DollarSign, label: 'Quais itens estao em revisao manual?', color: 'text-accent', bg: 'bg-accent/5 border-accent/20 hover:border-accent/50' },
  { icon: Target, label: 'Qual oportunidade tem maior impacto?', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100 hover:border-blue-300' },
  { icon: RefreshCw, label: 'Quais produtos precisam reposição?', color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100 hover:border-purple-300' },
  { icon: Sparkles, label: 'Como reduzir meu estoque parado?', color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100 hover:border-orange-300' },
];

export default function AIAssistant() {
  const { products } = useProducts();
  const { settings } = usePharmacy();
  const { tenantId, isSuperAdmin, loading: roleLoading } = useUserRole();
  const { recommendations, metrics } = useRecommendations();
  const { opportunities, stats: oppStats } = buildRecommendationStats(recommendations);
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      if (roleLoading) return;
      if (!isSuperAdmin && !tenantId) {
        setConversations([]);
        return;
      }
      const list = isSuperAdmin
        ? await base44.entities.ChatConversation.list('-created_date', 50)
        : await base44.entities.ChatConversation.filter({ tenant_id: tenantId }, '-created_date', 50);
      const tenantConversations = isSuperAdmin ? (list || []) : filterByTenant(list, tenantId);
      setConversations(tenantConversations);
      if (tenantConversations && tenantConversations.length > 0 && !currentConvId) {
        setCurrentConvId(tenantConversations[0].id);
      }
    } catch {
      setConversations([]);
    }
  }, [currentConvId, tenantId, isSuperAdmin, roleLoading]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const loadMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      if (roleLoading) return;
      const conversation = conversations.find(conv => conv.id === convId);
      if (!isSuperAdmin && !belongsToTenant(conversation, tenantId)) {
        setMessages([]);
        return;
      }
      const messageFilter = isSuperAdmin
        ? { conversation_id: convId }
        : { conversation_id: convId, tenant_id: tenantId };
      const list = await base44.entities.ChatMessage.filter(messageFilter, '-created_date', 200);
      const tenantMessages = isSuperAdmin ? (list || []) : filterByTenant(list, tenantId);
      setMessages(tenantMessages.reverse());
    } catch {
      setMessages([]);
    }
  }, [conversations, tenantId, isSuperAdmin, roleLoading]);

  useEffect(() => { if (currentConvId) loadMessages(currentConvId); }, [currentConvId, loadMessages]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const buildContext = useCallback(() => {
    if (!products || products.length === 0) return 'Nenhum produto cadastrado ainda.';
    const pendingRecommendations = recommendations.filter(item => item.status === 'pending').slice(0, 12);
    const approvedRecommendations = recommendations.filter(item => item.status === 'approved').slice(0, 8);
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

RECOMENDACOES PENDENTES DO PLANO DE ACAO:
- Pendentes: ${metrics.pendingCount}
- Aprovadas: ${metrics.approvedCount}
- Aplicadas: ${metrics.appliedCount}
- Lucro potencial pendente: ${formatCurrency(metrics.estimatedPotential)}
- Lucro realizado medido: ${formatCurrency(metrics.realizedGain)}
TOP RECOMENDACOES PENDENTES: ${pendingRecommendations.map(r => `${r.title} | Produto: ${r.product_name || 'Produto'} | Atual: ${formatCurrency(r.current_price)} | Sugerido: ${formatCurrency(r.suggested_price)} | Ganho: ${formatCurrency(r.estimated_monthly_gain)}/mes | Confianca: ${r.confidence || 0}% | Motivo: ${r.reason || r.description || 'Sem motivo registrado'}`).join(' || ') || 'Nenhuma'}
RECOMENDACOES APROVADAS PARA APLICAR: ${approvedRecommendations.map(r => `${r.title} | Produto: ${r.product_name || 'Produto'} | Ganho estimado: ${formatCurrency(r.estimated_monthly_gain)}/mes`).join(' || ') || 'Nenhuma'}

PRODUTOS CURVA A: ${classA.map(p => `${p.name} | Custo: ${formatCurrency(p.cost)} | Preço: ${formatCurrency(p.selected_price)} | Margem: ${(p.margin_pct || 0).toFixed(1)}% | Vendas/mês: ${p.monthly_sales || 0}`).join('; ') || 'Nenhum'}
PRODUTOS CURVA B: ${classB.map(p => `${p.name} | Custo: ${formatCurrency(p.cost)} | Preço: ${formatCurrency(p.selected_price)} | Margem: ${(p.margin_pct || 0).toFixed(1)}%`).join('; ') || 'Nenhum'}
PRODUTOS CURVA C: ${classC.map(p => `${p.name} | Custo: ${formatCurrency(p.cost)} | Estoque: ${p.quantity || 0} | Valor parado: ${formatCurrency((p.cost || 0) * (p.quantity || 0))}`).join('; ') || 'Nenhum'}
PRODUTOS ALTA MARGEM: ${highMargin.map(p => `${p.name} | Margem: ${(p.margin_pct || 0).toFixed(1)}% | Lucro/un: ${formatCurrency(p.unit_profit || 0)}`).join('; ') || 'Nenhum'}
PRODUTOS PRÓXIMOS DO VENCIMENTO: ${expiring.map(p => `${p.name} | Validade: ${p.expiration_date}`).join('; ') || 'Nenhum'}

OPORTUNIDADES (${opportunities.length} total):
- Lucro potencial mensal: ${formatCurrency(oppStats?.totalMonthly || 0)}
- Margem baixa: ${oppStats?.byType?.margem_baixa || 0} | Estoque parado: ${oppStats?.byType?.estoque_parado || 0} | Promoções: ${oppStats?.byType?.promocao_recomendada || 0} | Reposição: ${oppStats?.byType?.reposicao_inteligente || 0}
TOP OPORTUNIDADES: ${opportunities.filter(o => o.priority === 'alta').slice(0, 10).map(o => `[${o.type}] ${o.product_name}: ${o.description} (${formatCurrency(o.financial_impact_monthly)}/mês, ${o.confidence}%)`).join(' | ') || 'Nenhuma'}

BENCHMARKS: ${Object.entries(PHARMACY_BENCHMARKS.categories).map(([cat, data]) => `${cat}: margem ${data.typical_margin}%, markup ${data.typical_markup}%, giro ${data.turnover_days}d`).join(' | ')}`;
  }, [products, settings, opportunities, oppStats, recommendations, metrics]);

  const handleSend = async (text) => {
    const question = text || input;
    if (!question.trim() || loading) return;
    if (!tenantId) {
      alert(TENANT_REQUIRED_MESSAGE);
      return;
    }

    let convId = currentConvId;
    if (!convId) {
      try {
        const conv = await base44.entities.ChatConversation.create(withRequiredTenantId({ title: question.substring(0, 40) }, tenantId));
        convId = conv.id;
        setCurrentConvId(convId);
        setConversations(prev => [conv, ...prev]);
      } catch { return; }
    } else {
      const conversation = conversations.find(conv => conv.id === convId);
      if (!belongsToTenant(conversation, tenantId)) {
        alert('Esta conversa não pertence à empresa vinculada ao seu usuário.');
        return;
      }
    }

    const userMsg = { role: 'user', content: question, conversation_id: convId };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      await base44.entities.ChatMessage.create(withRequiredTenantId({ conversation_id: convId, role: 'user', content: question }, tenantId));

      const context = buildContext();
      const prompt = `Você é o "Consultor FarmaLucro AI", um especialista sênior em gestão farmacêutica com foco em lucratividade, precificação estratégica e giro de estoque.

REGRA FUNDAMENTAL: Toda recomendação DEVE incluir justificativa baseada nos dados reais da farmácia. NUNCA diga apenas "aumente o preço" — explique o PORQUÊ com os dados.

FORMATO DE RESPOSTA OBRIGATÓRIO:
Estruture suas respostas com seções claras usando markdown:
- Use **negrito** para valores em R$, percentuais e nomes de produtos
- Use ### para seções: ### 📊 ANÁLISE, ### 💰 IMPACTO FINANCEIRO, ### ✅ AÇÃO RECOMENDADA
- Liste produtos específicos com dados concretos
- Termine com um resumo executivo do impacto total estimado

INSTRUCAO DE PRIORIDADE: se houver recomendacoes pendentes no Plano de Acao, comece por elas e so depois use produtos, estoque e benchmarks como apoio.

${context}

PERGUNTA: ${question}

Responda de forma estruturada, prática e acionável, citando produtos, valores e percentuais específicos:`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'gemini_3_flash',
        add_context_from_internet: true,
      });

      const responseText = typeof result === 'string' ? result : (result?.response || JSON.stringify(result));
      const assistantMsg = { role: 'assistant', content: responseText, conversation_id: convId };
      setMessages(prev => [...prev, assistantMsg]);

      await base44.entities.ChatMessage.create(withRequiredTenantId({ conversation_id: convId, role: 'assistant', content: responseText }, tenantId));
      await base44.entities.ChatConversation.update(convId, { last_message: question.substring(0, 50) });
      loadConversations();
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, tive um problema ao processar sua solicitação. Tente novamente.', conversation_id: convId }]);
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
      const conversation = conversations.find(conv => conv.id === id);
      if (!belongsToTenant(conversation, tenantId)) {
        alert('Esta conversa não pertence à empresa vinculada ao seu usuário.');
        return;
      }
      await base44.entities.ChatMessage.deleteMany({ conversation_id: id, tenant_id: tenantId });
      await base44.entities.ChatConversation.delete(id);
      if (currentConvId === id) { setCurrentConvId(null); setMessages([]); }
      loadConversations();
    } catch {}
  };

  const highPriorityCount = opportunities.filter(o => o.priority === 'alta').length;
  const monthlyImpact = oppStats?.totalMonthly || 0;

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[calc(100vh-10rem)] lg:h-[calc(100vh-8rem)]">

      {/* Sidebar de conversas */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowSidebar(false)} />
      )}
      <aside className={cn(
        "lg:w-72 lg:flex-shrink-0 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm",
        showSidebar
          ? "fixed left-0 top-0 bottom-0 w-72 z-50 rounded-none"
          : "hidden lg:flex"
      )}>
        {/* Header sidebar */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 via-ai/5 to-accent/5">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-ai" />
            <span className="font-semibold text-sm text-foreground">Conversas</span>
          </div>
          <button onClick={() => setShowSidebar(false)} className="lg:hidden text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="p-3 border-b border-border/70">
          <button
            onClick={handleNewConversation}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-ai to-purple-600 text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nova Consulta
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2 space-y-1">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={cn(
                "group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                currentConvId === conv.id
                  ? "bg-ai/10 border border-ai/20"
                  : "hover:bg-muted border border-transparent"
              )}
              onClick={() => { setCurrentConvId(conv.id); setShowSidebar(false); }}
            >
              <div className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                currentConvId === conv.id ? "bg-ai" : "bg-muted-foreground/30"
              )} />
              <span className="text-xs text-foreground truncate flex-1">{conv.title || 'Consulta'}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma consulta ainda</p>
          )}
        </div>
      </aside>

      {/* Área principal do chat */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm min-h-[680px] lg:min-h-0">

        {/* Header premium */}
        <div className="relative p-4 lg:p-5 border-b border-border overflow-hidden bg-gradient-to-br from-primary/[0.04] via-ai/[0.03] to-accent/[0.04]">
          <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSidebar(true)} className="lg:hidden mr-1 text-muted-foreground">
                <MessageSquare className="w-5 h-5" />
              </button>
              {/* Avatar premium */}
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl gradient-ai flex items-center justify-center shadow-lg shadow-ai/20">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent border-2 border-card flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-foreground text-base">Consultor FarmaLucro AI</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-ai/10 text-ai font-semibold border border-ai/20">PRO</span>
                </div>
                <p className="text-xs text-muted-foreground">Especialista em lucratividade farmacêutica · <span className="text-accent font-medium">online com dados do tenant atual</span></p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <AssistantMetric icon={Database} label="Produtos" value={products?.length || 0} />
              <AssistantMetric icon={DollarSign} label="Impacto/mês" value={formatCurrency(monthlyImpact)} />
              <AssistantMetric icon={Target} label="Prioridade" value={highPriorityCount} />
            </div>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 sm:p-4 lg:p-5 space-y-1 bg-gradient-to-b from-muted/20 to-background/20">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 px-2 sm:px-4">
              {/* Avatar grande */}
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-3xl gradient-ai flex items-center justify-center shadow-xl shadow-ai/25">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent border-2 border-card flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">Consultor FarmaLucro AI</h3>
              <p className="text-sm text-muted-foreground mb-2 max-w-sm">
                Seu especialista em rentabilidade farmacêutica.
              </p>
              <p className="text-xs text-muted-foreground mb-7 max-w-md">
                Analiso seus dados em tempo real e entrego recomendações precisas com impacto financeiro estimado.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                {SUGGESTED_QUESTIONS.map(({ icon: Icon, label, color, bg }) => (
                  <button
                    key={label}
                    onClick={() => handleSend(label)}
                    disabled={loading}
                    className={cn(
                      "group flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all disabled:opacity-50",
                      bg
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform", color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-foreground font-medium leading-snug">{label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <PremiumMessageBubble key={i} message={msg} />
          ))}

          {loading && (
            <div className="flex gap-3 py-2">
              <div className="flex-shrink-0 w-10 h-10 rounded-2xl gradient-ai flex items-center justify-center shadow-md shadow-ai/20">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gradient-to-br from-ai/5 to-purple-50 border border-ai/20 rounded-2xl rounded-tl-sm px-5 py-4 max-w-xs">
                <div className="flex items-center gap-2 text-sm text-ai font-medium mb-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando dados da sua farmácia...
                </div>
                <p className="text-xs text-muted-foreground">Processando estoque, margens e oportunidades</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input premium */}
        <div className="p-3 sm:p-4 border-t border-border bg-card">
          {messages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-3 mb-3">
              {SUGGESTED_QUESTIONS.slice(0, 4).map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  onClick={() => handleSend(label)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 flex-shrink-0 rounded-full border border-border bg-muted/40 hover:bg-muted px-3 py-1.5 text-xs text-foreground transition-colors disabled:opacity-50"
                >
                  <Icon className="w-3.5 h-3.5 text-ai" /> {label}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Pergunte ao Consultor FarmaLucro AI..."
                rows={1}
                className="w-full resize-none px-4 py-3 pr-4 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ai/30 focus:border-ai/50 max-h-32 placeholder:text-muted-foreground"
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-11 h-11 rounded-2xl gradient-ai text-white flex items-center justify-center shadow-md shadow-ai/25 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 text-center flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3 h-3" /> IA com dados reais filtrados por tenant · Enter envia
          </p>
        </div>
      </div>
    </div>
  );
}

function AssistantMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card/80 px-3 py-2 shadow-sm min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="w-3.5 h-3.5 text-ai" />
        <span className="truncate">{label}</span>
      </div>
      <p className="text-sm font-bold text-foreground truncate mt-0.5">{value}</p>
    </div>
  );
}
