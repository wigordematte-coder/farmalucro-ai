import { useAuth } from '@/lib/AuthContext';

export const APP_ROLES = {
  super_admin: {
    label: 'Super Administrador',
    description: 'Proprietário do SaaS com acesso total à plataforma',
    platformRole: 'admin',
    color: 'bg-purple-100 text-purple-700',
  },
  pharmacy_admin: {
    label: 'Administrador da Farmácia',
    description: 'Gestor da farmácia com acesso total aos dados da empresa',
    platformRole: 'admin',
    color: 'bg-blue-100 text-blue-700',
  },
  pharmacist: {
    label: 'Farmacêutico',
    description: 'Acesso a IA, preços, produtos e relatórios',
    platformRole: 'user',
    color: 'bg-accent/10 text-accent-dark',
  },
  operator: {
    label: 'Operador',
    description: 'Consulta de produtos, preços e relatórios',
    platformRole: 'user',
    color: 'bg-gray-100 text-gray-600',
  },
};

export const CLIENT_NAV = [
  { label: 'Centro de Oportunidades', path: '/dashboard', icon: 'LayoutDashboard', roles: ['pharmacy_admin', 'pharmacist', 'operator'] },
  { label: 'Importar Nota Fiscal', path: '/importacao', icon: 'FileUp', roles: ['pharmacy_admin', 'pharmacist', 'operator'] },
  { label: 'Produtos', path: '/produtos', icon: 'Package', roles: ['pharmacy_admin', 'pharmacist', 'operator'] },
  { label: 'Precificação Inteligente', path: '/precificacao', icon: 'DollarSign', roles: ['pharmacy_admin', 'pharmacist'] },
  { label: 'Consultor FarmaLucro AI', path: '/consultor-ia', icon: 'Bot', roles: ['pharmacy_admin', 'pharmacist'] },
  { label: 'Relatórios', path: '/relatorios', icon: 'FileText', roles: ['pharmacy_admin', 'pharmacist'] },
  { label: 'Centro de Resultados', path: '/resultados', icon: 'Trophy', roles: ['pharmacy_admin', 'pharmacist'] },
  { label: 'Minha Assinatura', path: '/assinatura', icon: 'CreditCard', roles: ['pharmacy_admin'] },
  { label: 'Configurações', path: '/configuracoes', icon: 'Settings', roles: ['pharmacy_admin'] },
];

export const SUPER_ADMIN_NAV = [
  { label: 'Dashboard Global', path: '/admin', icon: 'Globe' },
  { label: 'Clientes', path: '/admin/clientes', icon: 'Building2' },
  { label: 'Assinaturas', path: '/admin/assinaturas', icon: 'CreditCard' },
  { label: 'Cobranças', path: '/admin/cobrancas', icon: 'Wallet' },
  { label: 'Config. Financeiras', path: '/admin/financeiro', icon: 'Wallet' },
  { label: 'Receita', path: '/admin/receita', icon: 'DollarSign' },
  { label: 'Logs', path: '/admin/logs', icon: 'ScrollText' },
  { label: 'Suporte', path: '/admin/suporte', icon: 'Users' },
  { label: 'Configurações Globais', path: '/admin/configuracoes', icon: 'Settings' },
  { label: 'Mercado Pago', path: '/admin/mercadopago', icon: 'Wallet' },
];

export function getNavForRole(appRole) {
  if (appRole === 'super_admin') return SUPER_ADMIN_NAV;
  return CLIENT_NAV.filter(item => item.roles.includes(appRole));
}

export function useUserRole() {
  const { user, isLoadingAuth } = useAuth();

  const appRole = user?.app_role || 'operator';
  const tenantId = user?.tenant_id || '';
  const isSuperAdmin = appRole === 'super_admin';
  const isPharmacyAdmin = appRole === 'pharmacy_admin';
  const isPharmacist = appRole === 'pharmacist';
  const isOperator = appRole === 'operator';
  const isAdmin = isSuperAdmin || isPharmacyAdmin;

  return { user, appRole, tenantId, isSuperAdmin, isPharmacyAdmin, isPharmacist, isOperator, isAdmin, loading: isLoadingAuth };
}

export function canAccess(route, appRole) {
  if (appRole === 'super_admin') return true;
  const item = CLIENT_NAV.find(n => n.path === route);
  if (!item) return false;
  return item.roles.includes(appRole);
}
