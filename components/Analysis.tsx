import React, { useState } from 'react';
import { Sparkles, RefreshCw, FileText, BrainCircuit } from 'lucide-react';
import { generateBusinessInsights } from '../services/geminiService';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_SALES_DATA } from '../constants';

export const Analysis: React.FC = () => {
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    const result = await generateBusinessInsights(MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_SALES_DATA);
    setReport(result);
    setLoading(false);
    setGenerated(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Intelligence</h1>
        <p className="text-slate-500 text-sm mt-1">AI-powered insights based on your business data.</p>
      </div>

      <div className="bg-slate-900 rounded-xl p-8 text-white relative overflow-hidden shadow-lg">
        {/* Subtle decorative circle */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                    <BrainCircuit className="text-indigo-400" size={24} />
                    <h2 className="text-lg font-semibold">Generate New Analysis</h2>
                </div>
                <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                    Process inventory levels, sales trends, and transaction history to uncover actionable opportunities.
                </p>
            </div>

            <button
                onClick={handleGenerateReport}
                disabled={loading}
                className={`
                flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all
                ${loading 
                    ? 'bg-slate-800 cursor-not-allowed text-slate-400' 
                    : 'bg-white text-slate-900 hover:bg-gray-50'}
                `}
            >
                {loading ? (
                <>
                    <RefreshCw className="animate-spin" size={16} />
                    Processing...
                </>
                ) : (
                <>
                    <Sparkles size={16} />
                    Run Analysis
                </>
                )}
            </button>
        </div>
      </div>

      {generated && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 animate-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <FileText size={20} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Strategic Insights</h3>
          </div>
          <div className="prose prose-slate prose-sm max-w-none">
             <div className="whitespace-pre-wrap text-slate-600 leading-7">
               {report}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};