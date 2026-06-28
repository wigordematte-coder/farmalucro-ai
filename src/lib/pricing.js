// Pricing engine for FarmaLucro AI

export function calculatePrices(cost, minMargin, idealMargin, maxMargin) {
  if (!cost || cost <= 0) return { aggressive: 0, balanced: 0, premium: 0 };
  const aggressive = cost / (1 - minMargin / 100);
  const balanced = cost / (1 - idealMargin / 100);
  const premium = cost / (1 - maxMargin / 100);
  return {
    aggressive: round2(aggressive),
    balanced: round2(balanced),
    premium: round2(premium),
  };
}

export function calculateProfit(price, cost) {
  if (!price || !cost) return 0;
  return round2(price - cost);
}

export function calculateMargin(price, cost) {
  if (!price || !cost) return 0;
  return round2(((price - cost) / price) * 100);
}

export function calculateROI(cost, profit) {
  if (!cost || !profit) return 0;
  return round2((profit / cost) * 100);
}

export function calculateProductMetrics(product, settings) {
  const min = settings?.min_margin || 15;
  const ideal = settings?.ideal_margin || 30;
  const max = settings?.max_margin || 50;
  const cost = product.cost || 0;

  const prices = calculatePrices(cost, min, ideal, max);
  const selectedPrice = product.selected_price || prices.balanced;
  const unitProfit = calculateProfit(selectedPrice, cost);
  const marginPct = calculateMargin(selectedPrice, cost);
  const roi = calculateROI(cost, unitProfit);

  return {
    ...prices,
    selected_price: selectedPrice,
    unit_profit: unitProfit,
    margin_pct: marginPct,
    roi: roi,
  };
}

export function classifyABC(products) {
  if (!products || products.length === 0) return products;
  const sorted = [...products].sort((a, b) => (b.monthly_sales || 0) - (a.monthly_sales || 0));
  const totalSales = sorted.reduce((sum, p) => sum + (p.monthly_sales || 0), 0);
  if (totalSales === 0) {
    return sorted.map(p => ({ ...p, abc_class: 'C' }));
  }
  let cumulative = 0;
  return sorted.map(p => {
    const share = ((p.monthly_sales || 0) / totalSales) * 100;
    cumulative += share;
    let abcClass = 'C';
    if (cumulative <= 70) abcClass = 'A';
    else if (cumulative <= 90) abcClass = 'B';
    return { ...p, abc_class: abcClass };
  });
}

export function isExpiringSoon(expirationDate, days = 90) {
  if (!expirationDate) return false;
  const exp = new Date(expirationDate);
  const now = new Date();
  const diffDays = (exp - now) / (1000 * 60 * 60 * 24);
  return diffDays <= days && diffDays > 0;
}

export function isExpired(expirationDate) {
  if (!expirationDate) return false;
  return new Date(expirationDate) < new Date();
}

export function calculateInventoryValue(products) {
  return products.reduce((sum, p) => sum + (p.cost || 0) * (p.quantity || 0), 0);
}

export function calculatePotentialRevenue(products) {
  return products.reduce((sum, p) => sum + (p.selected_price || 0) * (p.quantity || 0), 0);
}

export function calculatePotentialProfit(products) {
  return products.reduce((sum, p) => {
    const profit = (p.selected_price || 0) - (p.cost || 0);
    return sum + profit * (p.quantity || 0);
  }, 0);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
}

export function formatPercent(value) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value || 0) + '%';
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

// ===== PRECIFICAÇÃO INTELIGENTE =====

export function getCategoryMargin(category, categoryMargins, settings) {
  if (!category) return settings?.ideal_margin || 30;
  const match = categoryMargins?.find(m => m.category?.toLowerCase() === category.toLowerCase() && m.is_active !== false);
  return match?.margin_pct || settings?.ideal_margin || 30;
}

export function calculateCategoryPrices(cost, categoryMargin) {
  if (!cost || cost <= 0) return { aggressive: 0, balanced: 0, premium: 0 };
  const aggressiveMargin = Math.max(10, categoryMargin - 10);
  const premiumMargin = categoryMargin + 10;
  return {
    aggressive: round2(cost / (1 - aggressiveMargin / 100)),
    balanced: round2(cost / (1 - categoryMargin / 100)),
    premium: round2(cost / (1 - premiumMargin / 100)),
  };
}

