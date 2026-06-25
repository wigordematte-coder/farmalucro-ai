import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Lightbulb } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { calculatePotentialProfit, calculateInventoryValue, formatCurrency } from '@/lib/pricing';
import { PHARMACY_BENCHMARKS } from '@/lib/constants';

export default function InsightBanner({ products, settings }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!products || products.length === 0) {
      setInsight('Comece importando sua primeira nota fiscal para receber insights personalizados da IA.');
      setLoading(false);
      return;
    }

    const generateInsight = async () => {
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
        setInsight(result.insight);
      } catch (e) {
        const classC = products.filter(p => p.abc_class === 'C');
        const value = calculateInventoryValue(classC);
        if (classC.length > 0) {
          setInsight(`Você possui ${formatCurrency(value)} parados em ${classC.length} produtos de baixo giro (Curva C). Recomenda-se criar uma campanha promocional para liberar capital e aumentar o giro de estoque.`);
        } else {
          setInsight('Seus produtos estão bem distribuídos. Continue monitorando o giro de estoque e otimizando margens para maximizar o lucro.');
        }
      } finally {
        setLoading(false);
      }
    };

    generateInsight();
  }, [products, settings]);

  return (
    <div className="relative overflow-hidden rounded-2xl gradient-farma p-5 lg:p-6 text-white">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
      <div className="relative flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
          {loading ? (
            <RefreshCw className="w-6 h-6 animate-spin" />
          ) : (
            <Sparkles className="w-6 h-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-accent" />
              Insight do Dia — Consultor FarmaLucro AI
            </h3>
          </div>
          <p className="text-sm lg:text-base text-white/90 leading-relaxed">
            {insight || 'Carregando insight...'}
          </p>
        </div>
      </div>
    </div>
  );
}