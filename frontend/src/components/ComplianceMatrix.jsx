import React, { useState } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, XCircle, AlertTriangle, Search, Filter, Eye, Download, 
  Edit3, ShieldAlert, FileSpreadsheet, RefreshCw
} from 'lucide-react';
import EvidenceViewer from './EvidenceViewer';

export default function ComplianceMatrix({ bidData, results, onRefresh }) {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  
  // Override Modal state
  const [overrideItem, setOverrideItem] = useState(null);
  const [newStatus, setNewStatus] = useState('COMPLIANT');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [submittingOverride, setSubmittingOverride] = useState(false);

  if (!bidData) {
    return (
      <div className="text-center py-12 text-slate-500">
        No bid data loaded. Please select or run a new audit.
      </div>
    );
  }

  const filteredResults = results.filter((item) => {
    const matchesFilter = 
      filter === 'ALL' ? true :
      filter === 'PASS' ? item.status === 'COMPLIANT' :
      filter === 'FAIL' ? item.status === 'NON_COMPLIANT' :
      filter === 'WARNING' ? item.status === 'NEEDS_REVIEW' : true;

    const matchesSearch = 
      item.clause_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clause_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleExportPDF = () => {
    const baseUrl = axios.defaults.baseURL || '';
    window.open(`${baseUrl}/api/bids/${bidData.id}/export-pdf`, '_blank');
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideItem) return;

    setSubmittingOverride(true);
    try {
      await axios.post('/api/bids/override', {
        result_id: overrideItem.id,
        new_status: newStatus,
        override_notes: overrideNotes
      });
      setSubmittingOverride(false);
      setOverrideItem(null);
      setOverrideNotes('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to override status');
      setSubmittingOverride(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Bid Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded">
                {bidData.bid_number}
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded ${
                bidData.risk_level === 'LOW' ? 'bg-emerald-100 text-emerald-800' :
                bidData.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
              }`}>
                {bidData.risk_level} RISK
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{bidData.tender_title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Bidder: <span className="font-semibold text-slate-700">{bidData.bidder_name}</span></p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={handleExportPDF}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow transition"
            >
              <Download className="h-4 w-4" />
              <span>Export PDF Audit Report</span>
            </button>
          </div>
        </div>

        {/* Executive Summary Statement */}
        {bidData.executive_summary && (
          <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed font-medium">
            <span className="font-bold text-slate-900">AI Executive Summary: </span>
            {bidData.executive_summary}
          </div>
        )}
      </div>

      {/* Stats KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold uppercase">Compliance Score</span>
          <div className="text-2xl font-extrabold text-blue-700 mt-1">
            {bidData.compliance_score}%
          </div>
          <span className="text-[10px] text-slate-400">Total Criteria: {bidData.total_clauses}</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold uppercase">Passed Criteria</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1 flex items-center space-x-1">
            <span>{bidData.passed_clauses}</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <span className="text-[10px] text-emerald-700">Verified Compliant</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold uppercase">Failed Criteria</span>
          <div className="text-2xl font-extrabold text-red-600 mt-1 flex items-center space-x-1">
            <span>{bidData.failed_clauses}</span>
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <span className="text-[10px] text-red-700">Discrepancy / Missing</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <span className="text-xs text-slate-500 font-semibold uppercase">Needs Review</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1 flex items-center space-x-1">
            <span>{bidData.warning_clauses}</span>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <span className="text-[10px] text-amber-700">Requires Committee Check</span>
        </div>

      </div>

      {/* Matrix Controls & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search clause or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({results.length})
          </button>
          
          <button
            onClick={() => setFilter('PASS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'PASS' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Pass ({bidData.passed_clauses})
          </button>

          <button
            onClick={() => setFilter('FAIL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'FAIL' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Fail ({bidData.failed_clauses})
          </button>

          <button
            onClick={() => setFilter('WARNING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === 'WARNING' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Warning ({bidData.warning_clauses})
          </button>
        </div>

      </div>

      {/* Compliance Matrix Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                <th className="p-3.5">Clause ID</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Requirement & AI Evaluation</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Evidence & Citation</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredResults.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition">
                  
                  <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                    {row.clause_code}
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
                      {row.category}
                    </span>
                  </td>

                  <td className="p-3.5 max-w-sm">
                    <div className="font-bold text-slate-800">{row.clause_title}</div>
                    <div className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">{row.tender_requirement}</div>
                    <div className="text-blue-700 text-[11px] mt-1 font-medium bg-blue-50/70 p-1.5 rounded border border-blue-100">
                      <span className="font-bold">AI Rationale: </span>{row.ai_rationale}
                    </div>
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    {row.status === 'COMPLIANT' && (
                      <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[11px]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>PASS</span>
                      </span>
                    )}
                    {row.status === 'NON_COMPLIANT' && (
                      <span className="inline-flex items-center space-x-1 bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-full text-[11px]">
                        <XCircle className="h-3.5 w-3.5 text-red-600" />
                        <span>FAIL</span>
                      </span>
                    )}
                    {row.status === 'NEEDS_REVIEW' && (
                      <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-[11px]">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        <span>WARNING</span>
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 max-w-xs">
                    <div className="text-slate-700 font-semibold truncate">{row.source_doc_name || 'Document'}</div>
                    <div className="text-slate-400 text-[11px]">Page {row.page_number}</div>
                  </td>

                  <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                    <button
                      onClick={() => setSelectedEvidence(row)}
                      className="inline-flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded-md font-semibold text-[11px] border border-blue-200 transition"
                      title="View extracted evidence quote"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Proof</span>
                    </button>

                    <button
                      onClick={() => {
                        setOverrideItem(row);
                        setNewStatus(row.status);
                      }}
                      className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1.5 rounded-md font-semibold text-[11px] border border-slate-300 transition"
                      title="Manual Committee Status Override"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Modal */}
      {selectedEvidence && (
        <EvidenceViewer
          item={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}

      {/* Override Modal */}
      {overrideItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Manual Committee Status Override
            </h3>
            <p className="text-xs text-slate-500">
              Clause: <span className="font-bold text-slate-800">{overrideItem.clause_code} - {overrideItem.clause_title}</span>
            </p>

            <form onSubmit={handleOverrideSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Compliance Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="COMPLIANT">COMPLIANT (PASS)</option>
                  <option value="NON_COMPLIANT">NON-COMPLIANT (FAIL)</option>
                  <option value="NEEDS_REVIEW">NEEDS REVIEW (WARNING)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Committee Justification Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="Explain why committee approved or rejected this clause..."
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideItem(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOverride}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                >
                  {submittingOverride ? 'Saving...' : 'Confirm Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
