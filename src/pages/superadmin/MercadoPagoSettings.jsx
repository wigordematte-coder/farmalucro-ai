import { useState, useEffect } from 'react';
import { Shield, Save, CheckCircle2, AlertTriangle, Loader2, Webhook } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useUserRole } from '@/lib/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function MaskedInput() {
  return (
    <Input
      disabled
      value=""
      placeholder="Configure este valor nos secrets do backend/Base44"
      className="font-mono bg-muted"
    />
  );
}

export default function MercadoPagoSettings() {
  const { isSuperAdmin } = useUserRole();
  const [gateway, setGateway] = useState(null);
  const [form, setForm] = useState({
    environment: 'sandbox',
    status: 'inactive',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    loadGateway();
    // Build webhook URL based on current origin
    const base = window.location.origin;
    setWebhookUrl(`${base}/api/functions/mercadopagoWebhook`);
  }, []);

  const loadGateway = async () => {
    try {
      setLoading(true);
      const list = await base44.entities.PaymentGateway.filter({ provider_type: 'mercadopago' });
      if (list && list.length > 0) {
        const g = list[0];
        setGateway(g);
        setForm({
          environment: g.environment || 'sandbox',
          status: g.status || 'inactive',
        });
      }
    } catch {
      // no gateway yet
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isSuperAdmin) return;
    setSaving(true);
    try {
      const data = {
        name: 'Mercado Pago',
        provider_type: 'mercadopago',
        environment: form.environment,
        status: form.status,
        is_default: true,
        webhook_url: webhookUrl,
      };
      if (gateway?.id) {
        await base44.entities.PaymentGateway.update(gateway.id, data);
      } else {
        const created = await base44.entities.PaymentGateway.create(data);
        setGateway(created);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Acesso restrito a Super Administradores.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
          <img src="https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__large@2x.png"
            alt="MP" className="w-7 h-7 object-contain" onError={e => { e.target.style.display='none'; }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Mercado Pago</h1>
          <p className="text-sm text-muted-foreground">Configurações do gateway de pagamento</p>
        </div>
      </div>

      {/* Environment toggle */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4" /> Ambiente
        </h3>
        <div className="flex gap-3">
          {['sandbox', 'production'].map(env => (
            <button
              key={env}
              onClick={() => setForm(f => ({ ...f, environment: env }))}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-colors',
                form.environment === env
                  ? env === 'production'
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              )}
            >
              {env === 'sandbox' ? '🧪 Sandbox (Testes)' : '🚀 Produção'}
            </button>
          ))}
        </div>
        {form.environment === 'production' && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Você está configurando o ambiente de <strong>produção</strong>. As cobranças serão reais.
          </div>
        )}
      </div>

      {/* Credentials */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4" /> Credenciais
          <span className="text-xs font-normal text-muted-foreground ml-1">— nunca exibidas em texto pleno</span>
        </h3>

        <div className="space-y-3">
          <div>
            <Label htmlFor="public_key">Public Key</Label>
            <MaskedInput
              id="public_key"
              value={form.public_key}
              onChange={v => setForm(f => ({ ...f, public_key: v }))}
              placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>
          <div>
            <Label htmlFor="api_key">Access Token</Label>
            <MaskedInput
              id="api_key"
              value={form.api_key}
              onChange={v => setForm(f => ({ ...f, api_key: v }))}
              placeholder="APP_USR-0000000000000000-000000-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-000000000"
            />
          </div>
          <div>
            <Label htmlFor="secret_key">Client Secret</Label>
            <MaskedInput
              id="secret_key"
              value={form.secret_key}
              onChange={v => setForm(f => ({ ...f, secret_key: v }))}
              placeholder="Chave secreta da aplicação"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-foreground">Status do Gateway</h3>
        <div className="flex gap-3">
          {['active', 'inactive'].map(s => (
            <button
              key={s}
              onClick={() => setForm(f => ({ ...f, status: s }))}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-colors',
                form.status === s
                  ? s === 'active'
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-red-500 text-white border-red-500'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted'
              )}
            >
              {s === 'active' ? '✅ Ativo' : '⛔ Inativo'}
            </button>
          ))}
        </div>
      </div>

      {/* Webhook */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Webhook className="w-4 h-4" /> URL de Webhook
        </h3>
        <p className="text-sm text-muted-foreground">Configure esta URL no painel do Mercado Pago para receber eventos automáticos:</p>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted font-mono text-xs break-all select-all">
          {webhookUrl || 'Carregando...'}
        </div>
        <p className="text-xs text-muted-foreground">Eventos: <span className="font-medium">payment, subscription_preapproval</span></p>
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full h-11 gradient-primary text-white rounded-xl">
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
        ) : saved ? (
          <><CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!</>
        ) : (
          <><Save className="w-4 h-4" /> Salvar Configurações</>
        )}
      </Button>
    </div>
  );
}
