import {
  calculateMargin,
  calculateRealCost,
  formatCurrency,
  getMinimumSafePrice,
  getPricingRecommendation,
} from '@/lib/pricing';

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function firstPositive(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
}

export function getPsychologicalPrice(targetPrice, minimumSafePrice = 0, pmcPrice = 0) {
  const price = Number(targetPrice) || 0;
  if (price <= 0) return 0;

  const floor = Number(minimumSafePrice) || 0;
  const ceiling = Number(pmcPrice) || 0;
  const candidate = Math.floor(price) + 0.99;
  const safeCandidate = candidate < floor ? Math.ceil(floor) + 0.99 : candidate;
  const bounded = ceiling > 0 ? Math.min(safeCandidate, ceiling) : safeCandidate;

  return round2(Math.max(floor, bounded));
}

function estimateMonthlyGain(currentPrice, suggestedPrice, quantity, monthlySales) {
  const current = Number(currentPrice) || 0;
  const suggested = Number(suggestedPrice) || 0;
  if (suggested <= 0) return 0;

  const salesSignal = Number(monthlySales) || 0;
  const conservativeVolume = salesSignal > 0 ? salesSignal : Math.min(Math.max(Number(quantity) || 1, 1), 5);
  return round2(Math.max(0, suggested - current) * conservativeVolume);
}

function baseRecommendation(product, tenantId, recommendation, overrides) {
  const cost = calculateRealCost(product);
  const currentPrice = firstPositive(product.selected_price, product.current_price);
  const suggestedPrice = Number(overrides.suggested_price ?? recommendation.suggestedPrice) || 0;
  const currentMargin = currentPrice > 0 ? calculateMargin(currentPrice, cost) : Number(product.margin_pct || 0) || 0;
  const projectedMargin = suggestedPrice > 0 ? calculateMargin(suggestedPrice, cost) : 0;

  return {
    tenant_id: tenantId,
    product_id: product.id,
    product_name: product.name || '',
    current_price: round2(currentPrice),
    suggested_price: round2(suggestedPrice),
    current_margin: round2(currentMargin),
    projected_margin: round2(projectedMargin),
    estimated_monthly_gain: estimateMonthlyGain(currentPrice, suggestedPrice, product.quantity, product.monthly_sales),
    confidence: Number(overrides.confidence ?? recommendation.confidence) || 0,
    status: 'pending',
    reason: overrides.reason || recommendation.reason || '',
    ...overrides,
  };
}

export function buildProductRecommendations(product, settings, tenantId) {
  if (!tenantId || !product?.id) return [];

  const pricing = getPricingRecommendation(product, settings, []);
  const currentPrice = firstPositive(product.selected_price, product.current_price);
  const realCost = calculateRealCost(product, settings);
  const minSafePrice = getMinimumSafePrice(product, settings);
  const pmcPrice = firstPositive(product.pmc_price, product.cmed_pmc, product.pmc);
  const idealSuggested = firstPositive(pricing.suggestedPrice, pricing.recommendedPrice, minSafePrice);
  const psychologicalPrice = getPsychologicalPrice(idealSuggested, minSafePrice, pmcPrice);
  const currentMargin = currentPrice > 0 ? calculateMargin(currentPrice, realCost) : 0;
  const minMargin = Number(settings?.min_margin || 15);
  const idealMargin = Number(settings?.ideal_margin || 30);
  const recommendations = [];

  if (realCost <= 0) {
    return recommendations;
  }

  if (!currentPrice) {
    recommendations.push(baseRecommendation(product, tenantId, pricing, {
      type: 'margin_fix',
      title: 'Definir preco inicial seguro',
      description: `Produto importado sem preco ativo. Revise um preco de partida acima do piso seguro de ${formatCurrency(minSafePrice)}.`,
      suggested_price: psychologicalPrice,
      confidence: Math.min(pricing.confidence || 35, 45),
      reason: `${pricing.reason || 'Produto novo sem preco atual.'} Sugestao pendente de revisao manual; nenhuma alteracao automatica sera aplicada.`,
    }));
    return recommendations;
  }

  if (currentMargin < minMargin) {
    recommendations.push(baseRecommendation(product, tenantId, pricing, {
      type: 'margin_fix',
      title: 'Corrigir margem abaixo do minimo',
      description: `A margem atual esta em ${currentMargin.toFixed(1)}%, abaixo do minimo configurado de ${minMargin}%.`,
      suggested_price: psychologicalPrice,
      reason: `Preco sugerido respeita o piso seguro (${formatCurrency(minSafePrice)}) e usa preco psicologico quando possivel.`,
    }));
  } else if (psychologicalPrice > currentPrice && currentMargin < idealMargin) {
    recommendations.push(baseRecommendation(product, tenantId, pricing, {
      type: 'price_increase',
      title: 'Recuperar lucro por preco abaixo do ideal',
      description: `Existe espaco para recuperar margem sem ficar abaixo do piso seguro. Preco atual: ${formatCurrency(currentPrice)}.`,
      suggested_price: psychologicalPrice,
      reason: pricing.reason || 'Preco atual abaixo da meta ideal configurada para a farmacia.',
    }));
  }

  const stock = Number(product.quantity || 0);
  const monthlySales = Number(product.monthly_sales || 0);
  if (stock >= 10 && monthlySales === 0 && currentMargin >= minMargin) {
    const promoTarget = Math.max(minSafePrice, currentPrice * 0.95);
    const promoPrice = getPsychologicalPrice(promoTarget, minSafePrice, pmcPrice);
    recommendations.push(baseRecommendation(product, tenantId, pricing, {
      type: 'stock_turnover',
      title: 'Acelerar giro de estoque parado',
      description: 'Produto com estoque relevante e sem sinal de giro mensal. Revise uma acao comercial sem vender abaixo do custo.',
      suggested_price: promoPrice,
      estimated_monthly_gain: 0,
      confidence: Math.min(pricing.confidence || 40, 55),
      reason: 'Sinal baseado em estoque interno. Sem dados de concorrencia ou demanda regional integrados nesta sprint.',
    }));
  }

  return recommendations
    .filter(item => item.suggested_price > 0)
    .filter((item, index, list) => list.findIndex(other => other.type === item.type && other.product_id === item.product_id) === index);
}

export function summarizeRecommendations(recommendations = []) {
  const pending = recommendations.filter(item => item.status === 'pending');
  return {
    pendingCount: pending.length,
    estimatedMonthlyGain: round2(pending.reduce((sum, item) => sum + Math.max(Number(item.estimated_monthly_gain || 0), 0), 0)),
    top: [...pending]
      .sort((a, b) => Number(b.estimated_monthly_gain || 0) - Number(a.estimated_monthly_gain || 0))
      .slice(0, 3),
  };
}
