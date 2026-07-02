import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CONFIRMATION = 'DELETE_TEST_TENANTS';

const TENANT_SCOPED_ENTITIES = [
  'PharmacySettings',
  'Subscription',
  'Product',
  'Invoice',
  'Payment',
  'ChatMessage',
  'ChatConversation',
  'Oportunidade',
  'MarketingContent',
  'Promotion',
  'CategoryMargin',
] as const;

const ADMIN_LOG_ENTITIES = [
  'TransactionLog',
  'WebhookEvent',
] as const;

type EntityName = typeof TENANT_SCOPED_ENTITIES[number] | typeof ADMIN_LOG_ENTITIES[number] | 'Tenant';

function cleanCnpj(value: unknown) {
  return String(value || '').replace(/\D/g, '');
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getEntity(base44: any, entity: EntityName) {
  return base44.asServiceRole.entities[entity];
}

function publicTenant(tenant: any) {
  return {
    id: tenant.id,
    name: tenant.name || '',
    trade_name: tenant.trade_name || '',
    cnpj: tenant.cnpj || '',
    normalized_cnpj: cleanCnpj(tenant.cnpj),
    created_at: tenant.created_date || tenant.created_at || tenant.createdAt || null,
    responsible_email: tenant.responsible_email || '',
    subscription_status: tenant.subscription_status || '',
    is_suspended: Boolean(tenant.is_suspended),
  };
}

async function listAll(entityApi: any, sort = '-created_date', limit = 1000) {
  const records = await entityApi.list(sort, limit).catch(() => []);
  return Array.isArray(records) ? records : [];
}

async function filterByTenant(entityApi: any, tenantId: string) {
  const records = await entityApi.filter({ tenant_id: tenantId }, '-created_date', 1000).catch(() => []);
  return Array.isArray(records) ? records : [];
}

async function filterByField(entityApi: any, field: string, value: string) {
  const records = await entityApi.filter({ [field]: value }, '-created_date', 1000).catch(() => []);
  return Array.isArray(records) ? records : [];
}

async function deleteRecords(entityApi: any, records: any[]) {
  let deleted = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const record of records) {
    if (!record?.id) continue;
    try {
      await entityApi.delete(record.id);
      deleted += 1;
    } catch (err) {
      errors.push({
        id: record.id,
        error: err instanceof Error ? err.message : 'delete failed',
      });
    }
  }

  return { deleted, errors };
}

async function getTenantRecords(base44: any, entity: typeof TENANT_SCOPED_ENTITIES[number], tenantId: string, conversationIds: string[] = []) {
  const api = getEntity(base44, entity);
  const records = await filterByTenant(api, tenantId);
  const byConversation = entity === 'ChatMessage'
    ? (await Promise.all(conversationIds.map((id: string) => filterByField(api, 'conversation_id', id)))).flat()
    : [];

  return [...records, ...byConversation]
    .filter((record: any, index: number, list: any[]) => record?.id && list.findIndex(item => item.id === record.id) === index);
}

async function buildTenantPlan(base44: any, tenant: any) {
  const tenantId = tenant.id;
  const entities: Record<string, { count: number; ids: string[] }> = {};
  const chatConversations = await filterByTenant(getEntity(base44, 'ChatConversation'), tenantId);
  const conversationIds = chatConversations.map((item: any) => item.id).filter(Boolean);

  for (const entity of TENANT_SCOPED_ENTITIES) {
    const records = await getTenantRecords(base44, entity, tenantId, conversationIds);
    entities[entity] = {
      count: records.length,
      ids: records.map((record: any) => record.id),
    };
  }

  for (const entity of ADMIN_LOG_ENTITIES) {
    const records = await filterByTenant(getEntity(base44, entity), tenantId);
    entities[entity] = {
      count: records.length,
      ids: records.map((record: any) => record.id).filter(Boolean),
    };
  }

  entities.Tenant = { count: 1, ids: [tenantId] };

  return {
    tenant: publicTenant(tenant),
    entities,
  };
}

