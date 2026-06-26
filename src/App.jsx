import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { PharmacyProvider } from '@/lib/pharmacyContext';
import { SubscriptionProvider } from '@/lib/subscriptionContext';
import { GlobalSettingsProvider } from '@/lib/globalSettingsContext';
import Layout from '@/components/Layout';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import Home from '@/pages/Home';
import Products from '@/pages/Products';
import Import from '@/pages/Import';
import ABC from '@/pages/ABC';
import AIAssistant from '@/pages/AIAssistant';
import Promotions from '@/pages/Promotions';
import Marketing from '@/pages/Marketing';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Subscription from '@/pages/Subscription';
import Estoque from '@/pages/Estoque';
import Compras from '@/pages/Compras';
import Vendas from '@/pages/Vendas';
import Precificacao from '@/pages/Precificacao';
import Perfil from '@/pages/Perfil';
import AdminPanel from '@/pages/AdminPanel';
import Tenants from '@/pages/superadmin/Tenants';
import Subscriptions from '@/pages/superadmin/Subscriptions';
import Revenue from '@/pages/superadmin/Revenue';
import Plans from '@/pages/superadmin/Plans';
import SuperAdminUsers from '@/pages/superadmin/Users';
import AuditLogs from '@/pages/superadmin/AuditLogs';
import GlobalSettingsPage from '@/pages/superadmin/GlobalSettings';
import Employees from '@/pages/Employees';
import FinancialSettings from '@/pages/FinancialSettings';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
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

  return (
    <GlobalSettingsProvider>
      <PharmacyProvider>
        <SubscriptionProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/importacao" element={<Import />} />
              <Route path="/estoque" element={<Estoque />} />
              <Route path="/compras" element={<Compras />} />
              <Route path="/vendas" element={<Vendas />} />
              <Route path="/precificacao" element={<Precificacao />} />
              <Route path="/curva-abc" element={<ABC />} />
              <Route path="/consultor-ia" element={<AIAssistant />} />
              <Route path="/promocoes" element={<Promotions />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="/assinatura" element={<Subscription />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin/farmacias" element={<Tenants />} />
              <Route path="/admin/assinaturas" element={<Subscriptions />} />
              <Route path="/admin/receita" element={<Revenue />} />
              <Route path="/admin/financeiro" element={<FinancialSettings />} />
              <Route path="/admin/planos" element={<Plans />} />
              <Route path="/admin/configuracoes" element={<GlobalSettingsPage />} />
              <Route path="/admin/usuarios" element={<SuperAdminUsers />} />
              <Route path="/admin/auditoria" element={<AuditLogs />} />
              <Route path="/funcionarios" element={<Employees />} />
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