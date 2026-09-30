import React, { useState } from 'react';
import Navbar from './Navbar';
import Dashboard from './Dashboard';
import RiskAlerts from './RiskAlerts';
import CustomerInvestigation from './CustomerInvestigation';
import TransactionExplorer from './TransactionExplorer';
import AiCopilot from './AiCopilot';
import RegulatoryIntelligence from './RegulatoryIntelligence';
import Reports from './Reports';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState('C102');
  const [copilotInitialQuery, setCopilotInitialQuery] = useState('');

  const handleInvestigateCustomer = (cid) => {
    setSelectedCustomerId(cid);
    setActiveTab('investigation');
  };

  const handleAskCopilot = (queryText) => {
    setCopilotInitialQuery(queryText);
    setActiveTab('copilot');
  };

  const handleGenerateReport = (cid) => {
    setSelectedCustomerId(cid);
    setActiveTab('reports');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard onInvestigateCustomer={handleInvestigateCustomer} />
        )}
        
        {activeTab === 'alerts' && (
          <RiskAlerts onInvestigateCustomer={handleInvestigateCustomer} />
        )}

        {activeTab === 'investigation' && (
          <CustomerInvestigation 
            customerId={selectedCustomerId} 
            onAskCopilot={handleAskCopilot}
            onGenerateReport={handleGenerateReport}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionExplorer />
        )}

        {activeTab === 'copilot' && (
          <AiCopilot 
            initialQuery={copilotInitialQuery}
            defaultCustomerId={selectedCustomerId}
            onGenerateReport={handleGenerateReport}
          />
        )}

        {activeTab === 'regulatory' && (
          <RegulatoryIntelligence />
        )}

        {activeTab === 'reports' && (
          <Reports defaultCustomerId={selectedCustomerId} />
        )}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        RISKWISE Enterprise Copilot &bull; Snowflake CoCo CLI Hackathon &bull; Team Electron
      </footer>
    </div>
  );
}
