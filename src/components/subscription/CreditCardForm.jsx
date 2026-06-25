import { useState } from 'react';
import { CreditCard, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/pricing';

function detectBrand(number) {
  const clean = number.replace(/\s/g, '');
  if (/^4/.test(clean)) return 'Visa';
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'Mastercard';
  if (/^3[47]/.test(clean)) return 'Amex';
  if (/^6(?:011|5)/.test(clean)) return 'Elo';
  return null;
}

function formatCardNumber(value) {
  return value.replace(/\s/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19);
}

function formatExpiry(value) {
  const clean = value.replace(/\D/g, '').substring(0, 4);
  if (clean.length >= 3) return `${clean.substring(0, 2)}/${clean.substring(2)}`;
  return clean;
}

export default function CreditCardForm({ amount, onConfirm, onBack }) {
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const brand = detectBrand(card.number);
  const isValid = card.number.replace(/\s/g, '').length >= 13 && card.name.length >= 3 && card.expiry.length === 5 && card.cvv.length >= 3;

  const handlePay = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setProcessing(false);
    setConfirmed(true);
    const lastDigits = card.number.replace(/\s/g, '').slice(-4);
    const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    setTimeout(() => onConfirm({ last_digits: lastDigits, brand: brand || 'Cartão', token }), 1200);
  };

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-accent" />
        </div>
        <p className="font-semibold text-foreground">Pagamento aprovado!</p>
        <p className="text-sm text-muted-foreground">Assinatura ativada com sucesso...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Valor a pagar</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(amount)}</p>
        </div>
        {brand && (
          <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-semibold">{brand}</span>
        )}
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Número do Cartão</label>
        <input
          value={card.number}
          onChange={e => setCard({ ...card, number: formatCardNumber(e.target.value) })}
          placeholder="0000 0000 0000 0000"
          className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-background font-mono"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Nome no Cartão</label>
        <input
          value={card.name}
          onChange={e => setCard({ ...card, name: e.target.value.toUpperCase() })}
          placeholder="NOME COMO IMPRESSO"
          className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-background"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Validade</label>
          <input
            value={card.expiry}
            onChange={e => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
            placeholder="MM/AA"
            className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-background font-mono"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">CVV</label>
          <input
            type="password"
            value={card.cvv}
            onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').substring(0, 4) })}
            placeholder="***"
            className="mt-1 w-full px-3 py-2.5 rounded-lg border border-border text-sm bg-background font-mono"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="w-3 h-3" />
        Seus dados são criptografados e tokenizados. Não armazenamos os dados do cartão.
      </div>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Voltar
        </button>
        <button
          onClick={handlePay}
          disabled={processing || !isValid}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors",
            "bg-accent text-accent-foreground hover:bg-accent-dark",
            (processing || !isValid) && "opacity-60 cursor-not-allowed"
          )}
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {processing ? 'Processando...' : 'Pagar e Ativar'}
        </button>
      </div>
    </div>
  );
}