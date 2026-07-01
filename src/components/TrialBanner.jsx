import { Clock, TrendingUp, Sparkles, Package, Tag, DollarSign } from 'lucide-react';
import { useSubscription } from '@/lib/subscriptionContext';
import { useProducts } from '@/hooks/useProducts';
import { useMemo } from 'react';
import { formatCurrency } from '@/lib/pricing';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function TrialBanner() {
  const { subscription, trialDaysRemaining } = useSubscription();
  const { products } = useProducts();

  const stats = useMemo(() => {
    if (!products || products.length === 0) return null;
    const potentialProfit = products.reduce((s, p) => s + (p.unit_profit || 0) * (p.quantity || 0), 0);
    const opportunities = products.filter(p => {
      return (p.margin_pct || 0) < 30 || (p.monthly_sales || 0) === 0 || p.risk_of_obsolescence;
    }).length;
    const promotions = products.filter(p => (p.abc_class === 'C' && (p.quantity || 0) > 0) || (p.expiration_date && (() => {
      const days = (new Date(p.expiration_date) - new Date()) / (1000 * 60 * 60 * 24);
      return days > 0 && days <= 90;
    })())).length;
    return { potentialProfit, opportunities, promotions, productCount: products.length };
  }, [products]);

  if (!subscription || subscription.status !== 'trialing') return null;

  const isUrgent = trialDaysRemaining <= 3;

  return (
    <div className={cn(
      "rounded-xl border p-4",
      isUrgent ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200" : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          isUrgent ? "bg-amber-500" : "bg-blue-500"
        )}>
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">
            {isUrgent
              ? `Seu teste termina em ${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'dia' : 'dias'}.`
              : `Restam ${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'dia' : 'dias'} de teste.`
            }
          </p>

          {stats ? (
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <TrialStat icon={Package} label="Produtos analisados" value={stats.productCount} />
              <TrialStat icon={DollarSign} label="Lucro potencial" value={formatCurrency(stats.potentialProfit)} />
              <TrialStat icon={Sparkles} label="Oportunidades" value={stats.opportunities} />
              <TrialStat icon={Tag} label="Promoções" value={stats.promotions} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Importe sua primeira nota fiscal para começar a identificar oportunidades.
            </p>
          )}

          <div className="mt-3 flex items-center gap-3">
            <Link
              to="/assinatura"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                isUrgent ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-blue-500 text-white hover:bg-blue-600"
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Contratar plano
            </Link>
            <span className="text-xs text-muted-foreground">
              {isUrgent ? 'Não perca seus dados — assine agora' : 'Teste todas as funcionalidades gratuitamente'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrialStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/60 rounded-lg px-2 py-1.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className="text-xs font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