export function detectPricingProblems(product, settings, categoryMargins) {
  const problems = [];
  const margin = product.margin_pct || 0;
  const categoryMargin = getCategoryMargin(product.category, categoryMargins, settings);
  const minMargin = settings?.min_margin || 15;
  const currentPrice = product.selected_price || 0;
  const cost = product.cost || 0;

  if (margin < minMargin) {
    problems.push({ type: 'margem_baixa', label: 'Margem Baixa', severity: 'high', description: `Margem atual ${margin.toFixed(1)}% abaixo do mínimo de ${minMargin}%` });
  }

  const premiumPrice = cost > 0 ? cost / (1 - (categoryMargin + 15) / 100) : 0;
  if (currentPrice > premiumPrice && cost > 0) {
    problems.push({ type: 'preco_alto', label: 'Preço Muito Alto', severity: 'medium', description: `Preço ${formatCurrency(currentPrice)} acima do premium recomendado ${formatCurrency(premiumPrice)}` });
  }

  const lastUpdate = product.last_purchase_date || product.updated_date;
  if (lastUpdate) {
    const daysSince = Math.floor((new Date() - new Date(lastUpdate)) / (1000 * 60 * 60 * 24));
    if (daysSince > 90) {
      problems.push({ type: 'sem_atualizacao', label: 'Preço Sem Atualização', severity: 'medium', description: `Sem revisão há ${daysSince} dias` });
    }
  }

  return problems;
}

export function getPricingRecommendation(product, settings, categoryMargins) {
  const margin = product.margin_pct || 0;
  const categoryMargin = getCategoryMargin(product.category, categoryMargins, settings);
  const minMargin = settings?.min_margin || 15;
  const sales = product.monthly_sales || 0;
  const stock = product.quantity || 0;
  const abcClass = product.abc_class;

  let strategy = 'balanced';
  let reason = '';

  if (margin < minMargin) {
    strategy = 'balanced';
    reason = `Preço equilibrado sugerido porque a margem atual (${margin.toFixed(1)}%) está abaixo da meta da categoria (${categoryMargin}%).`;
  } else if (abcClass === 'A' && sales > 10) {
    strategy = 'aggressive';
    reason = `Preço agressivo recomendado devido ao alto giro (${sales} vendas/mês) e classificação A. Produtos de alta rotatividade aceitam margens menores.`;
  } else if (stock > 10 && sales < 5) {
    strategy = 'aggressive';
    reason = `Preço agressivo recomendado devido ao alto estoque (${stock} un.) e baixa saída (${sales} vendas/mês).`;
  } else if (margin >= categoryMargin && abcClass !== 'A') {
    strategy = 'premium';
    reason = `Preço premium recomendado pois a categoria tem baixa sensibilidade a preço e o produto já possui boa margem.`;
  } else {
    strategy = 'balanced';
    reason = `Preço equilibrado mantém a margem da categoria (${categoryMargin}%) com boa competitividade.`;
  }

  const prices = calculateCategoryPrices(product.cost || 0, categoryMargin);
  const recommendedPrice = strategy === 'aggressive' ? prices.aggressive : strategy === 'premium' ? prices.premium : prices.balanced;
  const potentialMonthlyGain = Math.max(0, (recommendedPrice - (product.selected_price || 0)) * Math.max(sales, 1));

  return { strategy, reason, recommendedPrice, potentialMonthlyGain, categoryMargin, prices };
}

export function simulatePriceChange(newPrice, product) {
  const cost = product.cost || 0;
  const currentPrice = product.selected_price || 0;
  const unitProfit = newPrice - cost;
  const marginPct = newPrice > 0 ? ((newPrice - cost) / newPrice) * 100 : 0;
  const roi = cost > 0 ? (unitProfit / cost) * 100 : 0;
  const monthlySales = product.monthly_sales || 0;
  const monthlyProfit = unitProfit * monthlySales;
  const currentMonthlyProfit = (currentPrice - cost) * monthlySales;
  const difference = monthlyProfit - currentMonthlyProfit;

  return {
    unitProfit: round2(unitProfit),
    marginPct: round2(marginPct),
    roi: round2(roi),
    monthlyProfit: round2(monthlyProfit),
    difference: round2(difference),
  };
}