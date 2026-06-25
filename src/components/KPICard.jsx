import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const colorClasses = {
  primary: 'bg-primary text-primary-foreground',
  accent: 'bg-accent text-accent-foreground',
  amber: 'bg-amber-500 text-white',
  red: 'bg-red-500 text-white',
  purple: 'bg-purple-500 text-white',
  blue: 'bg-blue-500 text-white',
};

const KPICard = forwardRef(({ title, value, subtitle, icon: Icon, trend, color = 'primary', to }, ref) => {
  const content = (
    <div ref={ref} className={cn(
      "relative overflow-hidden rounded-2xl bg-card border border-border p-5 transition-all hover:shadow-lg hover:-translate-y-0.5",
      to && "cursor-pointer"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground truncate">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn("flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-sm", colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend != null && (
        <div className="mt-3 flex items-center gap-1.5">
          <TrendingUp className={cn("w-3.5 h-3.5", trend >= 0 ? 'text-accent' : 'text-destructive')} />
          <span className={cn("text-xs font-medium", trend >= 0 ? 'text-accent-dark' : 'text-destructive')}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        </div>
      )}
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }
  return content;
});

KPICard.displayName = 'KPICard';
export default KPICard;