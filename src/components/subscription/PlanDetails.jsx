import { Check, Crown } from 'lucide-react';
import { SUBSCRIPTION_PLAN } from '@/lib/subscriptionContext';
import { formatCurrency } from '@/lib/pricing';

export default function PlanDetails() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="gradient-farma p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-5 h-5 text-yellow-300" />
          <h3 className="font-bold text-lg">{SUBSCRIPTION_PLAN.name}</h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold">{formatCurrency(SUBSCRIPTION_PLAN.price)}</span>
          <span className="text-white/70 text-sm">/mês</span>
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Recursos inclusos</p>
        <ul className="space-y-2.5">
          {SUBSCRIPTION_PLAN.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-accent" />
              </div>
              <span className="text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}