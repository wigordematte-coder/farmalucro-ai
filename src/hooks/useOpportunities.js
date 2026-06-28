import { useMemo } from 'react';
import { formatCurrency } from '@/lib/pricing';

export const OPPORTUNITY_TYPES = {
  margem_baixa: { label: 'Margem Baixa', icon: 'TrendingUp', color: 'red' },
  estoque_parado: { label: 'Estoque Parado', icon: 'Boxes', color: 'amber' },
  promocao_recomendada: { label: 'Promoção Recomendada', icon: 'Tag', color: 'primary' },
  reposicao_inteligente: { label: 'Reposição Inteligente', icon: 'RefreshCw', color: 'blue' },
  categoria_alto_potencial: { label: 'Categoria de Alto Potencial', icon: 'Star', color: 'accent' },
};

function round2(v) { return Math.round(v * 100) / 100; }

function calcConfidence(product, extra = 0) {
  let score = 40;
  if ((product.cost || 0) > 0) score += 15;
  if ((product.selected_price || 0) > 0) score += 15;
  if (product.monthly_sales !== undefined && product.monthly_sales !== null) score += 15;
  if (product.abc_class) score += 15;
  score += extra;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
  return Math.ceil(diff);
}

export function useOpportunities(products, settings) {
  return useMemo(() => {
    if (!products || products.length === 0) {
      return { opportunities: [], stats: null, topCategories: [] };
    }

    const minMargin = settings?.min_margin || 15;
    const idealMargin = settings?.ideal_margin || 30;
    const opportunities = [];

    // 1. Margem Baixa
    products
      .filter(p => (p.margin_pct || 0) < minMargin && (p.cost || 0) > 0)
      .forEach(p => {
        const idealPrice = p.cost / (1 - idealMargin / 100);
        const currentProfit = (p.selected_price || 0) - p.cost;
        const idealProfit = idealPrice - p.cost;
        const monthlyGain = Math.max(0, (idealProfit - currentProfit) * (p.monthly_sales || 0));
        opportunities.push({
          type: 'margem_baixa',
          product_name: p.name,
          category: p.category || 'Sem categoria',
          description: `Recomendamos revisar o preço deste produto. Margem atual de ${(p.margin_pct || 0).toFixed(1)}% está abaixo da meta de ${minMargin}%.`,
          financial_impact_monthly: round2(monthlyGain),
          financial_impact_annual: round2(monthlyGain * 12),
          priority: (p.monthly_sales || 0) > 5 ? 'alta' : 'media',
          confidence: calcConfidence(p, (p.monthly_sales || 0) > 0 ? 10 : 0),
          status: 'aberta',
          product_id: p.id,
        });
      });

    // 2. Estoque Parado
    products
      .filter(p => (p.abc_class === 'C' || (p.monthly_sales || 0) === 0) && (p.quantity || 0) > 0)
      .forEach(p => {
        const tiedUpCapital = (p.cost || 0) * (p.quantity || 0);
        const monthlyImpact = tiedUpCapital / 12;
        opportunities.push({
          type: 'estoque_parado',
          product_name: p.name,
          category: p.category || 'Sem categoria',
          description: `Criar promoção para acelerar venda. ${p.quantity} unidades em estoque sem giro há mais de 60 dias.`,
          financial_impact_monthly: round2(monthlyImpact),
          financial_impact_annual: round2(tiedUpCapital),
          priority: tiedUpCapital > 500 ? 'alta' : 'media',
          confidence: calcConfidence(p, (p.quantity || 0) > 10 ? 10 : 0),
          status: 'aberta',
          product_id: p.id,
        });
      });

    // 3. Promoção Recomendada
    products
      .filter(p => {
        const isExpiring = p.expiration_date && (() => {
          const d = daysUntil(p.expiration_date);
          return d !== null && d > 0 && d <= 90;
        })();
        const highStock = (p.quantity || 0) > 10 && (p.monthly_sales || 0) < 5;
        const goodMargin = (p.margin_pct || 0) >= 20;
        return (isExpiring || highStock) && goodMargin && (p.quantity || 0) > 0;
      })
      .forEach(p => {
        const discountPrice = (p.selected_price || 0) * 0.9;
        const profitPerUnit = discountPrice - (p.cost || 0);
        const estimatedSales = Math.min(Math.max(p.monthly_sales || 1, Math.ceil((p.quantity || 0) / 3)), p.quantity || 1);
        const monthlyGain = Math.max(0, profitPerUnit * estimatedSales);
        const daysLeft = daysUntil(p.expiration_date);
        const desc = daysLeft && daysLeft > 0 && daysLeft <= 90
          ? `Produto vencendo em ${daysLeft} dias com boa margem. Criar promoção para acelerar saída de ${p.quantity} unidades.`
          : `Produto com estoque elevado (${p.quantity} un.) e boa margem (${(p.margin_pct || 0).toFixed(1)}%). Criar promoção para acelerar saída.`;
        opportunities.push({
          type: 'promocao_recomendada',
          product_name: p.name,
          category: p.category || 'Sem categoria',
          description: desc,
          financial_impact_monthly: round2(monthlyGain),
          financial_impact_annual: round2(monthlyGain * 12),
          priority: (daysLeft && daysLeft <= 30) ? 'alta' : 'media',
          confidence: calcConfidence(p, 10),
          status: 'aberta',
          product_id: p.id,
        });
      });

    // 4. Reposição Inteligente
    products
      .filter(p => (p.quantity || 0) <= 5 && (p.monthly_sales || 0) > 5)
      .forEach(p => {
        const shortfall = Math.max(0, (p.monthly_sales || 0) - (p.quantity || 0));
        const monthlyGain = shortfall * ((p.selected_price || 0) - (p.cost || 0));
        opportunities.push({
          type: 'reposicao_inteligente',
          product_name: p.name,
          category: p.category || 'Sem categoria',
          description: `Estoque baixo (${p.quantity} un.) com alta demanda (${p.monthly_sales} vendas/mês). Reposição urgente para evitar perda de vendas.`,
          financial_impact_monthly: round2(monthlyGain),
          financial_impact_annual: round2(monthlyGain * 12),
          priority: (p.quantity || 0) <= 2 ? 'alta' : 'media',
          confidence: calcConfidence(p, 10),
          status: 'aberta',
          product_id: p.id,
        });
      });

    // 5. Categoria de Alto Potencial
    const categoryStats = {};
    products.forEach(p => {
      const cat = p.category || 'Sem categoria';
      if (!categoryStats[cat]) categoryStats[cat] = { products: 0, totalProfit: 0, totalSales: 0 };
      categoryStats[cat].products++;
      categoryStats[cat].totalProfit += (p.unit_profit || 0) * (p.monthly_sales || 0);
      categoryStats[cat].totalSales += p.monthly_sales || 0;
    });

    const topCategories = Object.entries(categoryStats)
      .filter(([, d]) => d.totalProfit > 0)
      .map(([category, data]) => ({
        type: 'categoria_alto_potencial',
        product_name: category,
        category,
        description: `${data.products} produtos nesta categoria gerando ${formatCurrency(data.totalProfit)} de lucro mensal. Foque esforços comerciais aqui.`,
        financial_impact_monthly: round2(data.totalProfit),
        financial_impact_annual: round2(data.totalProfit * 12),
        priority: data.totalProfit > 1000 ? 'alta' : 'media',
        confidence: Math.min(100, 50 + data.products * 10),
        status: 'aberta',
      }))
      .sort((a, b) => b.financial_impact_monthly - a.financial_impact_monthly)
      .slice(0, 5);

    opportunities.push(...topCategories);

    // Sort: alta > media > baixa, then by financial impact
    const priorityOrder = { alta: 0, media: 1, baixa: 2 };
    opportunities.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.financial_impact_monthly - a.financial_impact_monthly;
    });

    // Stats
    const totalMonthly = opportunities.reduce((s, o) => s + (o.financial_impact_monthly || 0), 0);
    const totalAnnual = opportunities.reduce((s, o) => s + (o.financial_impact_annual || 0), 0);
    const byType = {};
    Object.keys(OPPORTUNITY_TYPES).forEach(t => {
      byType[t] = opportunities.filter(o => o.type === t).length;
    });

    return { opportunities, topCategories, stats: { totalMonthly, totalAnnual, byType, total: opportunities.length } };
  }, [products, settings]);
}