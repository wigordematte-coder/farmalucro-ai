import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { PharmacyProvider } from '@/lib/pharmacyContext';
import { SubscriptionProvider } from '@/lib/subscriptionContext';
import Layout from '@/components/Layout';

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
import AdminPanel from '@/pages/AdminPanel';
import Tenants from '@/pages/superadmin/Tenants';
import Subscriptions from '@/pages/superadmin/Subscriptions';
import Revenue from '@/pages/superadmin/Revenue';
import Plans from '@/pages/superadmin/Plans';
import SuperAdminUsers from '@/pages/superadmin/Users';
import AuditLogs from '@/pages/superadmin/AuditLogs';
import Employees from '@/pages/Employees';
import FinancialSettings from '@/pages/FinancialSettings';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
    <PharmacyProvider>
      <SubscriptionProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/importacao" element={<Import />} />
            <Route path="/curva-abc" element={<ABC />} />
            <Route path="/consultor-ia" element={<AIAssistant />} />
            <Route path="/promocoes" element={<Promotions />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/relatorios" element={<Reports />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/assinatura" element={<Subscription />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/farmacias" element={<Tenants />} />
            <Route path="/admin/assinaturas" element={<Subscriptions />} />
            <Route path="/admin/receita" element={<Revenue />} />
            <Route path="/admin/financeiro" element={<FinancialSettings />} />
            <Route path="/admin/planos" element={<Plans />} />
            <Route path="/admin/usuarios" element={<SuperAdminUsers />} />
            <Route path="/admin/auditoria" element={<AuditLogs />} />
            <Route path="/funcionarios" element={<Employees />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </SubscriptionProvider>
    </PharmacyProvider>
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