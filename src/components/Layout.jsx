import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { usePharmacy } from '@/lib/pharmacyContext';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings } = usePharmacy();

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
          {children || <Outlet />}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}