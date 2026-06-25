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