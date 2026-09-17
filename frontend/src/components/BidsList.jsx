import React from 'react';
import { FileText, Download, CheckCircle2, ArrowRight, Calendar, Building2 } from 'lucide-react';

export default function BidsList({ bids, onSelectBid }) {
  if (!bids || bids.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Audit History Found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Start by launching a new bid compliance audit or loading the pre-loaded sample GeM tender demo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Bid Compliance Audit History</h2>
        <span className="text-xs text-slate-500">{bids.length} total evaluations stored</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                <th className="p-3.5">Bid Number</th>
                <th className="p-3.5">Tender Title & Bidder</th>
                <th className="p-3.5">Score</th>
                <th className="p-3.5">Risk Level</th>
                <th className="p-3.5">Passed / Total</th>
                <th className="p-3.5">Audit Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {bids.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition">
                  
                  <td className="p-3.5 font-bold text-blue-700 whitespace-nowrap">
                    {b.bid_number}
                  </td>

                  <td className="p-3.5 max-w-md">
                    <div className="font-bold text-slate-800 line-clamp-1">{b.tender_title}</div>
                    <div className="text-slate-500 flex items-center space-x-1 mt-0.5">
                      <Building2 className="h-3 w-3" />
                      <span>{b.bidder_name}</span>
                    </div>
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    <span className="text-sm font-extrabold text-slate-900">{b.compliance_score}%</span>
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                      b.risk_level === 'LOW' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      b.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      {b.risk_level}
                    </span>
                  </td>

                  <td className="p-3.5 whitespace-nowrap font-medium text-slate-700">
                    {b.passed_clauses} / {b.total_clauses} clauses
                  </td>

                  <td className="p-3.5 whitespace-nowrap text-slate-400">
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>

                  <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                    <button
                      onClick={() => onSelectBid(b.id)}
                      className="inline-flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-semibold text-xs transition"
                    >
                      <span>View Matrix</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <a
                      href={`/api/bids/${b.id}/export-pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-md font-semibold text-xs border border-slate-300 transition"
                      title="Download PDF Audit Report"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
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
