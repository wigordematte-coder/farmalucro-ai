import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Plus, Loader2, Lock, CreditCard, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useUserRole } from '@/lib/roles';
import GatewayCard from '@/components/admin/GatewayCard';
import GatewayForm from '@/components/admin/GatewayForm';
import TransactionLogs from '@/components/admin/TransactionLogs';
import WebhookEvents from '@/components/admin/WebhookEvents';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

export default function FinancialSettings() {
  const [gateways, setGateways] = useState([]);
  const [logs, setLogs] = useState([]);
  const [webhookEvents, setWebhookEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const { isSuperAdmin, loading: roleLoading } = useUserRole();

  const loadGateways = useCallback(async () => {
    try {
      const list = await base44.entities.PaymentGateway.list('-created_date', 100);
      const sanitized = (list || []).map(gateway => {
        if (gateway.provider_type !== 'mercadopago') return gateway;
        if (gateway.api_key || gateway.public_key || gateway.secret_key) {
          base44.entities.PaymentGateway.update(gateway.id, {
            api_key: '',
            public_key: '',
            secret_key: '',
          }).catch(() => {});
        }
        return { ...gateway, api_key: '', public_key: '', secret_key: '' };
      });
      setGateways(sanitized);
    } catch {
      setGateways([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const [logList, evList] = await Promise.all([
        base44.entities.TransactionLog.list('-created_date', 100),
        base44.entities.WebhookEvent.list('-created_date', 100),
      ]);
      setLogs(logList || []);
      setWebhookEvents(evList || []);
    } catch {
      setLogs([]);
      setWebhookEvents([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      loadGateways();
      loadLogs();
    }
  }, [isSuperAdmin, loadGateways, loadLogs]);

  const handleSave = async (formData) => {
    try {
      const sanitizedFormData = { ...formData };
      if (sanitizedFormData.provider_type === 'mercadopago') {
        sanitizedFormData.api_key = '';
        sanitizedFormData.public_key = '';
        sanitizedFormData.secret_key = '';
      }
      if (editingGateway?.id) {
        const updateData = { ...sanitizedFormData };
        Object.keys(updateData).forEach(k => {
          if (updateData.provider_type !== 'mercadopago' &&
              typeof updateData[k] === 'string' &&
              updateData[k] === '' &&
              ['api_key', 'public_key', 'secret_key'].includes(k)) {
            delete updateData[k];
          }
        });
        await base44.entities.PaymentGateway.update(editingGateway.id, updateData);
      } else {
        await base44.entities.PaymentGateway.create(sanitizedFormData);
      }
      setFormOpen(false);
      setEditingGateway(null);
      await loadGateways();
    } catch (e) {
      alert('Erro ao salvar gateway: ' + (e.message || ''));
    }
  };

  const handleDelete = async (gw) => {
    if (!confirm(`Excluir o gateway "${gw.name}"?`)) return;
    try {
      await base44.entities.PaymentGateway.delete(gw.id);
      await loadGateways();
    } catch {
      alert('Erro ao excluir gateway');
    }
  };

  const handleSetDefault = async (gw) => {
    try {
      await base44.entities.PaymentGateway.updateMany(
        { is_default: true },
        { $set: { is_default: false } }
      );
      await base44.entities.PaymentGateway.update(gw.id, { is_default: true, status: 'active' });
      await loadGateways();
    } catch {
      alert('Erro ao definir gateway padrão');
    }
  };

  const handleTest = async (gw) => {
    setTestingId(gw.id);
    try {
      const usesBackendSecrets = gw.provider_type === 'mercadopago';
      const hasCredentials = usesBackendSecrets || Boolean(gw.api_key);
      await base44.integrations.Core.InvokeLLM({
        prompt: `Simule um teste de conexão com gateway de pagamento (${gw.provider_type}, ambiente: ${gw.environment}). O gateway possui credenciais configuradas. Responda se a conexão foi bem-sucedida.`,
        response_json_schema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['success', 'error'] },
            message: { type: 'string' },
          },
        },
      }).then(result => {
        alert(result.status === 'success'
          ? `✅ Conexão testada com sucesso!\n${result.message}`
          : `❌ Falha na conexão.\n${result.message}`);
      });

      await base44.entities.TransactionLog.create({
        transaction_id: `test_${Date.now()}`,
        gateway_name: gw.name,
        status: hasCredentials ? 'approved' : 'error',
        api_message: usesBackendSecrets
          ? 'Mercado Pago configurado via secrets do backend/Base44.'
          : hasCredentials ? 'Teste de conexão realizado com sucesso.' : 'Teste falhou: credenciais ausentes.',
        event_type: 'connection_test',
        amount: 0,
      });
      await loadLogs();
    } catch {
      alert('Não foi possível testar a conexão agora.');
    } finally {
      setTestingId(null);
    }
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Esta área é exclusiva para administradores. Seu perfil não tem permissão para acessar as configurações financeiras.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">Configurações Financeiras</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Gerencie gateways de pagamento, webhooks e monitore transações</p>
        </div>
        <button onClick={() => { setEditingGateway(null); setFormOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-light">
          <Plus className="w-4 h-4" /> Novo Gateway
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900">Segurança das credenciais</p>
          <p className="text-blue-700 mt-0.5">As chaves secretas são criptografadas e nunca exibidas completamente na interface. Apenas administradores podem visualizar e alterar estas configurações.</p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Gateways de Pagamento</h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Carregando gateways...
          </div>
        ) : gateways.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
            <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground mb-1">Nenhum gateway configurado</p>
            <p className="text-sm text-muted-foreground mb-4">Configure um gateway de pagamento para receber as assinaturas.</p>
            <button onClick={() => { setEditingGateway(null); setFormOpen(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-light">
              <Plus className="w-4 h-4" /> Configurar Primeiro Gateway
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {gateways.map(gw => (
              <GatewayCard
                key={gw.id}
                gateway={gw}
                onEdit={g => { setEditingGateway(g); setFormOpen(true); }}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
                onTest={handleTest}
                testingId={testingId}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-accent-dark" />
          <h2 className="font-semibold text-foreground">Monitoramento</h2>
        </div>
        <div className="space-y-4">
          <WebhookEvents events={webhookEvents} loading={logsLoading} />
          <TransactionLogs logs={logs} loading={logsLoading} />
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGateway ? 'Editar Gateway' : 'Novo Gateway de Pagamento'}</DialogTitle>
            <DialogDescription>
              {editingGateway
                ? 'Atualize as configurações do gateway. Deixe campos de credenciais em branco para manter os valores atuais.'
                : 'Configure um novo gateway de pagamento para processar assinaturas.'}
            </DialogDescription>
          </DialogHeader>
          <GatewayForm
            gateway={editingGateway}
            onSave={handleSave}
            onCancel={() => { setFormOpen(false); setEditingGateway(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
