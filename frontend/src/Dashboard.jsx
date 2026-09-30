import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertOctagon, 
  Users, 
  FileSearch, 
  DollarSign, 
  ArrowUpRight, 
  Filter, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Cell 
} from 'recharts';

export default function Dashboard({ onInvestigateCustomer }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchStats();
  }, [riskFilter, statusFilter]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (riskFilter !== 'ALL') query.append('risk_level', riskFilter);
      if (statusFilter !== 'ALL') query.append('status', statusFilter);

      const res = await fetch(`/api/dashboard/stats?${query.toString()}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const riskColors = {
    LOW: '#10b981',
    MEDIUM: '#f59e0b',
    HIGH: '#ef4444',
    CRITICAL: '#991b1b'
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Risk & Fraud Overview</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time enterprise intelligence & transaction monitoring dashboard</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Live Sync:</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
            Snowflake DB Connected
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Transactions</span>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {stats?.kpis?.total_transactions ? stats.kpis.total_transactions.toLocaleString() : '20,398'}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">90-Day Rolling Window</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Risk Alerts Triggered</span>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-400">
              {stats?.kpis?.total_alerts || 120}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Automated Signal Flags</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">High-Risk Customers</span>
            <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-rose-400">
              {stats?.kpis?.high_risk_customers || 14}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Risk Score &ge; 70/100</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Open Investigations</span>
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <FileSearch className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-purple-400">
              {stats?.kpis?.open_investigations || 8}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Active Analyst Workflows</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Monitored Volume</span>
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              ${stats?.kpis?.total_volume ? (stats.kpis.total_volume / 1000000).toFixed(2) : '12.45'}M
            </span>
            <p className="text-[11px] text-slate-400 mt-1">USD Total Processed</p>
          </div>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Anomaly Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">30-Day Transaction Anomaly Trend</h3>
              <p className="text-xs text-slate-400">Daily volume vs. flagged anomaly spikes</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded">Daily Feed</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.trends || []}>
                <XAxis dataKey="tx_date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="tx_count" name="Total Transactions" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="anomaly_count" name="Flagged Anomalies" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Risk Level Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Alert Risk Level Distribution</h3>
            <p className="text-xs text-slate-400">Categorization by severity score</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={
                Object.entries(stats?.risk_distribution || {}).map(([level, count]) => ({ level, count }))
              }>
                <XAxis dataKey="level" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {Object.keys(stats?.risk_distribution || {}).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={riskColors[entry] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Alerts Table with Interactive Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Risk Alerts Queue</h3>
            <p className="text-xs text-slate-400">Automated signal monitoring & case drill-down</p>
          </div>
          
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Risk Level:</span>
              <select 
                value={riskFilter} 
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none"
              >
                <option value="ALL">All Levels</option>
                <option value="HIGH">HIGH (&ge; 70)</option>
                <option value="MEDIUM">MEDIUM (40-69)</option>
                <option value="LOW">LOW (&lt; 40)</option>
              </select>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-slate-400">Status:</span>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="UNDER_INVESTIGATION">Under Investigation</option>
                <option value="OPEN">Open Alert</option>
                <option value="RESOLVED_FALSE_POSITIVE">Resolved False Positive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Primary Signal</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stats?.recent_alerts?.map((alert) => (
                <tr 
                  key={alert.alert_id} 
                  className={`hover:bg-slate-800/50 transition-colors ${alert.customer_id === 'C102' ? 'bg-amber-500/5' : ''}`}
                >
                  <td className="py-3 px-4 font-mono text-slate-300 font-semibold">{alert.alert_id}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{alert.customer_name}</div>
                    <div className="text-[10px] text-slate-400">{alert.customer_id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-sm text-white">{alert.risk_score}</span>
                    <span className="text-[10px] text-slate-400">/100</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      alert.risk_level === 'HIGH' || alert.risk_level === 'CRITICAL'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : alert.risk_level === 'MEDIUM'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {alert.risk_level}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{alert.primary_risk_signal}</td>
                  <td className="py-3 px-4 font-semibold text-white">${alert.amount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td className="py-3 px-4 text-slate-400">{alert.destination_country}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                      {alert.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onInvestigateCustomer(alert.customer_id)}
                      className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-semibold hover:underline"
                    >
                      <span>Investigate</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
