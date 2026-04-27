import { BarChart3, Zap, TrendingUp, Settings, LogOut, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

export function DashboardSidebar() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      icon: <BarChart3 className="w-5 h-5" />,
      href: "/dashboard",
    },
    {
      label: "Opportunities",
      icon: <Zap className="w-5 h-5" />,
      href: "/dashboard/opportunities",
    },
    {
      label: "Analytics",
      icon: <TrendingUp className="w-5 h-5" />,
      href: "/dashboard/analytics",
    },
    {
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      href: "/dashboard/settings",
    },
  ];

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/");
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="text-2xl font-bold text-white">ArbitrageHub</div>
        <p className="text-xs text-slate-400 mt-1">Sports Arbitrage Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => navigate(item.href)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              location === item.href
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {item.icon}
            <span className="flex-1 text-left text-sm font-medium">
              {item.label}
            </span>
            {item.badge && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="px-4 py-3 bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-400">Logged in as</p>
          <p className="text-sm text-white font-medium truncate">{user?.name}</p>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full text-slate-300 hover:text-white border-slate-700 hover:bg-slate-800"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
