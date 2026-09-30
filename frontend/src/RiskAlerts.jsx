import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldAlert, ArrowUpRight, CheckCircle, AlertTriangle } from 'lucide-react';

export default function RiskAlerts({ onInvestigateCustomer }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchAlerts();
  }, [search, levelFilter, statusFilter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (levelFilter !== 'ALL') query.append('risk_level', levelFilter);
      if (statusFilter !== 'ALL') query.append('status', statusFilter);

      const res = await fetch(`/api/alerts?${query.toString()}`);
      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      console.error("Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Risk Alerts & Signal Queue</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time alert prioritization matrix & compliance dispatch</p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          Total Alerts: <span className="text-white font-semibold">{alerts.length}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Alert ID, Customer ID, or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Level Tabs */}
        <div className="flex items-center space-x-2 text-xs">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                levelFilter === lvl
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="OPEN">Open Alert</option>
            <option value="RESOLVED_FALSE_POSITIVE">Resolved False Positive</option>
          </select>
        </div>

      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Primary Risk Signal</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {alerts.map((alt) => (
                <tr key={alt.alert_id} className={`hover:bg-slate-800/50 transition-colors ${alt.customer_id === 'C102' ? 'bg-amber-500/5' : ''}`}>
                  <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">{alt.alert_id}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{alt.customer_id}</td>
                  <td className="py-3.5 px-4 text-slate-200">{alt.customer_name}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-sm text-white">{alt.risk_score}</span>
                    <span className="text-[10px] text-slate-400">/100</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      alt.risk_level === 'HIGH' || alt.risk_level === 'CRITICAL'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : alt.risk_level === 'MEDIUM'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {alt.risk_level}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-xs">{alt.primary_risk_signal}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">${alt.amount?.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td className="py-3.5 px-4 text-slate-400">{alt.destination_country}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] bg-slate-950 px-2 py-1 rounded text-slate-300 border border-slate-800">
                      {alt.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onInvestigateCustomer(alt.customer_id)}
                      className="bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 px-3 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1 ml-auto"
                    >
                      <span>Investigate</span>
                      <ArrowUpRight className="w-3 h-3" />
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
