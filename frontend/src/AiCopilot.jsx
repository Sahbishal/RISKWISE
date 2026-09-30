import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  ShieldAlert, 
  FileText, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

export default function AiCopilot({ initialQuery = "", defaultCustomerId = "C102", onGenerateReport }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am your **RISKWISE AI Copilot**. I analyze customer 360 profiles, transactional anomalies, explainable risk factors, and grounded regulatory documents.\n\nHow can I assist your investigation today?",
      data_context: null,
      regulatory_evidence: null
    }
  ]);
  const [query, setQuery] = useState(initialQuery);
  const [selectedCustomer, setSelectedCustomer] = useState(defaultCustomerId);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = [
    "Why was Customer C102 flagged?",
    "Show me the suspicious transactions for C102.",
    "What regulatory requirements are relevant to this case?",
    "Summarize this customer's recent activity.",
    "Are there similar suspicious transactions?",
    "Generate an investigation summary for Customer C102."
  ];

  const handleSend = async (userText) => {
    const textToSend = userText || query;
    if (!textToSend.trim() || loading) return;

    // Append User Message
    const newMsg = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, newMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend, customer_id: selectedCustomer })
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: data.answer,
          data_context: data.data_context,
          regulatory_evidence: data.regulatory_evidence
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: "I encountered an error connecting to the Copilot Engine. Please check your backend connection.",
          data_context: null,
          regulatory_evidence: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Risk & Regulatory Copilot</h1>
            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
              CORTEX AI GROUNDED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Natural-language querying across database telemetry & regulatory knowledge base</p>
        </div>

        {/* Customer Context Selector */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
          <span className="text-slate-400">Target Customer:</span>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="bg-transparent text-blue-400 font-bold focus:outline-none"
          >
            <option value="C102">C102 (Alexander Vance - HIGH RISK)</option>
            <option value="C1001">C1001 (James Smith)</option>
            <option value="C1005">C1005 (Robert Miller)</option>
          </select>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-[650px] overflow-hidden">
        
        {/* Quick Suggestion Pills Bar */}
        <div className="bg-slate-950 border-b border-slate-800 p-3 flex items-center space-x-2 overflow-x-auto text-xs">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-slate-400 font-semibold flex-shrink-0">Suggested Queries:</span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 px-3 py-1 rounded-full whitespace-nowrap transition-all flex-shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages Stream Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0 mt-1">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div className={`max-w-2xl rounded-xl p-4 space-y-3 ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white font-medium text-xs'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 text-xs'
              }`}>
                
                {/* Formatted Text Content */}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>

                {/* Grounded Regulatory Citation Evidence Card */}
                {msg.regulatory_evidence && msg.regulatory_evidence.found && (
                  <div className="mt-3 bg-blue-950/40 border border-blue-800/60 rounded-lg p-3 space-y-1.5 text-[11px]">
                    <div className="flex items-center space-x-1.5 text-blue-300 font-semibold">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      <span>Grounded Regulatory Evidence & Citation</span>
                    </div>
                    <div className="text-slate-300 font-medium">
                      Source: <span className="text-white">{msg.regulatory_evidence.source_document}</span>
                    </div>
                    <div className="text-slate-400">
                      Section: <span className="text-slate-200">{msg.regulatory_evidence.relevant_section}</span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded border border-slate-800 text-slate-300 italic font-mono text-[10px]">
                      "{msg.regulatory_evidence.evidence_citation}"
                    </div>
                  </div>
                )}

                {/* Audit Action CTA Button */}
                {msg.sender === 'bot' && msg.data_context?.customer_id && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center space-x-2">
                    <button
                      onClick={() => onGenerateReport(msg.data_context.customer_id)}
                      className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 px-3 py-1 rounded text-[11px] font-semibold transition-all flex items-center space-x-1"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Generate Investigation Report PDF for {msg.data_context.customer_id}</span>
                    </button>
                  </div>
                )}

              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-3 text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <span>Copilot processing natural language query against database telemetry & Cortex RAG...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="bg-slate-950 p-3 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Ask a question (e.g. 'Why was Customer C102 flagged?', 'What regulatory requirements apply?')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
}
