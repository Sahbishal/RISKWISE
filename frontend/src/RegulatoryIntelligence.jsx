import React, { useState, useEffect } from 'react';
import { BookOpen, Search, ShieldCheck, FileText, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export default function RegulatoryIntelligence() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    fetchDocs();
    // Default search on load
    handleSearch("What are the relevant AML requirements for transaction monitoring and SAR filings?");
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/regulatory/documents');
      const data = await res.json();
      setDocs(data);
    } catch (err) {
      console.error("Error fetching docs:", err);
    }
  };

  const handleSearch = async (textToSearch) => {
    const q = textToSearch || query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/regulatory/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error searching regulatory docs:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Regulatory Intelligence & Compliance RAG</h1>
          <p className="text-xs text-slate-400 mt-1">Grounding risk investigations in governing statutes & regulatory guidance</p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          Knowledge Base Documents: <span className="text-white font-semibold">{docs.length} active standards</span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <label className="text-xs font-semibold text-slate-300">Ask a Compliance & Regulatory Question:</label>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="e.g., 'What are the AML requirements for rapid movement of funds?', 'SAR filing 30-day timeline'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-blue-600/20"
          >
            <span>Search RAG</span>
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* RAG Answer & Evidence Card */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[250px] text-slate-400 text-xs">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
          <span>Retrieving grounded regulatory evidence and citations...</span>
        </div>
      ) : result ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Answer View */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Synthesized Regulatory Answer</h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                result.found ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                {result.found ? 'VERIFIED EVIDENCE' : 'NO EVIDENCE FOUND'}
              </span>
            </div>

            <div className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800/80">
              {result.answer}
            </div>

            {/* Evidence Citation Details */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Source Citation Breakdown:</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">SOURCE DOCUMENT</span>
                  <span className="font-semibold text-white mt-1 block">{result.source_document}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">RELEVANT SECTION</span>
                  <span className="font-semibold text-blue-400 mt-1 block">{result.relevant_section}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs space-y-1.5">
                <span className="text-slate-400 block text-[10px] font-semibold">EXACT STATUTORY EVIDENCE / QUOTE</span>
                <p className="font-mono text-slate-300 text-[11px] leading-relaxed italic bg-slate-900/60 p-2.5 rounded border border-slate-800">
                  "{result.evidence_citation}"
                </p>
              </div>
            </div>
          </div>

          {/* Side Column: Knowledge Base Documents Browser */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Ingested Regulatory Corpus</span>
            </h3>

            <div className="space-y-3">
              {docs.map((d) => (
                <div key={d.doc_id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white truncate max-w-[180px]">{d.title}</span>
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-bold">{d.category}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{d.issuing_authority} &bull; Effective {d.effective_date}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : null}

    </div>
  );
}
