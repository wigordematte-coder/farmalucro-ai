import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Menu, Bell, ShieldCheck, Lock } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import TrialBanner from '@/components/TrialBanner';
import BlockedScreen from '@/components/subscription/BlockedScreen';
import AwaitingSubscription from '@/components/AwaitingSubscription';
import { usePharmacy } from '@/lib/pharmacyContext';
import { useSubscription, RESTRICTED_ROUTES } from '@/lib/subscriptionContext';
import { useUserRole } from '@/lib/roles';
import { cn } from '@/lib/utils';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings } = usePharmacy();
  const { subscription, isTrialExpired, isBlocked, isRestricted } = useSubscription();
  const location = useLocation();
  const { isSuperAdmin, isAdmin, loading } = useUserRole();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const accessDenied = isAdminRoute && !isSuperAdmin;

  const isRestrictedRoute = !isAdmin && isRestricted && RESTRICTED_ROUTES.some(route =>
    location.pathname === route || location.pathname.startsWith(route + '/')
  );

  const allowRoutes = ['/assinatura', '/configuracoes', '/perfil'];
  const showBlocked = isBlocked && !allowRoutes.includes(location.pathname) && !isAdminRoute;
  const showAwaiting = isTrialExpired && !allowRoutes.includes(location.pathname) && !isAdminRoute;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 glass border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 py-3.5">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                {isSuperAdmin ? (
                  <>
                    <h2 className="text-base lg:text-lg font-bold text-foreground flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-purple-600" />
                      Painel do Desenvolvedor
                    </h2>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      FarmaLucro AI — Gestão da Plataforma SaaS
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-base lg:text-lg font-bold text-foreground">
                      {settings?.name || 'FarmaLucro AI'}
                    </h2>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      Precificação inteligente para farmácias
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isSuperAdmin && (
                <button className="relative p-2 rounded-lg hover:bg-muted">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
                </button>
              )}
              <Link to="/perfil" className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm hover:opacity-90 transition-opacity",
                isSuperAdmin ? "bg-purple-600" : "gradient-accent"
              )}>
                {isSuperAdmin ? <ShieldCheck className="w-5 h-5" /> : (settings?.name?.[0] || 'F').toUpperCase()}
              </Link>
            </div>
          </div>
        </header>

        <main className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
          {!isSuperAdmin && subscription?.status === 'trialing' && !showAwaiting && !showBlocked && (
            <div className="mb-4">
              <TrialBanner />
            </div>
          )}

          {accessDenied ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <Lock className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Acesso restrito</h2>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Esta área é exclusiva do Super Administrador. Seu perfil não tem permissão para acessar o painel administrativo da plataforma.
              </p>
            </div>
          ) : showBlocked ? (
            <BlockedScreen />
          ) : showAwaiting ? (
            <AwaitingSubscription />
          ) : isRestrictedRoute ? (
            <AwaitingSubscription />
          ) : (
            (children || <Outlet />)
          )}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
