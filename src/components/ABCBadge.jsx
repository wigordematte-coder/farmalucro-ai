import { cn } from '@/lib/utils';

export default function ABCBadge({ className, abcClass }) {
  const config = {
    A: { label: 'Curva A', classes: 'bg-accent/10 text-accent-dark border-accent/30' },
    B: { label: 'Curva B', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
    C: { label: 'Curva C', classes: 'bg-red-50 text-red-700 border-red-200' },
  };
  const c = config[abcClass] || config.C;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      c.classes, className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {c.label}
    </span>
  );
}