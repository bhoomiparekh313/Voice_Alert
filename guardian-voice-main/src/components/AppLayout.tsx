import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useLocalStorage';
import { Shield, LayoutDashboard, Users, Settings, Eye, LogOut, Mic } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/guardian', label: 'Guardian', icon: Eye },
];

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-gradient-sidebar border-r border-border">
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-emergency flex items-center justify-center shadow-emergency">
              <Shield className="w-5 h-5 text-emergency-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">VANI</h1>
              <p className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">Safety System</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emergency/15 text-emergency border border-emergency/20'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-safe/10 border border-safe/20">
            <Mic className="w-4 h-4 text-safe" />
            <span className="text-xs text-safe font-medium">Voice Active</span>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border-t border-border">
            <div className="w-8 h-8 rounded-full bg-emergency/20 flex items-center justify-center text-emergency font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-emergency transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border">
        <nav className="flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 text-xs ${
                  isActive ? 'text-emergency' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
