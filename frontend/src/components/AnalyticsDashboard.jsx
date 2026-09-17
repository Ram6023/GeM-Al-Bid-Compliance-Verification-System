import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { ShieldCheck, AlertOctagon, TrendingUp, CheckCircle2, Award } from 'lucide-react';

export default function AnalyticsDashboard({ bidData, results }) {
  if (!bidData || !results) {
    return (
      <div className="p-8 text-center text-slate-500">
        No audit analytics available. Select an evaluated bid from Audit History.
      </div>
    );
  }

  // Distribution Pie Chart Data
  const pieData = [
    { name: 'Passed (Compliant)', value: bidData.passed_clauses, color: '#16A34A' },
    { name: 'Failed (Non-Compliant)', value: bidData.failed_clauses, color: '#DC2626' },
    { name: 'Needs Review', value: bidData.warning_clauses, color: '#D97706' },
  ].filter(d => d.value > 0);

  // Category Breakdown Data
  const categories = {};
  results.forEach(r => {
    if (!categories[r.category]) {
      categories[r.category] = { category: r.category, Passed: 0, Failed: 0, Warning: 0 };
    }
    if (r.status === 'COMPLIANT') categories[r.category].Passed += 1;
    else if (r.status === 'NON_COMPLIANT') categories[r.category].Failed += 1;
    else categories[r.category].Warning += 1;
  });

  const barData = Object.values(categories);

  return (
    <div className="space-y-6">
      
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Compliance Gauge Box */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md border border-slate-700 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Overall Compliance Rating
            </span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-4xl font-extrabold text-blue-400">{bidData.compliance_score}%</span>
              <span className="text-xs text-slate-300">verified score</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
            <span>Tender: {bidData.bid_number}</span>
            <span className="font-semibold text-emerald-400">AI Verification v1.0</span>
          </div>
        </div>

        {/* Risk Assessment Box */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Bid Audit Risk Level
            </span>
            <div className="mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-base font-extrabold border ${
                bidData.risk_level === 'LOW' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                bidData.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-red-100 text-red-800 border-red-300'
              }`}>
                {bidData.risk_level} RISK
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {bidData.risk_level === 'LOW' ? 'Bidder meets major commercial, technical & regulatory criteria with low risk.' :
             bidData.risk_level === 'MEDIUM' ? 'Minor non-compliances or ambiguous declarations require committee review.' :
             'Critical mandatory eligibility criteria failed. High probability of bid rejection.'}
          </p>
        </div>

        {/* Executive Action Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Evaluation Recommendation
            </span>
            <h4 className="text-base font-bold text-slate-800 mt-1">
              {bidData.compliance_score >= 80 ? 'Recommend for Technical Qualification' : 'Flagged for Rejection / Clarification'}
            </h4>
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            Passed {bidData.passed_clauses} of {bidData.total_clauses} mandatory tender clauses.
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pie Chart: Status Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <span>Compliance Status Breakdown</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <span>Compliance by Category</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Passed" fill="#16A34A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Failed" fill="#DC2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Warning" fill="#D97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
