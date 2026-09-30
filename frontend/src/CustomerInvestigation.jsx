import React, { useState, useEffect } from 'react';
import { 
  User, 
  CreditCard, 
  AlertTriangle, 
  ShieldAlert, 
  FileText, 
  Bot, 
  CheckCircle2, 
  Clock, 
  Globe, 
  Building, 
  ArrowRight,
  Download,
  Activity,
  Layers
} from 'lucide-react';

export default function CustomerInvestigation({ customerId = "C102", onAskCopilot, onGenerateReport }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTxTab, setActiveTxTab] = useState('ALL');

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Error loading customer investigation details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
        <span>Loading Customer 360 Investigation Data...</span>
      </div>
    );
  }

  const profile = data?.profile || {};
  const risk = data?.risk_summary || {};
  const timeline = data?.timeline || [];
  const txs = data?.transactions || [];

  const filteredTxs = activeTxTab === 'ANOMALIES' ? txs.filter(t => t.is_anomaly === 1 || t.status === 'FLAGGED') : txs;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-lg">
            {profile.first_name?.[0]}{profile.last_name?.[0]}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-white">{profile.first_name} {profile.last_name}</h1>
              <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                {profile.customer_id}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                risk.risk_level === 'HIGH' || risk.risk_level === 'CRITICAL'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {risk.risk_level} RISK ({risk.risk_score}/100)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {profile.occupation} &bull; {profile.country} &bull; Customer Since {profile.customer_since} &bull; KYC: <span className="text-emerald-400 font-semibold">{profile.kyc_status}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onAskCopilot(`Why was Customer ${customerId} flagged?`)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-lg shadow-blue-600/20"
          >
            <Bot className="w-4 h-4" />
            <span>Ask Copilot</span>
          </button>
          
          <button
            onClick={() => onGenerateReport(customerId)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Generate Report PDF</span>
          </button>
        </div>

      </div>

      {/* Grid Row 1: Profile Details & Risk Factors Decomposition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Account Information */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-blue-400" />
            <span>Account & KYC Profile</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Account ID:</span>
              <span className="font-mono text-white font-medium">{data?.accounts?.[0]?.account_id || 'ACC-C102-01'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Account Type:</span>
              <span className="text-white font-medium">{data?.accounts?.[0]?.account_type || 'CHECKING'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Current Balance:</span>
              <span className="text-white font-bold">${data?.accounts?.[0]?.balance?.toLocaleString() || '248,500.00'} USD</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Annual Income:</span>
              <span className="text-white font-medium">${profile.annual_income?.toLocaleString()} USD</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">PEP Indicator:</span>
              <span className={`font-bold ${profile.pep_flag ? 'text-rose-400' : 'text-slate-300'}`}>
                {profile.pep_flag ? 'YES (High Risk)' : 'NO'}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Active Case ID:</span>
              <span className="font-mono text-amber-400 font-semibold">{data?.investigation_case?.case_id || 'CASE-C102-2024'}</span>
            </div>
          </div>
        </div>

        {/* Card 2 & 3: Risk Factor Decomposition Matrix */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Explainable Risk Factor Breakdown (Score: {risk.risk_score}/100)</span>
            </h3>
            <span className="text-[10px] text-slate-400">Transparent Multi-Vector Scoring</span>
          </div>

          <div className="space-y-3">
            {risk.factors?.map((f) => (
              <div key={f.factor_type} className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{f.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      f.severity === 'CRITICAL' || f.severity === 'HIGH' 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {f.severity}
                    </span>
                  </div>
                  <span className="font-mono text-blue-400 font-bold">
                    +{f.contribution} <span className="text-slate-500 font-normal">/ {f.max_possible} pts</span>
                  </span>
                </div>
                {/* Progress Meter Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      f.severity === 'CRITICAL' ? 'bg-rose-500' : f.severity === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${(f.contribution / f.max_possible) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-400">{f.evidence}</p>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Visual Investigation Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Visual Investigation Timeline & Escalation Path</span>
          </h3>
          <span className="text-xs text-slate-400">Sequential Anomaly Progression</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {timeline.map((item, idx) => (
            <div 
              key={item.step} 
              className="bg-slate-950 border border-slate-800 rounded-lg p-3 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-bold text-blue-400">STEP 0{item.step}</span>
                  <span className="text-[10px] font-mono">{item.date}</span>
                </div>
                <h4 className="text-xs font-semibold text-white mb-1.5">{item.stage}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className={`font-bold ${
                  item.severity === 'CRITICAL' ? 'text-rose-400' : item.severity === 'HIGH' ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {item.severity}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History & Explorer Tab */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Customer Transaction History ({filteredTxs.length} records)</span>
          </h3>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setActiveTxTab('ALL')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTxTab === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              All Transactions ({txs.length})
            </button>
            <button
              onClick={() => setActiveTxTab('ANOMALIES')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTxTab === 'ANOMALIES' ? 'bg-rose-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Flagged Anomalies ({txs.filter(t => t.is_anomaly === 1).length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">TX ID</th>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Merchant / Entity</th>
                <th className="py-2.5 px-4">Origin &rarr; Destination</th>
                <th className="py-2.5 px-4">IP Address</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTxs.map((t) => (
                <tr key={t.transaction_id} className={`hover:bg-slate-800/50 ${t.is_anomaly ? 'bg-rose-500/5' : ''}`}>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-300">{t.transaction_id}</td>
                  <td className="py-3 px-4 text-slate-400">{t.timestamp}</td>
                  <td className={`py-3 px-4 font-bold ${t.is_anomaly ? 'text-rose-400 text-sm' : 'text-white'}`}>
                    ${t.amount?.toLocaleString(undefined, {minimumFractionDigits: 2})} USD
                  </td>
                  <td className="py-3 px-4 font-medium">{t.transaction_type}</td>
                  <td className="py-3 px-4 text-slate-300">{t.merchant_name}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {t.origin_country} &rarr; <span className="font-semibold text-white">{t.destination_country}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{t.ip_address}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      t.is_anomaly ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {t.status}
                    </span>
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
