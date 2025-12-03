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

  useEffect(() => {
    if (!user?.isAuthenticated) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/faculty', icon: GraduationCap, label: 'Faculty' },
    { to: '/fees', icon: DollarSign, label: 'Fees' },
    { to: '/payments', icon: Receipt, label: 'Payments' },
    { to: '/payroll', icon: Wallet, label: 'Payroll' },
    { to: '/courses', icon: BookOpen, label: 'Courses' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 glass-card border-r transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-0 lg:w-16'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border/50">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-gradient">SchoolMS</h1>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'hover:bg-primary/10 hover:text-primary',
                  !sidebarOpen && 'lg:justify-center'
                )}
                activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground glow"
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border/50 space-y-2">
            <Button
              variant="ghost"
              className={cn('w-full justify-start gap-3', !sidebarOpen && 'lg:justify-center')}
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
                'w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10',
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
        <header className="h-16 glass-card border-b flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold hidden sm:block">
              {navItems.find((item) => location.pathname.startsWith(item.to))?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <GlobalSearch />
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{user?.username}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  );
};

export default Layout;
