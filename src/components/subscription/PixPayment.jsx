import { useState, useEffect } from 'react';
import { QrCode, Copy, Check, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/pricing';

function generatePixCode() {
  const base = '00020126580014BR.GOV.BCB.PIX0136';
  const uuid = crypto.randomUUID?.() || Math.random().toString(36).substring(2);
  const randomPart = uuid.replace(/-/g, '').substring(0, 32);
  const amount = '197.00';
  const merchant = 'FarmaLucro AI';
  const city = 'SAOPAULO';
  const payload = `${base}${randomPart}5204000053039865802BR5913${merchant.padEnd(13, ' ').substring(0, 13)}6009${city}62070503***6304`;
  return payload;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function PixPayment({ amount, onConfirm, onBack }) {
  const [pixCode] = useState(() => generatePixCode());
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [verifying, setVerifying] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0 || confirmed) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, confirmed]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    setVerifying(true);
    await new Promise(r => setTimeout(r, 1500));
    setVerifying(false);
    setConfirmed(true);
    setTimeout(() => onConfirm(), 1200);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(pixCode)}`;

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-accent" />
        </div>
        <p className="font-semibold text-foreground">Pagamento confirmado!</p>
        <p className="text-sm text-muted-foreground">Liberando acesso ao sistema...</p>
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
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
          timeLeft < 300 ? "bg-red-50 text-red-600" : "bg-muted text-muted-foreground"
        )}>
          <Clock className="w-4 h-4" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 py-4">
        <div className="p-4 bg-white rounded-2xl border-2 border-border">
          <img src={qrUrl} alt="QR Code PIX" className="w-48 h-48" />
        </div>
        <p className="text-sm font-medium text-foreground">Escaneie o QR Code com seu banco</p>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">PIX Copia e Cola</label>
        <div className="mt-1 flex gap-2">
          <input
            readOnly
            value={pixCode}
            className="flex-1 px-3 py-2 rounded-lg border border-border text-xs bg-muted/50 font-mono truncate"
          />
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-light flex-shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      {timeLeft <= 0 && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 text-center">
          O tempo expirou. Gere uma nova cobrança para continuar.
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Voltar
        </button>
        <button
          onClick={handleVerify}
          disabled={verifying || timeLeft <= 0}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors",
            "bg-accent text-accent-foreground hover:bg-accent-dark",
            (verifying || timeLeft <= 0) && "opacity-60 cursor-not-allowed"
          )}
        >
          {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
          {verifying ? 'Verificando pagamento...' : 'Já paguei - Verificar'}
        </button>
      </div>
    </div>
  );
}