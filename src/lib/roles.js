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
    description: 'Acesso a IA, preços, promoções, estoque e relatórios',
    platformRole: 'user',
    color: 'bg-accent/10 text-accent-dark',
  },
  operator: {
    label: 'Operador',
    description: 'Consulta de produtos, preços e promoções',
    platformRole: 'user',
    color: 'bg-gray-100 text-gray-600',
  },
};

export const CLIENT_NAV = [
  { label: 'Dashboard', path: '/', icon: 'LayoutDashboard', roles: ['pharmacy_admin', 'pharmacist', 'operator'] },
  { label: 'Produtos', path: '/produtos', icon: 'Package', roles: ['pharmacy_admin', 'pharmacist', 'operator'] },
  { label: 'Importação', path: '/importacao', icon: 'FileUp', roles: ['pharmacy_admin'] },
  { label: 'Curva ABC', path: '/curva-abc', icon: 'BarChart3', roles: ['pharmacy_admin', 'pharmacist'] },
  { label: 'Consultor IA', path: '/consultor-ia', icon: 'Bot', roles: ['pharmacy_admin', 'pharmacist'] },
  { label: 'Promoções', path: '/promocoes', icon: 'Tag', roles: ['pharmacy_admin', 'pharmacist', 'operator'] },
  { label: 'Marketing', path: '/marketing', icon: 'Megaphone', roles: ['pharmacy_admin'] },
  { label: 'Relatórios', path: '/relatorios', icon: 'FileText', roles: ['pharmacy_admin', 'pharmacist'] },
  { label: 'Funcionários', path: '/funcionarios', icon: 'Users', roles: ['pharmacy_admin'] },
  { label: 'Configurações', path: '/configuracoes', icon: 'Settings', roles: ['pharmacy_admin'] },
  { label: 'Assinatura', path: '/assinatura', icon: 'CreditCard', roles: ['pharmacy_admin'] },
];

export const SUPER_ADMIN_NAV = [
  { label: 'Dashboard Global', path: '/admin', icon: 'Globe' },
  { label: 'Farmácias', path: '/admin/farmacias', icon: 'Building2' },
  { label: 'Assinaturas', path: '/admin/assinaturas', icon: 'CreditCard' },
  { label: 'Receita SaaS', path: '/admin/receita', icon: 'DollarSign' },
  { label: 'Config. Financeiras', path: '/admin/financeiro', icon: 'Wallet' },
  { label: 'Planos', path: '/admin/planos', icon: 'Layers' },
  { label: 'Usuários', path: '/admin/usuarios', icon: 'Users' },
  { label: 'Auditoria', path: '/admin/auditoria', icon: 'ScrollText' },
];

export function getNavForRole(appRole) {
  if (appRole === 'super_admin') return SUPER_ADMIN_NAV;
  return CLIENT_NAV.filter(item => item.roles.includes(appRole));
}

export function useUserRole() {
  const { user, isLoadingAuth } = useAuth();

  const appRole = user?.app_role || (user?.role === 'admin' ? 'super_admin' : 'operator');
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