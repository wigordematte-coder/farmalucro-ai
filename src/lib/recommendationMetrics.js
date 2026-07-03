function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export const RECOMMENDATION_TYPE_MAP = {
  price_increase: {
    opportunityType: 'margem_baixa',
    label: 'Aumento de preco',
    route: '/plano-acao',
  },
  price_decrease: {
    opportunityType: 'promocao_recomendada',
    label: 'Reducao de preco',
    route: '/plano-acao',
  },
  margin_fix: {
    opportunityType: 'margem_baixa',
    label: 'Correcao de margem',
    route: '/plano-acao',
  },
  promotion: {
    opportunityType: 'promocao_recomendada',
    label: 'Promocao',
    route: '/plano-acao',
  },
  stock_turnover: {
    opportunityType: 'estoque_parado',
    label: 'Giro de estoque',
    route: '/plano-acao',
  },
};

export function getRecommendationPriority(recommendation = {}) {
  const gain = Number(recommendation.estimated_monthly_gain || 0);
  const confidence = Number(recommendation.confidence || 0);
  if (gain >= 500 || confidence >= 75) return 'alta';
  if (gain >= 100 || confidence >= 45) return 'media';
  return 'baixa';
}

export function recommendationToOpportunity(recommendation = {}) {
  const config = RECOMMENDATION_TYPE_MAP[recommendation.type] || RECOMMENDATION_TYPE_MAP.margin_fix;
  const monthly = Number(recommendation.estimated_monthly_gain || 0);

  return {
    id: recommendation.id,
    recommendation_id: recommendation.id,
    type: config.opportunityType,
    recommendation_type: recommendation.type,
    product_id: recommendation.product_id,
    product_name: recommendation.product_name || recommendation.title || 'Produto',
    category: config.label,
    description: recommendation.description || recommendation.reason || '',
    financial_impact_monthly: round2(monthly),
    financial_impact_annual: round2(monthly * 12),
    priority: getRecommendationPriority(recommendation),
    confidence: Number(recommendation.confidence || 0),
    status: recommendation.status,
  };
}

export function summarizeRecommendationCycle(recommendations = [], actionResults = []) {
  const list = Array.isArray(recommendations) ? recommendations : [];
  const results = Array.isArray(actionResults) ? actionResults : [];
  const pending = list.filter(item => item.status === 'pending');
  const approved = list.filter(item => item.status === 'approved');
  const applied = list.filter(item => item.status === 'applied');
  const rejected = list.filter(item => item.status === 'rejected');

  const estimatedPotential = pending.reduce((sum, item) => sum + Math.max(Number(item.estimated_monthly_gain || 0), 0), 0);
  const approvedPotential = approved.reduce((sum, item) => sum + Math.max(Number(item.estimated_monthly_gain || 0), 0), 0);
  const appliedEstimated = applied.reduce((sum, item) => sum + Math.max(Number(item.estimated_monthly_gain || 0), 0), 0);
  const realizedGain = results.reduce((sum, item) => sum + Math.max(Number(item.realized_monthly_gain || 0), 0), 0);

  return {
    total: list.length,
    pendingCount: pending.length,
    approvedCount: approved.length,
    appliedCount: applied.length,
    rejectedCount: rejected.length,
    estimatedPotential: round2(estimatedPotential),
    approvedPotential: round2(approvedPotential),
    appliedEstimated: round2(appliedEstimated),
    realizedGain: round2(realizedGain),
    topPending: [...pending]
      .sort((a, b) => Number(b.estimated_monthly_gain || 0) - Number(a.estimated_monthly_gain || 0))
      .slice(0, 5),
  };
}

export function buildRecommendationStats(recommendations = []) {
  const pending = (recommendations || []).filter(item => item.status === 'pending');
  const opportunities = pending.map(recommendationToOpportunity);
  const byType = {
    margem_baixa: 0,
    estoque_parado: 0,
    promocao_recomendada: 0,
    reposicao_inteligente: 0,
    categoria_alto_potencial: 0,
  };

  opportunities.forEach(item => {
    byType[item.type] = (byType[item.type] || 0) + 1;
  });

  const totalMonthly = opportunities.reduce((sum, item) => sum + Math.max(Number(item.financial_impact_monthly || 0), 0), 0);

  return {
    opportunities,
    stats: {
      total: opportunities.length,
      totalMonthly: round2(totalMonthly),
      totalAnnual: round2(totalMonthly * 12),
      byType,
    },
  };
}
