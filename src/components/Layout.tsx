import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Receipt,
  BookOpen,
  Wallet,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NavLink } from '@/components/NavLink';
import GlobalSearch from '@/components/GlobalSearch';
import AIChatWidget from '@/components/AIChatWidget';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, theme, toggleTheme } = useAppStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ✅ NEW: Finance submenu state
  const [financeOpen, setFinanceOpen] = useState(false);

  useEffect(() => {
    if (!user?.isAuthenticated) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // ✅ Auto open finance menu when route is inside finance
  useEffect(() => {
    if (location.pathname.startsWith('/finance')) {
      setFinanceOpen(true);
    }
  }, [location.pathname]);

  // ✅ UPDATED navItems
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/faculty', icon: GraduationCap, label: 'Faculty' },
    { to: '/fees', icon: DollarSign, label: 'Fees' },

    // 🔥 Finance with submenu
    {
      to: '/finance',
      icon: Receipt,
      label: 'Finance',
      children: [
        { to: '/finance/fee-management', label: 'Fee Management' },
        { to: '/finance/expenses', label: 'Expenses' },
      ],
    },

    { to: '/payroll', icon: Wallet, label: 'Payroll' },
    { to: '/courses', icon: BookOpen, label: 'Courses' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex w-full bg-[hsl(var(--background))]">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 flex-shrink-0 overflow-hidden transition-all duration-300 shadow-2xl bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-20'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
            {sidebarOpen && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">Dashboard</p>
                <h1 className="text-2xl font-semibold">Vijaya College</h1>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white/80 lg:hidden hover:bg-white/10"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              // 🔥 If item has submenu
              if (item.children) {
                return (
                  <div key={item.to}>
                    {/* Parent */}
                    <div
                      onClick={() => setFinanceOpen(!financeOpen)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium cursor-pointer text-white/70 hover:text-white hover:bg-white/15',
                        !sidebarOpen && 'lg:justify-center'
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </div>

                    {/* Submenu */}
                    {financeOpen && sidebarOpen && (
                      <div className="ml-8 space-y-1 mt-1">
                        {item.children.map((sub) => (
                          <NavLink
                            key={sub.to}
                            to={sub.to}
                            className="block px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                            activeClassName="bg-white/20 text-white"
                          >
                            {sub.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // 🔥 Normal menu
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 text-white/70 hover:text-white hover:bg-white/15',
                    !sidebarOpen && 'lg:justify-center'
                  )}
                  activeClassName="bg-white/25 text-white shadow-lg shadow-black/10 border border-white/20"
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-6 border-t border-white/10 space-y-2">
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 text-white/80 hover:bg-white/10 hover:text-white',
                !sidebarOpen && 'lg:justify-center'
              )}
              onClick={toggleTheme}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              {sidebarOpen && <span>Toggle Theme</span>}
            </Button>

            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 text-white/80 hover:bg-white/10 hover:text-white',
                !sidebarOpen && 'lg:justify-center'
              )}
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              {sidebarOpen && <span>Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))]/80 bg-white/80 backdrop-blur">
          <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
            <p className="text-lg font-semibold">
              {navItems.find((item) =>
                location.pathname.startsWith(item.to)
              )?.label || 'Overview'}
            </p>

            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/notifications')}>
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      <AIChatWidget />
    </div>
  );
};

export default Layout;