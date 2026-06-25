export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: 'LayoutDashboard' },
  { label: 'Produtos', path: '/produtos', icon: 'Package' },
  { label: 'Importação', path: '/importacao', icon: 'FileUp' },
  { label: 'Curva ABC', path: '/curva-abc', icon: 'BarChart3' },
  { label: 'Consultor IA', path: '/consultor-ia', icon: 'Bot' },
  { label: 'Promoções', path: '/promocoes', icon: 'Tag' },
  { label: 'Marketing', path: '/marketing', icon: 'Megaphone' },
  { label: 'Relatórios', path: '/relatorios', icon: 'FileText' },
  { label: 'Configurações', path: '/configuracoes', icon: 'Settings' },
  { label: 'Assinatura', path: '/assinatura', icon: 'CreditCard' },
  { label: 'Painel Admin', path: '/admin', icon: 'ShieldCheck', adminOnly: true },
  { label: 'Config. Financeiras', path: '/admin/financeiro', icon: 'Wallet', adminOnly: true },
];

export const PROMOTION_TYPES = {
  flash_offer: { label: 'Oferta Relâmpago', icon: 'Zap', color: 'orange' },
  buy2_pay_less: { label: 'Leve 2 Pague Menos', icon: 'PackagePlus', color: 'blue' },
  progressive_discount: { label: 'Desconto Progressivo', icon: 'TrendingDown', color: 'purple' },
  buy_and_win: { label: 'Compre e Ganhe', icon: 'Gift', color: 'green' },
  benefits_club: { label: 'Clube de Benefícios', icon: 'Crown', color: 'amber' },
};

export const PHARMACY_BENCHMARKS = {
  categories: {
    'Medicamentos de Marca': { typical_margin: 25, typical_markup: 35, turnover_days: 45 },
    'Genéricos': { typical_margin: 35, typical_markup: 55, turnover_days: 30 },
    'Perfumaria': { typical_margin: 40, typical_markup: 67, turnover_days: 60 },
    'Higiene Pessoal': { typical_margin: 35, typical_markup: 54, turnover_days: 45 },
    'Dermocosméticos': { typical_margin: 45, typical_markup: 82, turnover_days: 75 },
    'Suplementos': { typical_margin: 38, typical_markup: 61, turnover_days: 50 },
    'Infantis': { typical_margin: 32, typical_markup: 47, turnover_days: 55 },
    'Acessórios Médicos': { typical_margin: 42, typical_markup: 72, turnover_days: 65 },
    'Veterinário': { typical_margin: 36, typical_markup: 56, turnover_days: 50 },
  },
  insights: {
    margin_optimization: 'Produtos de alta rotatividade (Curva A) aceitam margens menores sem perda de vendas. Produtos de baixa rotatividade (Curva C) precisam de margens maiores para compensar o custo de capital parado.',
    isca: 'Produtos de marca conhecida e alta demanda funcionam como isca: mantenha preço agressivo para atrair fluxo, e compense com margem maior em produtos de venda casada (cross-sell).',
    encalhe: 'Estoque parado por mais de 90 dias gera custo de oportunidade. Cada R$ 1.000 parados representa ~R$ 50/mês em custo de capital perdido. Promova ativamente para liberar capital.',
    competitividade: 'Em farmácias independentes, o preço competitivo em itens de Curva A impacta até 70% do faturamento. Monitore concorrentes a cada 15 dias nos 20 produtos mais vendidos.',
  },
};