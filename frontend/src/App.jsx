import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from './components/Navigation';
import DocumentUpload from './components/DocumentUpload';
import ComplianceMatrix from './components/ComplianceMatrix';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import BidsList from './components/BidsList';
import { RefreshCw, FileCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, upload, bids
  const [bids, setBids] = useState([]);
  const [selectedBidId, setSelectedBidId] = useState(null);
  
  const [currentBidData, setCurrentBidData] = useState(null);
  const [currentResults, setCurrentResults] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);

  // Fetch list of bids
  const fetchBids = async () => {
    try {
      const res = await axios.get('/api/bids');
      setBids(res.data);
      if (res.data.length > 0 && !selectedBidId) {
        setSelectedBidId(res.data[0].id);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching bids:", err);
      setLoading(false);
    }
  };

  // Fetch details for selected bid
  const fetchBidDetails = async (bidId) => {
    if (!bidId) return;
    try {
      const res = await axios.get(`/api/bids/${bidId}`);
      setCurrentBidData(res.data.bid);
      setCurrentResults(res.data.results);
    } catch (err) {
      console.error("Error fetching bid details:", err);
    }
  };

  useEffect(() => {
    fetchBids();
  }, []);

  useEffect(() => {
    if (selectedBidId) {
      fetchBidDetails(selectedBidId);
    }
  }, [selectedBidId]);

  const handleCreateDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await axios.post('/api/bids/create-demo');
      const newBidId = res.data.bid_id;
      await fetchBids();
      setSelectedBidId(newBidId);
      setActiveTab('dashboard');
      setLoadingDemo(false);
    } catch (err) {
      console.error("Failed to create demo:", err);
      setLoadingDemo(false);
    }
  };

  const handleAuditComplete = async (bidId) => {
    await fetchBids();
    setSelectedBidId(bidId);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCreateDemo={handleCreateDemo}
        loadingDemo={loadingDemo}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span>Initializing GeM AI Verification Engine...</span>
          </div>
        ) : (
          <>
            {/* Tab: Dashboard / Matrix View */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {currentBidData ? (
                  <>
                    <AnalyticsDashboard
                      bidData={currentBidData}
                      results={currentResults}
                    />
                    
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                          <FileCheck className="h-5 w-5 text-blue-600" />
                          <span>Clause-by-Clause Compliance Verification Matrix</span>
                        </h3>
                      </div>
                      
                      <ComplianceMatrix
                        bidData={currentBidData}
                        results={currentResults}
                        onRefresh={() => fetchBidDetails(selectedBidId)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">No Active Bid Selected</h3>
                    <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                      Click below to generate a pre-loaded GeM Tender sample bid or upload your own tender documents.
                    </p>
                    <button
                      onClick={handleCreateDemo}
                      disabled={loadingDemo}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow transition"
                    >
                      {loadingDemo ? 'Generating...' : 'Load Sample GeM Tender Demo'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab: New Upload */}
            {activeTab === 'upload' && (
              <DocumentUpload onAuditComplete={handleAuditComplete} />
            )}

            {/* Tab: History List */}
            {activeTab === 'bids' && (
              <BidsList
                bids={bids}
                onSelectBid={(bidId) => {
                  setSelectedBidId(bidId);
                  setActiveTab('dashboard');
                }}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        GeM AI Bid Compliance Verification System &copy; 2026. Powered by AI/NLP Vector RAG Engine & PostgreSQL.
      </footer>
    </div>
  );
}
