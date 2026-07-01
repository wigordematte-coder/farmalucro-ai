import { useState, useMemo, useEffect } from 'react';
import { Sparkles, RefreshCw, Lightbulb, ArrowUpRight, Wand2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { calculatePotentialProfit, calculateInventoryValue, formatCurrency } from '@/lib/pricing';
import { PHARMACY_BENCHMARKS } from '@/lib/constants';

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

export default function InsightBanner({ products, settings, tenantId }) {
  const cacheKey = useMemo(() => (
    tenantId ? `farmalucro:daily-insight:${tenantId}:${getTodayKey()}` : null
  ), [tenantId]);
  const [insight, setInsight] = useState(() => {
    if (!cacheKey) return null;
    try {
      return localStorage.getItem(cacheKey);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!cacheKey || insight) return;
    try {
      setInsight(localStorage.getItem(cacheKey));
    } catch {
      // Cache is optional; ignore storage failures.
    }
  }, [cacheKey, insight]);

  const generateInsight = async () => {
    setError('');
    if (!products || products.length === 0) {
      setInsight('Comece importando sua primeira nota fiscal para receber insights personalizados da IA.');
      return;
    }

    if (cacheKey) {
      try {
        const cachedInsight = localStorage.getItem(cacheKey);
        if (cachedInsight) {
          setInsight(cachedInsight);
          return;
        }
      } catch {
        // Cache is optional; continue without it.
      }
    }

    setLoading(true);
    try {
      const classCProducts = products.filter(p => p.abc_class === 'C');
      const classAProducts = products.filter(p => p.abc_class === 'A');
      const highMarginProducts = products.filter(p => p.high_margin);
      const potentialProfit = calculatePotentialProfit(products);
      const inventoryValue = calculateInventoryValue(classCProducts);
      const topProducts = classCProducts.slice(0, 5).map(p => p.name).join(', ');
      const topMarginProducts = highMarginProducts.slice(0, 3).map(p => p.name).join(', ');
      const iscaProducts = classAProducts.slice(0, 3).map(p => p.name).join(', ');

      const prompt = `Você é o Consultor FarmaLucro AI, especialista em gestão farmacêutica.
Gere UMA recomendação prática e acionável (máximo 3 frases) para uma farmácia com os seguintes dados:
- Nome: ${settings?.name || 'Farmácia'}
- Total de produtos: ${products.length}
- Lucro potencial total: ${formatCurrency(potentialProfit)}
- Produtos Curva C (baixo giro): ${classCProducts.length} produtos, valor parado: ${formatCurrency(inventoryValue)}
- Produtos alta margem: ${highMarginProducts.length}
- Top produtos Curva C para promover: ${topProducts || 'nenhum'}
- Top produtos alta margem: ${topMarginProducts || 'nenhum'}
- Produtos de atração (Curva A): ${iscaProducts || 'nenhum'}

Benchmark do setor: ${PHARMACY_BENCHMARKS.insights.encalhe}

Gere uma recomendação direta e prática, mencionando valores e nomes de produtos quando relevante.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            insight: { type: 'string' },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] }
          }
        }
      });
      const nextInsight = result.insight || '';
      setInsight(nextInsight);
      if (cacheKey && nextInsight) {
        try {
          localStorage.setItem(cacheKey, nextInsight);
        } catch {
          // Cache is optional; failure should not block the insight.
        }
      }
    } catch {
      setError('Não foi possível gerar o insight agora. Tente novamente em alguns instantes.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (insight) {
      setError('');
      return;
    }
    generateInsight();
  };

  const displayText = insight || 'Gere um insight executivo sob demanda com base nos produtos e oportunidades atuais da sua farmácia.';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary via-ai to-accent p-4 lg:p-5 text-white shadow-lg shadow-primary/10">
      <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
      <div className="relative flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/15">
          {loading ? (
            <RefreshCw className="w-6 h-6 animate-spin" />
          ) : (
            <Sparkles className="w-6 h-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-white/80" />
              Insight executivo do dia
            </h3>
            <ArrowUpRight className="w-4 h-4 text-white/70 flex-shrink-0" />
          </div>
          <p className="text-sm lg:text-base text-white/90 leading-relaxed">
            {loading ? 'Analisando seus dados para gerar o insight...' : displayText}
          </p>
          {error && (
            <p className="text-xs text-white/80 mt-2">{error}</p>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || Boolean(insight)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white text-primary px-3.5 py-2 text-xs font-semibold hover:bg-white/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            {insight ? 'Insight gerado hoje' : 'Gerar insight do dia'}
          </button>
        </div>
      </div>
    </div>
  );
}
