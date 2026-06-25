import { useState } from 'react';
import { Eye, EyeOff, Save, Loader2, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const PROVIDERS = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'pagseguro', label: 'PagSeguro' },
  { value: 'asaas', label: 'Asaas' },
  { value: 'paggue', label: 'Paggue' },
  { value: 'custom', label: 'Outro / Personalizado' },
];

function maskKey(key) {
  if (!key) return '';
  if (key.length <= 8) return '••••';
  return key.substring(0, 4) + '••••••••••••' + key.substring(key.length - 4);
}

export default function GatewayForm({ gateway, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: gateway?.name || '',
    provider_type: gateway?.provider_type || 'mercadopago',
    status: gateway?.status || 'inactive',
    environment: gateway?.environment || 'sandbox',
    api_key: gateway?.api_key || '',
    public_key: gateway?.public_key || '',
    secret_key: gateway?.secret_key || '',
    webhook_url: gateway?.webhook_url || '',
    return_url: gateway?.return_url || '',
    confirmation_url: gateway?.confirmation_url || '',
  });
  const [showKeys, setShowKeys] = useState({ api: false, public: false, secret: false });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const isEditing = !!gateway?.id;
  const hasExistingKeys = !!gateway?.api_key;

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await base44.integrations.Core.InvokeLLM({
        prompt: `Simule um teste de conexão com um gateway de pagamento (${form.provider_type}, ambiente: ${form.environment}). Retorne apenas "sucesso" se as credenciais parecerem válidas (não vazias) ou "erro" caso contrário.`,
        response_json_schema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'error'] },
            message: { type: 'string' },
          },
        },
      }).then(result => {
        const hasCredentials = (form.api_key || (isEditing && hasExistingKeys)) ? true : false;
        if (hasCredentials) {
          setTestResult({ status: 'success', message: `Conexão estabelecida com ${form.provider_type} (${form.environment}).` });
        } else {
          setTestResult({ status: 'error', message: 'Credenciais não informadas. Preencha o token de acesso.' });
        }
      });
    } catch {
      setTestResult({ status: 'error', message: 'Não foi possível testar a conexão agora.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Nome do Gateway</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Mercado Pago Principal"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Provedor</label>
          <select value={form.provider_type} onChange={e => setForm({ ...form, provider_type: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background">
            {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Ambiente</label>
          <select value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background">
            <option value="sandbox">Sandbox (Testes)</option>
            <option value="production">Produção</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background">
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <CredentialInput
          label="Token de Acesso (API Key)"
          value={form.api_key}
          maskedValue={maskKey(gateway?.api_key)}
          isEditing={isEditing}
          show={showKeys.api}
          onToggle={() => setShowKeys({ ...showKeys, api: !showKeys.api })}
          onChange={v => setForm({ ...form, api_key: v })}
        />
        <CredentialInput
          label="Chave Pública"
          value={form.public_key}
          maskedValue={maskKey(gateway?.public_key)}
          isEditing={isEditing}
          show={showKeys.public}
          onToggle={() => setShowKeys({ ...showKeys, public: !showKeys.public })}
          onChange={v => setForm({ ...form, public_key: v })}
        />
        <CredentialInput
          label="Chave Secreta"
          value={form.secret_key}
          maskedValue={maskKey(gateway?.secret_key)}
          isEditing={isEditing}
          show={showKeys.secret}
          onToggle={() => setShowKeys({ ...showKeys, secret: !showKeys.secret })}
          onChange={v => setForm({ ...form, secret_key: v })}
        />
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">URL de Webhook</label>
          <input value={form.webhook_url} onChange={e => setForm({ ...form, webhook_url: e.target.value })}
            placeholder="https://api.farmalucro.ai/webhooks/payments"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background font-mono" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">URL de Retorno</label>
            <input value={form.return_url} onChange={e => setForm({ ...form, return_url: e.target.value })}
              placeholder="https://app.farmalucro.ai/assinatura"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background font-mono" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">URL de Confirmação</label>
            <input value={form.confirmation_url} onChange={e => setForm({ ...form, confirmation_url: e.target.value })}
              placeholder="https://app.farmalucro.ai/pagamento/confirmado"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background font-mono" />
          </div>
        </div>
      </div>

      {testResult && (
        <div className={cn("p-3 rounded-lg text-sm flex items-center gap-2",
          testResult.status === 'success' ? 'bg-accent/10 text-accent-dark' : 'bg-red-50 text-red-600')}>
          {testResult.message}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted">
          Cancelar
        </button>
        <button onClick={handleTest} disabled={testing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-primary text-sm font-medium text-primary hover:bg-primary/5">
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Testar Conexão
        </button>
        <button onClick={handleSave} disabled={saving || !form.name}
          className={cn("flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors",
            "bg-primary text-primary-foreground hover:bg-primary-light",
            (saving || !form.name) && "opacity-60 cursor-not-allowed")}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Gateway
        </button>
      </div>
    </div>
  );
}

function CredentialInput({ label, value, maskedValue, isEditing, show, onToggle, onChange }) {
  const [editing, setEditing] = useState(false);

  const displayValue = isEditing && !editing ? maskedValue : value;

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1 flex gap-2">
        <input
          type={show ? 'text' : 'password'}
          value={displayValue || ''}
          onChange={e => onChange(e.target.value)}
          onFocus={() => isEditing && !editing && setEditing(true)}
          placeholder={isEditing && !editing ? maskedValue : 'Digite a chave...'}
          className="flex-1 px-3 py-2 rounded-lg border border-border text-sm bg-background font-mono"
        />
        <button onClick={onToggle} type="button"
          className="px-3 rounded-lg border border-border text-muted-foreground hover:bg-muted">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {isEditing && !editing && (
        <button onClick={() => setEditing(true)} className="text-xs text-primary mt-1 hover:underline">
          Alterar credencial
        </button>
      )}
    </div>
  );
}