function parseBody(body: any) {
  return {
    action: text(body.action || 'list'),
    tenantIds: Array.isArray(body.tenant_ids) ? body.tenant_ids.map(text).filter(Boolean) : [],
    protectedCnpjs: Array.isArray(body.protected_cnpjs)
      ? body.protected_cnpjs.map(cleanCnpj).filter(Boolean)
      : [],
    confirm: text(body.confirm),
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.app_role !== 'super_admin') {
      return Response.json({ error: 'Apenas super_admin pode executar limpeza de dados.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, tenantIds, protectedCnpjs, confirm } = parseBody(body);
    const tenants = await listAll(getEntity(base44, 'Tenant'));
    const tenantsById = new Map(tenants.map((tenant: any) => [tenant.id, tenant]));

    if (action === 'list') {
      return Response.json({
        mode: 'list',
        tenants: tenants.map(publicTenant),
        not_deleted: [
          'PaymentGateway',
          'GlobalSettings',
          'SubscriptionPlan',
          'User',
          'codigo/funcoes',
        ],
      });
    }

    if (!['plan', 'delete'].includes(action)) {
      return Response.json({ error: 'Acao invalida. Use list, plan ou delete.' }, { status: 400 });
    }

    if (tenantIds.length === 0) {
      return Response.json({ error: 'Informe tenant_ids para plan/delete.' }, { status: 400 });
    }

    const selectedTenants = tenantIds
      .map(id => tenantsById.get(id))
      .filter(Boolean);
    const missingTenantIds = tenantIds.filter(id => !tenantsById.has(id));
    const protectedMatches = selectedTenants
      .map(publicTenant)
      .filter(tenant => protectedCnpjs.includes(tenant.normalized_cnpj));

    if (protectedMatches.length > 0) {
      return Response.json({
        error: 'Tenant protegido por CNPJ informado. Remova de protected_cnpjs somente se tiver certeza.',
        protected_matches: protectedMatches,
      }, { status: 409 });
    }

    const plan = await Promise.all(selectedTenants.map((tenant: any) => buildTenantPlan(base44, tenant)));

    if (action === 'plan') {
      return Response.json({
        mode: 'dry_run',
        missing_tenant_ids: missingTenantIds,
        plan,
        not_deleted: [
          'PaymentGateway',
          'GlobalSettings',
          'SubscriptionPlan',
          'User',
          'codigo/funcoes',
        ],
        delete_confirmation_required: CONFIRMATION,
      });
    }

    if (confirm !== CONFIRMATION) {
      return Response.json({
        error: `Confirmacao obrigatoria ausente. Envie confirm: "${CONFIRMATION}".`,
        plan,
      }, { status: 400 });
    }

    const deletionResults: Record<string, any> = {};
    for (const tenant of selectedTenants) {
      const tenantId = tenant.id;
      const chatConversations = await filterByTenant(getEntity(base44, 'ChatConversation'), tenantId);
      const conversationIds = chatConversations.map((item: any) => item.id).filter(Boolean);
      deletionResults[tenantId] = { tenant: publicTenant(tenant), entities: {} };

      for (const entity of TENANT_SCOPED_ENTITIES) {
        const api = getEntity(base44, entity);
        const records = await getTenantRecords(base44, entity, tenantId, conversationIds);
        const deleted = await deleteRecords(api, records);
        deletionResults[tenantId].entities[entity] = deleted;
      }

      for (const entity of ADMIN_LOG_ENTITIES) {
        const api = getEntity(base44, entity);
        const records = await filterByTenant(api, tenantId);
        const deleted = await deleteRecords(api, records);
        deletionResults[tenantId].entities[entity] = deleted;
      }

      const tenantDelete = await deleteRecords(getEntity(base44, 'Tenant'), [tenant]);
      deletionResults[tenantId].entities.Tenant = tenantDelete;
    }

    return Response.json({
      mode: 'delete',
      missing_tenant_ids: missingTenantIds,
      results: deletionResults,
      not_deleted: [
        'PaymentGateway',
        'GlobalSettings',
        'SubscriptionPlan',
        'User',
        'codigo/funcoes',
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao executar rotina de limpeza.';
    console.error('cleanupTestData failed', { message });
    return Response.json({ error: message }, { status: 500 });
  }
});
