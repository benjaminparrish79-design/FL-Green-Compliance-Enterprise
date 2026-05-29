import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { CheckCircle2, MapPin, Zap, Shield, BarChart3, Bell } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-blue-600">FL Green Compliance</h1>
            <div className="flex gap-4 items-center">
              <span className="text-gray-700">Welcome, {user.name || user.email}</span>
              <Button onClick={() => navigate("/dashboard")}>Dashboard</Button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-4">Enterprise Compliance Management</h2>
              <p className="text-lg text-gray-600 mb-6">
                Manage compliance workflows, track field operations, and ensure regulatory adherence across your organization.
              </p>
              <Button size="lg" onClick={() => navigate("/dashboard")} className="mb-4">
                Go to Dashboard
              </Button>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-6">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <span>Multi-tenant architecture</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-blue-600" />
                  <span>Real-time GPS tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-yellow-600" />
                  <span>AI-powered inspections</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-purple-600" />
                  <span>Enterprise security</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <BarChart3 className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="text-xl font-bold mb-2">Compliance Dashboard</h3>
              <p className="text-gray-600">Track compliance status, violations, and remediation across all properties.</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <MapPin className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="text-xl font-bold mb-2">Fleet Management</h3>
              <p className="text-gray-600">Real-time GPS tracking, device management, and worker location monitoring.</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <Bell className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="text-xl font-bold mb-2">Smart Alerts</h3>
              <p className="text-gray-600">Instant notifications via SMS, Slack, and email for critical compliance events.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-4">FL Green Compliance</h1>
        <p className="text-xl mb-8">Enterprise Compliance & Field Operations Platform</p>
        <Button 
          size="lg" 
          onClick={() => window.location.href = getLoginUrl()} 
          className="bg-white text-blue-600 hover:bg-gray-100"
        >
          Sign In with Manus
        </Button>
      </div>
    </div>
  );
}
