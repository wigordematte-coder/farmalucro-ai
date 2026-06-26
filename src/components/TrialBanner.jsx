import { Clock } from 'lucide-react';
import { useSubscription } from '@/lib/subscriptionContext';
import { cn } from '@/lib/utils';

export default function TrialBanner() {
  const { subscription, trialDaysRemaining } = useSubscription();

  if (!subscription || subscription.status !== 'trial') return null;

  const isUrgent = trialDaysRemaining <= 3;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm border",
      isUrgent
        ? "bg-amber-50 border-amber-200 text-amber-800"
        : "bg-blue-50 border-blue-200 text-blue-800"
    )}>
      <Clock className={cn("w-4 h-4 flex-shrink-0", isUrgent && "animate-pulse")} />
      <span className="flex-1">
        Você está utilizando o <strong>período de teste</strong>.
        {trialDaysRemaining > 0
          ? <> Restam <strong>{trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia' : 'dias'}</strong>.</>
          : <> Seu período de teste terminou hoje.</>
        }
      </span>
      {isUrgent && (
        <a href="/assinatura" className="text-xs font-semibold underline whitespace-nowrap">
          Contratar plano
        </a>
      )}
    </div>
  );
}