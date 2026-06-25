import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import BlockedScreen from '@/components/subscription/BlockedScreen';
import { base44 } from '@/api/base44Client';
import { usePharmacy } from '@/lib/pharmacyContext';
import { useSubscription } from '@/lib/subscriptionContext';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings } = usePharmacy();
  const { subscription } = useSubscription();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me().then(user => setIsAdmin(user?.role === 'admin')).catch(() => {});
  }, []);

  const isBlocked = subscription?.status === 'blocked' && !isAdmin;
  const allowRoutes = ['/assinatura', '/configuracoes', '/admin'];
  const showBlocked = isBlocked && !allowRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 glass border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 py-3.5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base lg:text-lg font-bold text-foreground">
                  {settings?.name || 'FarmaLucro AI'}
                </h2>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Precificação inteligente para farmácias
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-lg hover:bg-muted">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
              </button>
              <div className="w-9 h-9 rounded-full gradient-accent flex items-center justify-center text-white font-semibold text-sm">
                {(settings?.name?.[0] || 'F').toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
          {showBlocked ? <BlockedScreen /> : (children || <Outlet />)}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}