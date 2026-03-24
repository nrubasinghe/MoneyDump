import React, { useState, useEffect } from 'react';
import { Bot, TrendingUp, AlertCircle, CheckCircle, ArrowRight, FileText, ChevronRight, Sparkles, Trash2 } from 'lucide-react';
import { budgetService, transactionService, aiService } from '../services/api';

const BudgetAnalysis = () => {
    const [analysisType, setAnalysisType] = useState('monthly');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedWeek, setSelectedWeek] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [report, setReport] = useState(null);
    const [history, setHistory] = useState([]);
    const [data, setData] = useState({ budgets: [], transactions: [] });

    const fetchData = async () => {
        try {
            const [budgets, transactionsResponse, reports] = await Promise.all([
                budgetService.getBudgets(),
                transactionService.getTransactions({ limit: 1000 }),
                aiService.getReports()
            ]);
            setData({ budgets, transactions: transactionsResponse.items || [] });
            setHistory(reports);
            if (reports.length > 0 && !report) {
                setReport(reports[0]);
            }
        } catch (err) {
            console.error("Error fetching analysis data:", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            // Fetch transactions for the selected period directly from API
            const response = await transactionService.getTransactions({
                limit: 1000,
                year: selectedYear,
                month: analysisType === 'monthly' ? selectedMonth : undefined
                // If it's weekly, we still fetch the whole year/month and filter in JS for now 
                // because week number isn't a direct DB field. But monthly is much better now.
            });

            let filteredTransactions = response.items || [];
            if (analysisType === 'weekly') {
                filteredTransactions = filteredTransactions.filter(t => {
                    const tDate = new Date(t.date);
                    const dayOfYear = Math.floor((tDate - new Date(tDate.getFullYear(), 0, 0)) / 86400000);
                    const weekNum = Math.ceil(dayOfYear / 7);
                    return weekNum === selectedWeek && tDate.getFullYear() === selectedYear;
                });
            } else {
                // For monthly, we already fetched the correct month from the API, but double check
                filteredTransactions = filteredTransactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate.getMonth() + 1 === selectedMonth && tDate.getFullYear() === selectedYear;
                });
            }

            // Get text representation of period for prompt context
            const periodString = analysisType === 'monthly'
                ? `Month: ${selectedMonth}/${selectedYear}`
                : `Week ${selectedWeek}, Year ${selectedYear}`;

            const result = await aiService.analyze({
                budgets: data.budgets,
                transactions: filteredTransactions,
                analysisType: analysisType,
                period: periodString
            });

            setReport(result);
            setHistory(prev => [result, ...prev]);
        } catch (err) {
            console.error("Error generating analysis:", err);
            alert("Failed to connect to the RAG analysis engine. Please ensure the backend is running.");
        } finally {
            setIsGenerating(false);
        }
    };

    const loadReport = (id) => {
        const selected = history.find(r => r.id === id);
        if (selected) {
            setReport(selected);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleDeleteReport = async (e, id) => {
        e.stopPropagation(); // Prevent loading the report when clicking delete

        if (!window.confirm("Delete this report from history?")) return;

        try {
            await aiService.deleteReport(id);
            setHistory(prev => prev.filter(r => r.id !== id));
            if (report?.id === id) setReport(null);
        } catch (err) {
            // console.error("Error deleting report:", err);
            alert("Failed to delete report: " + err.message);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header / Generator Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="card bg-base-100 shadow-xl border border-base-200">
                        <div className="card-body">
                            <h2 className="card-title text-2xl font-black italic">
                                <Bot className="text-primary" />
                                AI AUDITOR
                            </h2>
                            <p className="text-xs opacity-70">Expert audit using Vector-RAG powered by 5 finance bestsellers.</p>

                            <div className="form-control w-full mt-4">
                                <label className="label">
                                    <span className="label-text font-bold uppercase tracking-wider text-[10px]">Scope</span>
                                </label>
                                <select
                                    className="select select-bordered select-sm font-bold"
                                    value={analysisType}
                                    onChange={(e) => setAnalysisType(e.target.value)}
                                >
                                    <option value="weekly">Weekly Review</option>
                                    <option value="monthly">Monthly Summary</option>
                                </select>
                            </div>

                            {analysisType === 'monthly' ? (
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-bold uppercase tracking-wider text-[10px]">Month</span>
                                        </label>
                                        <select
                                            className="select select-bordered select-sm font-bold"
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        >
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-bold uppercase tracking-wider text-[10px]">Year</span>
                                        </label>
                                        <select
                                            className="select select-bordered select-sm font-bold"
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        >
                                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-bold uppercase tracking-wider text-[10px]">Week #</span>
                                        </label>
                                        <select
                                            className="select select-bordered select-sm font-bold"
                                            value={selectedWeek}
                                            onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                                        >
                                            {Array.from({ length: 52 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-bold uppercase tracking-wider text-[10px]">Year</span>
                                        </label>
                                        <select
                                            className="select select-bordered select-sm font-bold"
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        >
                                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <button
                                className={`btn btn-primary btn-block btn-sm mt-6 gap-2 text-xs shadow-lg shadow-primary/20 ${isGenerating && 'loading'}`}
                                onClick={handleGenerate}
                                disabled={isGenerating || data.transactions.length === 0}
                            >
                                {isGenerating ? "Analyzing..." : "Generate Audit"}
                            </button>
                        </div>
                    </div>

                    {/* History Sidebar */}
                    <div className="card bg-base-100 shadow-xl border border-base-200">
                        <div className="card-body p-0">
                            <div className="p-4 border-b border-base-200 bg-base-200/50 rounded-t-2xl">
                                <h3 className="font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={14} className="text-primary" />
                                    History
                                </h3>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto">
                                {history.length === 0 ? (
                                    <div className="p-8 text-center opacity-40 italic text-xs">
                                        No reports yet.
                                    </div>
                                ) : (
                                    history.map((r) => (
                                        <div
                                            key={r.id}
                                            onClick={() => loadReport(r.id)}
                                            className={`w-full text-left p-3 border-b border-base-100 hover:bg-base-200 transition-all flex items-center justify-between group cursor-pointer ${report?.id === r.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                                        >
                                            <div className="truncate pr-2">
                                                <div className="font-bold text-xs truncate">{r.period}</div>
                                                <div className="text-[9px] uppercase opacity-50 font-black">{r.type}</div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 relative">
                                                <div className={`badge badge-xs font-bold ${r.score > 80 ? 'badge-success' : r.score > 60 ? 'badge-warning' : 'badge-error'}`}>
                                                    {r.score}%
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteReport(e, r.id)}
                                                    className="btn btn-ghost btn-xs px-1 text-error opacity-40 hover:opacity-100 transition-opacity z-20"
                                                    title="Delete Report"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    {!report ? (
                        <div className="card bg-base-100 h-full shadow-xl border border-dashed border-base-300 flex items-center justify-center p-12 text-center opacity-50">
                            <div className="max-w-xs space-y-4">
                                <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mx-auto">
                                    <Bot size={32} />
                                </div>
                                <h2 className="text-xl font-bold">Ready to Analyze</h2>
                                <p className="text-sm">Generate an AI report to reveal your financial health score and professional recommendations.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Score Card */}
                            <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
                                <div className="p-8 bg-gradient-to-br from-primary to-accent text-primary-content flex flex-col md:flex-row items-center gap-8">
                                    <div className="radial-progress bg-white/10 border-4 border-white/20 text-white font-black text-2xl shadow-2xl shrink-0" style={{ "--value": report.score, "--size": "8rem", "--thickness": "8px" }}>
                                        {report.score}%
                                    </div>
                                    <div className="space-y-2 text-center md:text-left">
                                        <div className="badge badge-outline text-white border-white/40 uppercase font-black tracking-widest text-[10px] py-1 px-4 h-auto">
                                            {report.type} Audit • {report.dateGenerated}
                                        </div>
                                        <h2 className="text-4xl font-black tracking-tight">{report.period}</h2>
                                        <p className="max-w-md text-white/80 leading-relaxed font-medium text-sm">{report.summary}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Key Insights */}
                                <div className="card bg-base-100 shadow-xl border border-base-200">
                                    <div className="card-body">
                                        <h3 className="card-title text-[11px] uppercase tracking-widest font-black flex items-center gap-2 mb-4">
                                            <AlertCircle className="text-secondary" size={16} />
                                            Key Insights
                                        </h3>
                                        <div className="space-y-3 text-xs font-semibold">
                                            {(report.insights || []).map((insight, idx) => (
                                                <div key={idx} className={`p-4 rounded-xl flex items-start gap-3 border ${insight.type === 'alert' ? 'bg-error/10 border-error/20 text-error' :
                                                    insight.type === 'warning' ? 'bg-warning/10 border-warning/20 text-warning-content' :
                                                        insight.type === 'success' ? 'bg-success/10 border-success/20 text-success' :
                                                            'bg-info/10 border-info/20 text-info-content'
                                                    }`}>
                                                    <div className="mt-0.5">
                                                        {insight.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                                    </div>
                                                    <p className="leading-tight">{insight.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* AI Recommendations */}
                                <div className="card bg-base-100 shadow-xl border border-base-200">
                                    <div className="card-body">
                                        <h3 className="card-title text-[11px] uppercase tracking-widest font-black flex items-center gap-2 mb-4">
                                            <Sparkles className="text-primary" size={16} />
                                            Professional Guidance
                                        </h3>
                                        <div className="space-y-4 text-xs">
                                            {(report.recommendations || []).map((rec, idx) => (
                                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-base-200 transition-colors">
                                                    <ArrowRight size={14} className="text-primary mt-0.5 shrink-0" />
                                                    <p className="font-bold text-base-content/70 leading-normal">{rec}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 p-3 bg-base-200/50 rounded-xl flex items-center gap-3 border border-base-300">
                                            <Bot size={20} className="text-primary opacity-50 shrink-0" />
                                            <p className="text-[9px] opacity-60 font-bold uppercase leading-tight tracking-tight">Report generated by scanning 5 specialized financial knowledge bases.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BudgetAnalysis;
