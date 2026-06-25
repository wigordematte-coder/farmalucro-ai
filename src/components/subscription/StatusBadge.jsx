import { cn } from '@/lib/utils';
import { SUBSCRIPTION_STATUSES } from '@/lib/subscriptionContext';

export default function StatusBadge({ status, size = 'sm' }) {
  const config = SUBSCRIPTION_STATUSES[status] || SUBSCRIPTION_STATUSES.cancelled;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-semibold",
      size === 'sm' ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
      config.badge
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}