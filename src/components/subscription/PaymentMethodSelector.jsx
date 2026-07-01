import { QrCode, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PaymentMethodSelector({ value, onChange }) {
  const methods = [
    { key: 'pix', label: 'PIX', desc: 'Pagamento único/manual', icon: QrCode },
    { key: 'credit_card', label: 'Cartão de Crédito', desc: 'Renovação automática', icon: CreditCard },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {methods.map(m => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={cn(
            "p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-1.5",
            value === m.key ? "border-accent bg-accent/5" : "border-border hover:border-muted"
          )}
        >
          <m.icon className={cn("w-6 h-6", value === m.key ? "text-accent" : "text-muted-foreground")} />
          <span className="font-semibold text-sm text-foreground">{m.label}</span>
          <span className="text-xs text-muted-foreground">{m.desc}</span>
        </button>
      ))}
    </div>
  );
}
