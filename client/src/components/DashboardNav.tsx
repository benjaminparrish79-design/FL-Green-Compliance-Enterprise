import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  LayoutDashboard,
  CheckSquare,
  Truck,
  Clipboard,
  Camera,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export function DashboardNav() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/compliance", label: "Compliance", icon: CheckSquare },
    { path: "/fleet", label: "Fleet", icon: Truck },
    { path: "/work-orders", label: "Work Orders", icon: Clipboard },
    { path: "/inspections", label: "Inspections", icon: Camera },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const isActive = (path: string) => location === path;

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">FL Green</h1>
        <button onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          mobileOpen ? "block" : "hidden"
        } md:block fixed md:relative left-0 top-0 w-64 h-screen bg-slate-900 text-white p-4 overflow-y-auto z-40`}
      >
        <div className="mb-8 hidden md:block">
          <h1 className="text-2xl font-bold">FL Green</h1>
          <p className="text-xs text-slate-400">Compliance Platform</p>
        </div>

        {/* User Info */}
        <div className="bg-slate-800 rounded p-3 mb-6">
          <p className="text-sm font-medium">{user?.name || "User"}</p>
          <p className="text-xs text-slate-400">{user?.role}</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-2 mb-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="space-y-2 border-t border-slate-700 pt-4">
          <button
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
