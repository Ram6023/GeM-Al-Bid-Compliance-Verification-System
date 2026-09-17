import React from 'react';
import { ShieldCheck, UploadCloud, FileText, BarChart3, Sparkles, Settings } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, onCreateDemo, loadingDemo }) {
  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-wide text-white">GeM AI Audit</span>
                <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-2 py-0.5 rounded border border-blue-400/30">
                  Compliance v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">Government e-Marketplace Bid Verification System</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              <span>New Audit</span>
            </button>

            <button
              onClick={() => setActiveTab('bids')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'bids'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Audit History</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onCreateDemo}
              disabled={loadingDemo}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-50"
              title="Generate a pre-loaded sample GeM Tender bid for instant evaluation"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{loadingDemo ? 'Generating...' : 'Load Sample Demo'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
