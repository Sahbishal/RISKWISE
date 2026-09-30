import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldAlert, ArrowDownUp, Globe, CreditCard } from 'lucide-react';

export default function TransactionExplorer() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [anomalyFilter, setAnomalyFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    fetchTransactions();
  }, [anomalyFilter, typeFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (anomalyFilter === 'ANOMALY') query.append('is_anomaly', '1');
      if (typeFilter !== 'ALL') query.append('tx_type', typeFilter);

      const res = await fetch(`/api/transactions?${query.toString()}`);
      const data = await res.json();
      setTxs(data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = txs.filter(t => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      t.transaction_id.toLowerCase().includes(term) ||
      t.customer_id.toLowerCase().includes(term) ||
      t.merchant_name.toLowerCase().includes(term) ||
      t.destination_country.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Transaction Explorer</h1>
          <p className="text-xs text-slate-400 mt-1">Full audit stream & anomaly detection transaction grid</p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          Displaying <span className="text-white font-semibold">{filtered.length}</span> records
        </div>
      </div>

      {/* Search & Filter controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search TX ID, Customer ID, Merchant, or Country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs">
          
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={anomalyFilter}
              onChange={(e) => setAnomalyFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value="ALL">All Transactions</option>
              <option value="ANOMALY">Flagged Anomalies Only</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="WIRE_TRANSFER">Wire Transfer</option>
              <option value="ATM_WITHDRAWAL">ATM Withdrawal</option>
              <option value="ONLINE_PAYMENT">Online Payment</option>
              <option value="POS">POS Retail</option>
              <option value="CRYPTO_PURCHASE">Crypto Purchase</option>
            </select>
          </div>

        </div>

      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Amount (USD)</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Merchant</th>
                <th className="py-3 px-4">Origin &rarr; Destination</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((t) => (
                <tr key={t.transaction_id} className={`hover:bg-slate-800/50 ${t.is_anomaly ? 'bg-rose-500/5' : ''}`}>
                  <td className="py-3 px-4 font-mono font-semibold text-blue-400">{t.transaction_id}</td>
                  <td className="py-3 px-4 font-semibold text-white">{t.customer_id}</td>
                  <td className="py-3 px-4 text-slate-400">{t.timestamp}</td>
                  <td className={`py-3 px-4 font-bold ${t.is_anomaly ? 'text-rose-400 text-sm' : 'text-white'}`}>
                    ${t.amount?.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-300">{t.transaction_type}</td>
                  <td className="py-3 px-4 text-slate-300">{t.merchant_name}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {t.origin_country} &rarr; <span className="font-semibold text-white">{t.destination_country}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      t.is_anomaly ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-slate-950 text-slate-400 border-slate-800'
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
