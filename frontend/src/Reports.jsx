import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle2, Clock, ShieldAlert, Sparkles } from 'lucide-react';

export default function Reports({ defaultCustomerId = "C102" }) {
  const [reports, setReports] = useState([]);
  const [customerId, setCustomerId] = useState(defaultCustomerId);
  const [analystName, setAnalystName] = useState("Sarah Jenkins (Senior AML Specialist)");
  const [loading, setLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  const handleGenerate = async () => {
    if (!customerId.trim()) return;
    setLoading(true);
    setGeneratedReport(null);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, analyst_name: analystName })
      });
      const data = await res.json();
      setGeneratedReport(data);
      fetchReports();
    } catch (err) {
      console.error("Error generating report:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Audit-Ready Report Generation</h1>
          <p className="text-xs text-slate-400 mt-1">Generate compliant PDF investigation dossiers with statutory evidence citations</p>
        </div>
      </div>

      {/* Generator Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Generate Suspicious Activity Investigation Dossier</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Customer ID:</label>
            <input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="e.g. C102"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Assigned Analyst Name:</label>
            <input
              type="text"
              value={analystName}
              onChange={(e) => setAnalystName(e.target.value)}
              placeholder="Analyst Name..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? (
                <span>Generating PDF Dossier...</span>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Generate PDF Report</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Generated Report Success Alert Banner */}
        {generatedReport && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block">Audit Report Generated Successfully!</span>
                <span className="text-slate-300">
                  Report ID: <span className="font-mono text-emerald-400">{generatedReport.report_id}</span> &bull; Case: {generatedReport.case_id} &bull; Risk Score: {generatedReport.risk_score}/100 ({generatedReport.risk_level})
                </span>
              </div>
            </div>

            <a
              href={`/api/reports/download/${generatedReport.pdf_filename}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg text-xs inline-flex items-center space-x-1.5 transition-all self-start md:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF File</span>
            </a>
          </div>
        )}

      </div>

      {/* Reports History Archive Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center space-x-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Investigation Reports Archive</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Analyst</th>
                <th className="py-3 px-4">Generated Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reports.map((r) => {
                let dataObj = {};
                try { dataObj = JSON.parse(r.report_data); } catch(e) {}
                return (
                  <tr key={r.report_id} className="hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-400">{r.report_id}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{r.case_id}</td>
                    <td className="py-3 px-4 font-semibold text-white">{r.customer_id}</td>
                    <td className="py-3 px-4 text-slate-300">{r.generated_by}</td>
                    <td className="py-3 px-4 text-slate-400">{r.created_at}</td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={`/api/reports/download/${r.report_id}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-semibold hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
