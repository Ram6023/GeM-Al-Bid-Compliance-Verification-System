import React from 'react';
import { X, FileText, CheckCircle2, AlertTriangle, XCircle, Search, ShieldCheck } from 'lucide-react';

export default function EvidenceViewer({ item, onClose }) {
  if (!item) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLIANT':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>COMPLIANT (PASS)</span>
          </span>
        );
      case 'NON_COMPLIANT':
        return (
          <span className="inline-flex items-center space-x-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold border border-red-300">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>NON-COMPLIANT (FAIL)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>NEEDS REVIEW (WARNING)</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              {item.clause_code}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{item.clause_title}</h3>
              <p className="text-xs text-slate-400">Category: {item.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Status & Vector Score Row */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs text-slate-500 font-medium block mb-1">Evaluation Decision</span>
              {getStatusBadge(item.status)}
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium block mb-1">Vector RAG Confidence</span>
              <span className="inline-flex items-center space-x-1 text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                <Search className="h-3.5 w-3.5" />
                <span>{Math.round(item.confidence_score * 100)}% Match</span>
              </span>
            </div>
          </div>

          {/* Tender Requirement */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              GeM Tender Requirement Specification
            </h4>
            <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-slate-800 leading-relaxed font-medium">
              {item.tender_requirement}
            </div>
          </div>

          {/* Bidder Evidence Snippet */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <FileText className="h-4 w-4 text-slate-600" />
                <span>Extracted Bidder Document Proof</span>
              </h4>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                Source: <span className="font-semibold text-slate-800">{item.source_doc_name}</span> (Page {item.page_number})
              </span>
            </div>
            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs leading-relaxed border border-slate-800 whitespace-pre-wrap">
              "{item.bidder_evidence || 'No text snippet retrieved.'}"
            </div>
          </div>

          {/* AI Rationale & Risk Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center space-x-1">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>AI Verification Rationale</span>
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.ai_rationale || 'N/A'}
              </p>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
              <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1 flex items-center space-x-1">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Risk Audit Flag</span>
              </h5>
              <p className="text-xs text-amber-900 leading-relaxed">
                {item.risk_notes || 'No risk flags detected.'}
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow transition"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
