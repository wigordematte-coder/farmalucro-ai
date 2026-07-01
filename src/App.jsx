import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { PharmacyProvider } from '@/lib/pharmacyContext';
import { SubscriptionProvider } from '@/lib/subscriptionContext';
import { GlobalSettingsProvider } from '@/lib/globalSettingsContext';
import Layout from '@/components/Layout';
import RoleGuard from '@/components/RoleGuard';
import RequireEntitlement from '@/components/RequireEntitlement';

import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import Home from '@/pages/Home';
import Products from '@/pages/Products';
import Import from '@/pages/Import';
import AIAssistant from '@/pages/AIAssistant';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Subscription from '@/pages/Subscription';
import Precificacao from '@/pages/Precificacao';
import Perfil from '@/pages/Perfil';
import Results from '@/pages/Results';
import AdminPanel from '@/pages/AdminPanel';
import FinancialSettings from '@/pages/FinancialSettings';
import Tenants from '@/pages/superadmin/Tenants';
import Subscriptions from '@/pages/superadmin/Subscriptions';
import Revenue from '@/pages/superadmin/Revenue';
import Billing from '@/pages/superadmin/Billing';
import Support from '@/pages/superadmin/Support';
import Plans from '@/pages/superadmin/Plans';
import SuperAdminUsers from '@/pages/superadmin/Users';
import AuditLogs from '@/pages/superadmin/AuditLogs';
import GlobalSettingsPage from '@/pages/superadmin/GlobalSettings';
import MercadoPagoSettings from '@/pages/superadmin/MercadoPagoSettings';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

const withRole = (element, allowedRoles) => (
  <RoleGuard allowedRoles={allowedRoles}>{element}</RoleGuard>
);

const withSuperAdmin = (element) => withRole(element, ['super_admin']);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();
  const location = useLocation();

  const isAuthRoute = AUTH_ROUTES.includes(location.pathname);

  if (isAuthRoute && !isLoadingPublicSettings) {
    return (
      <GlobalSettingsProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </GlobalSettingsProvider>
    );
  }

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  if (!isAuthenticated) {
    return (
      <GlobalSettingsProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </GlobalSettingsProvider>
    );
  }

  return (
    <GlobalSettingsProvider>
      <PharmacyProvider>
        <SubscriptionProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/importacao" element={<RequireEntitlement path="/importacao"><Import /></RequireEntitlement>} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/precificacao" element={withRole(<RequireEntitlement path="/precificacao"><Precificacao /></RequireEntitlement>, ['pharmacy_admin', 'pharmacist'])} />
              <Route path="/consultor-ia" element={withRole(<RequireEntitlement path="/consultor-ia"><AIAssistant /></RequireEntitlement>, ['pharmacy_admin', 'pharmacist'])} />
              <Route path="/relatorios" element={withRole(<RequireEntitlement path="/relatorios"><Reports /></RequireEntitlement>, ['pharmacy_admin', 'pharmacist'])} />
              <Route path="/resultados" element={withRole(<Results />, ['pharmacy_admin', 'pharmacist'])} />
              <Route path="/configuracoes" element={withRole(<Settings />, ['pharmacy_admin'])} />
              <Route path="/assinatura" element={withRole(<Subscription />, ['pharmacy_admin'])} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/admin" element={withSuperAdmin(<AdminPanel />)} />
              <Route path="/admin/clientes" element={withSuperAdmin(<Tenants />)} />
              <Route path="/admin/assinaturas" element={withSuperAdmin(<Subscriptions />)} />
              <Route path="/admin/cobrancas" element={withSuperAdmin(<Billing />)} />
              <Route path="/admin/financeiro" element={withSuperAdmin(<FinancialSettings />)} />
              <Route path="/admin/receita" element={withSuperAdmin(<Revenue />)} />
              <Route path="/admin/logs" element={withSuperAdmin(<AuditLogs />)} />
              <Route path="/admin/configuracoes" element={withSuperAdmin(<GlobalSettingsPage />)} />
              <Route path="/admin/planos" element={withSuperAdmin(<Plans />)} />
              <Route path="/admin/usuarios" element={withSuperAdmin(<SuperAdminUsers />)} />
              <Route path="/admin/suporte" element={withSuperAdmin(<Support />)} />
              <Route path="/admin/mercadopago" element={withSuperAdmin(<MercadoPagoSettings />)} />
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </SubscriptionProvider>
      </PharmacyProvider>
    </GlobalSettingsProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
