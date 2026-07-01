import { cn } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';

function calcScore(products, opportunities, settings) {
  if (!products || products.length === 0) return { score: 0, label: 'Sem dados', desc: 'Importe uma nota fiscal para calcular seu FarmaScore.' };

  const minMargin = settings?.min_margin || 15;
  const idealMargin = settings?.ideal_margin || 30;

  // Margem média (até 35pts)
  const withMargin = products.filter(p => (p.margin_pct || 0) > 0);
  const avgMargin = withMargin.length > 0 ? withMargin.reduce((s, p) => s + p.margin_pct, 0) / withMargin.length : 0;
  const marginScore = Math.min(35, Math.round((avgMargin / idealMargin) * 35));

  // Giro de estoque (até 25pts)
  const withSales = products.filter(p => (p.monthly_sales || 0) > 0);
  const giroScore = Math.min(25, Math.round((withSales.length / products.length) * 25));

  // Estoque parado penaliza (até -15pts)
  const parado = products.filter(p => p.abc_class === 'C' && (p.quantity || 0) > 0).length;
  const paradoPenalty = Math.min(15, Math.round((parado / products.length) * 15));

  // Oportunidades aplicadas (até 20pts) — base placeholder de 50%
  const opp = opportunities || [];
  const applied = opp.filter(o => o.status === 'aplicada').length;
  const total = opp.length || 1;
  const oppScore = Math.min(20, Math.round((applied / total) * 20));

  // Saúde comercial: proporção alta margem (até 20pts)
  const highMargin = products.filter(p => (p.margin_pct || 0) >= idealMargin).length;
  const healthScore = Math.min(20, Math.round((highMargin / products.length) * 20));

  const score = Math.max(0, Math.min(100, marginScore + giroScore - paradoPenalty + oppScore + healthScore));

  let label, desc;
  if (score >= 85) {
    label = 'Excelente';
    desc = 'Sua farmácia apresenta rentabilidade sólida e bom giro de estoque. Continue monitorando as oportunidades de melhoria.';
  } else if (score >= 70) {
    label = 'Bom';
    desc = 'Boa saúde comercial, mas ainda existem oportunidades de aumentar margem e reduzir estoque parado.';
  } else if (score >= 50) {
    label = 'Regular';
    desc = 'Há oportunidades claras de melhoria. Revise as margens e aplique as ações prioritárias identificadas.';
  } else {
    label = 'Crítico';
    desc = 'Atenção: sua farmácia apresenta margens baixas e alto estoque parado. Aplique as ações prioritárias imediatamente.';
  }

  return { score, label, desc };
}

export default function FarmaScore({ products, opportunities, settings }) {
  const { score, label, desc } = calcScore(products, opportunities, settings);

  const color = score >= 85 ? 'text-accent-dark' : score >= 70 ? 'text-blue-600' : score >= 50 ? 'text-amber-500' : 'text-red-500';
  const ring = score >= 85 ? 'stroke-accent' : score >= 70 ? 'stroke-blue-500' : score >= 50 ? 'stroke-amber-500' : 'stroke-red-500';
  const bg = score >= 85 ? 'bg-accent/10' : score >= 70 ? 'bg-blue-50' : score >= 50 ? 'bg-amber-50' : 'bg-red-50';

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
      <div className="relative flex-shrink-0">
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r={radius} fill="none" strokeWidth="8" className="stroke-muted" />
          <circle
            cx="45" cy="45" r={radius}
            fill="none" strokeWidth="8"
            className={ring}
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 45 45)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-xl font-black", color)}>{score}</span>
          <span className="text-[9px] text-muted-foreground font-medium">/ 100</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Farma Score</span>
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", bg, color)}>{label}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}