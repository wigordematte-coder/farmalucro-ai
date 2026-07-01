import { useState, useEffect } from 'react';
import { CreditCard, QrCode, Loader2, CheckCircle2, ExternalLink, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SUBSCRIPTION_PLAN } from '@/lib/subscriptionContext';
import { formatCurrency } from '@/lib/pricing';

function PixCheckout({ onConfirm, onBack, loading }) {
  return (
    <div className="space-y-4">
      <div className="text-center p-5 bg-muted/50 rounded-2xl space-y-3">
        <QrCode className="w-12 h-12 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">
          Ao confirmar, você será redirecionado para o ambiente seguro do Mercado Pago para concluir o pagamento via PIX.
        </p>
        <div className="bg-accent/10 rounded-xl p-3 text-sm text-accent font-semibold">
          Valor: {formatCurrency(SUBSCRIPTION_PLAN.price)}/mês
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button onClick={onConfirm} disabled={loading} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><QrCode className="w-4 h-4" /> Pagar com PIX</>}
        </Button>
      </div>
    </div>
  );
}

function CardCheckout({ onConfirm, onBack, loading }) {
  const [form, setForm] = useState({ name: '', number: '', expiry: '', cvv: '' });

  const formatCardNumber = (v) => v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
  const formatExpiry = (v) => v.replace(/\D/g, '').replace(/^(\d{2})/, '$1/').slice(0, 5);

  const handleSubmit = () => {
    const last4 = form.number.replace(/\s/g, '').slice(-4);
    onConfirm({ last_digits: last4, brand: detectBrand(form.number), token: `mp_tok_${Date.now()}` });
  };

  const detectBrand = (num) => {
    const n = num.replace(/\s/g, '');
    if (/^4/.test(n)) return 'Visa';
    if (/^5[1-5]/.test(n)) return 'Mastercard';
    if (/^3[47]/.test(n)) return 'Amex';
    return 'Cartão';
  };

  const valid = form.name && form.number.replace(/\s/g, '').length === 16 && form.expiry.length === 5 && form.cvv.length >= 3;

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-xl p-3 text-sm text-center">
        Valor: <span className="font-bold text-foreground">{formatCurrency(SUBSCRIPTION_PLAN.price)}/mês</span>
      </div>
      <div className="space-y-3">
        <div>
          <Label>Nome no cartão</Label>
          <Input placeholder="NOME SOBRENOME" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value.toUpperCase() }))} />
        </div>
        <div>
          <Label>Número do cartão</Label>
          <Input placeholder="0000 0000 0000 0000" value={form.number} onChange={e => setForm(f => ({ ...f, number: formatCardNumber(e.target.value) }))} maxLength={19} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Validade</Label>
            <Input placeholder="MM/AA" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: formatExpiry(e.target.value) }))} maxLength={5} />
          </div>
          <div>
            <Label>CVV</Label>
            <Input placeholder="000" value={form.cvv} onChange={e => setForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} maxLength={4} />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button onClick={handleSubmit} disabled={!valid || loading} className="flex-1">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Assinar Agora</>}
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
        🔒 Processado com segurança pelo Mercado Pago
      </p>
    </div>
  );
}

export default function MercadoPagoCheckout({ selectedMethod, onConfirm, onBack, loading }) {
  if (selectedMethod === 'pix') {
    return <PixCheckout onConfirm={() => onConfirm(null)} onBack={onBack} loading={loading} />;
  }
  return <CardCheckout onConfirm={onConfirm} onBack={onBack} loading={loading} />;
}