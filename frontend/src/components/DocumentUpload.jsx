import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export default function DocumentUpload({ onAuditComplete }) {
  const [bidNumber, setBidNumber] = useState(`GEM/2026/B/${Math.floor(100000 + Math.random() * 900000)}`);
  const [tenderTitle, setTenderTitle] = useState('');
  const [bidderName, setBidderName] = useState('');
  
  const [tenderFile, setTenderFile] = useState(null);
  const [bidderFiles, setBidderFiles] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('UPLOAD'); // UPLOAD, ANALYZING, COMPLETED
  const [error, setError] = useState(null);
  const [progressMsg, setProgressMsg] = useState('');

  const handleTenderChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setTenderFile(e.target.files[0]);
    }
  };

  const handleBidderFilesChange = (e) => {
    if (e.target.files) {
      setBidderFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenderTitle.trim() || !bidderName.trim() || !tenderFile || bidderFiles.length === 0) {
      setError('Please fill all required fields, attach the Tender RFP document, and at least one Bidder PDF file.');
      return;
    }

    setError(null);
    setLoading(true);
    setStep('ANALYZING');
    setProgressMsg('Uploading documents to secure AI vault...');

    try {
      const formData = new FormData();
      formData.append('bid_number', bidNumber);
      formData.append('tender_title', tenderTitle);
      formData.append('bidder_name', bidderName);
      formData.append('tender_file', tenderFile);
      
      bidderFiles.forEach((file) => {
        formData.append('bidder_files', file);
      });

      // Step 1: Upload
      const uploadRes = await axios.post('/api/bids/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const bidId = uploadRes.data.bid_id;

      // Step 2: Trigger AI & OCR Analysis Pipeline
      setProgressMsg('Extracting PDF text & running OCR on scanned pages...');
      await new Promise(r => setTimeout(r, 800));

      setProgressMsg('Chunking text & indexing into Vector DB for semantic RAG search...');
      await new Promise(r => setTimeout(r, 800));

      setProgressMsg('Evaluating eligibility clauses against Bidder Evidence Snippets...');
      const analyzeRes = await axios.post(`/api/bids/${bidId}/analyze`);

      setProgressMsg('Compliance matrix & risk score calculation completed!');
      setStep('COMPLETED');
      setLoading(false);

      if (onAuditComplete) {
        onAuditComplete(bidId);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred during verification. Please ensure PDF files are valid.');
      setLoading(false);
      setStep('UPLOAD');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <UploadCloud className="h-6 w-6 text-blue-400" />
            <span>Initiate New Bid Compliance Verification</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Upload GeM Tender RFP specification document and Bidder Submission Package for automated AI audit.
          </p>
        </div>

        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-700 text-sm">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-blue-800">
                AI
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800">{progressMsg}</h3>
            <p className="text-sm text-slate-500 max-w-md">
              Executing OCR text extraction, Vector embeddings similarity search, Make-in-India rules engine, and AI clause verification...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Metadata Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  GeM Bid Number *
                </label>
                <input
                  type="text"
                  value={bidNumber}
                  onChange={(e) => setBidNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tender Title / Procurement Subject *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Procurement of Servers & Networking Gear"
                  value={tenderTitle}
                  onChange={(e) => setTenderTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Bidder Organization Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. TechCorp Solutions Pvt Ltd"
                  value={bidderName}
                  onChange={(e) => setBidderName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Document Upload Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Tender File */}
              <div className="border-2 border-dashed border-blue-200 bg-blue-50/40 rounded-xl p-5 text-center hover:border-blue-400 transition">
                <div className="h-10 w-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <File className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-sm text-slate-800 mb-1">1. GeM Tender / RFP Document (PDF)</h4>
                <p className="text-xs text-slate-500 mb-4">Contains tender eligibility terms, turnover criteria, MII %, and specs.</p>
                
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleTenderChange}
                  className="hidden"
                  id="tender-upload"
                />
                <label
                  htmlFor="tender-upload"
                  className="cursor-pointer bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm inline-block"
                >
                  {tenderFile ? 'Change Tender PDF' : 'Select Tender PDF'}
                </label>

                {tenderFile && (
                  <div className="mt-3 flex items-center justify-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-md font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{tenderFile.name}</span>
                  </div>
                )}
              </div>

              {/* Bidder Package Files */}
              <div className="border-2 border-dashed border-slate-300 bg-slate-50/60 rounded-xl p-5 text-center hover:border-slate-400 transition">
                <div className="h-10 w-10 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <h4 className="font-semibold text-sm text-slate-800 mb-1">2. Bidder Submission Package (PDFs)</h4>
                <p className="text-xs text-slate-500 mb-4">CA turnover cert, MII declaration, past orders, ISO certs, OEM MAI.</p>
                
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  multiple
                  onChange={handleBidderFilesChange}
                  className="hidden"
                  id="bidder-upload"
                />
                <label
                  htmlFor="bidder-upload"
                  className="cursor-pointer bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm inline-block"
                >
                  {bidderFiles.length > 0 ? 'Add / Replace Bidder Files' : 'Select Bidder PDF Package'}
                </label>

                {bidderFiles.length > 0 && (
                  <div className="mt-3 space-y-1 max-h-24 overflow-y-auto text-left">
                    {bidderFiles.map((f, i) => (
                      <div key={i} className="flex items-center space-x-1.5 text-xs text-slate-700 bg-white border border-slate-200 py-1 px-2.5 rounded">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md transition"
              >
                <span>Run AI Verification Protocol</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
