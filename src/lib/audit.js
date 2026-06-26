import { base44 } from '@/api/base44Client';

export async function logAudit(action, description, options = {}) {
  try {
    const user = await base44.auth.me();
    const appRole = user?.app_role || (user?.role === 'admin' ? 'super_admin' : 'operator');
    const tenantId = user?.tenant_id || options.tenant_id || '';
    const tenantName = options.tenant_name || '';

    await base44.entities.AuditLog.create({
      action,
      description: description || '',
      entity_type: options.entity_type || '',
      entity_id: options.entity_id || '',
      user_name: user?.full_name || user?.email || 'Sistema',
      user_email: user?.email || '',
      user_role: appRole,
      tenant_id: tenantId,
      tenant_name: tenantName,
      ip_address: options.ip_address || '',
      metadata: options.metadata ? JSON.stringify(options.metadata) : '',
    });
  } catch (e) {
    // Silent fail — audit logging must never break the main operation
  }
}