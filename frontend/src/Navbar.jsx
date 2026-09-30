import React from 'react';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  AlertTriangle, 
  Search, 
  Bot, 
  BookOpen, 
  FileText, 
  UserCheck,
  Server
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'alerts', label: 'Risk Alerts', icon: AlertTriangle },
    { id: 'investigation', label: 'Customer Investigation', icon: Search },
    { id: 'transactions', label: 'Transaction Explorer', icon: UserCheck },
    { id: 'copilot', label: 'AI Copilot', icon: Bot },
    { id: 'regulatory', label: 'Regulatory Intelligence', icon: BookOpen },
    { id: 'reports', label: 'Investigation Reports', icon: FileText },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="p-2 bg-blue-600/20 border border-blue-500/40 rounded-lg text-blue-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-wide text-white">RISKWISE</span>
              </div>
              <p className="text-xs text-slate-400">Risk, Fraud & Regulatory Intelligence Copilot</p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Snowflake Badge & Status */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300">Snowflake Engine:</span>
              <span className="text-cyan-400 font-semibold">ACTIVE</span>
            </div>
            <button 
              onClick={() => setActiveTab('investigation')}
              className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-all flex items-center space-x-1"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Demo Case C102</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
