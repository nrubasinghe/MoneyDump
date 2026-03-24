import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Shield, Laptop, Sun, Car, Plus, ChevronRight, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { goalService, aiService } from '../services/api';

const SavingsGoals = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // AI Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);

    // New Goal Modal State
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newGoal, setNewGoal] = useState({
        title: '',
        targetAmount: '',
        currentAmount: '',
        deadline: '',
        icon: 'Target',
        color: 'primary'
    });

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        if (type !== 'info') {
            setTimeout(() => setNotification(null), 5000);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const data = await goalService.getGoals();
            setGoals(data);
            setError(null);
        } catch (err) {
            console.error("Error fetching goals:", err);
            setError("Failed to load savings goals.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        showNotification("API Triggering: Deleting savings goal...", "info");
        try {
            await goalService.deleteGoal(id);
            showNotification("Savings goal deleted successfully");
            fetchGoals();
        } catch (err) {
            console.error("Error deleting goal:", err);
            showNotification("Failed to delete goal", "error");
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const handleAnalyze = async () => {
        if (!goals || goals.length === 0) {
            showNotification("No goals to analyze!", "warning");
            return;
        }

        setIsAnalyzing(true);
        setShowAnalysisModal(true);
        setAnalysisResult(null);

        const goalsSummary = goals.map(g => `- ${g.title}: €${g.currentAmount} / €${g.targetAmount} (Deadline: ${new Date(g.deadline).toLocaleDateString()})`).join('\n');
        const prompt = `Please provide a critical financial analysis of my current savings goals utilizing the curated knowledge base. Focus on priorities, timeline feasibility, and strategies to accelerate. Here are my current goals:\n\n${goalsSummary}`;

        try {
            const data = await aiService.getAdvice(prompt);
            setAnalysisResult(data.answer);
        } catch (err) {
            console.error("Error generating analysis:", err);
            showNotification("Failed to generate goal analysis", "error");
            setShowAnalysisModal(false);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCreateGoal = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await goalService.createGoal({
                title: newGoal.title,
                targetAmount: parseFloat(newGoal.targetAmount),
                currentAmount: parseFloat(newGoal.currentAmount) || 0,
                deadline: newGoal.deadline,
                icon: newGoal.icon,
                color: newGoal.color,
            });
            showNotification('Savings goal created successfully!');
            setIsGoalModalOpen(false);
            setNewGoal({ title: '', targetAmount: '', currentAmount: '', deadline: '', icon: 'Target', color: 'primary' });
            fetchGoals();
        } catch (err) {
            console.error('Error creating goal:', err);
            showNotification('Failed to create goal', 'error');
        } finally {
            setIsCreating(false);
        }
    };

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'Shield': return <Shield size={24} />;
            case 'Laptop': return <Laptop size={24} />;
            case 'Sun': return <Sun size={24} />;
            case 'Car': return <Car size={24} />;
            default: return <Target size={24} />;
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Savings & Goals</h1>
                    <p className="text-base-content/70">Track your progress towards financial freedom.</p>
                </div>
                <button className="btn btn-primary gap-2" onClick={() => setIsGoalModalOpen(true)}>
                    <Plus size={18} />
                    New Goal
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="card bg-base-100 shadow-sm border border-base-200 lg:col-span-3 py-12 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="font-bold opacity-60">Loading your goals...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="card bg-base-100 shadow-sm border border-base-200 lg:col-span-3 py-12 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3 text-error">
                            <AlertCircle size={40} />
                            <p className="font-bold">{error}</p>
                            <button onClick={fetchGoals} className="btn btn-error btn-outline btn-sm">Retry</button>
                        </div>
                    </div>
                ) : goals.length === 0 ? (
                    <div className="card bg-base-100 shadow-sm border border-base-200 lg:col-span-3 py-12 flex items-center justify-center italic opacity-50">
                        No savings goals found. Start by creating a new one!
                    </div>
                ) : (
                    goals.map((goal) => {
                        const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                        return (
                            <div key={goal.id} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all group">
                                <div className="card-body">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex gap-3">
                                            <div className={`p-3 rounded-xl bg-${goal.color || 'primary'}/10 text-${goal.color || 'primary'}`}>
                                                {getIcon(goal.icon)}
                                            </div>
                                            <button
                                                className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 text-error transition-opacity disabled:bg-transparent"
                                                onClick={() => setConfirmDeleteId(goal.id)}
                                                disabled={deletingId === goal.id}
                                            >
                                                {deletingId === goal.id ? <Loader2 className="animate-spin text-error" size={16} /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold font-mono">{goal.currentAmount.toLocaleString()}€</p>
                                            <p className="text-xs text-base-content/50">of {goal.targetAmount.toLocaleString()}€</p>
                                        </div>
                                    </div>

                                    <h3 className="card-title text-lg">{goal.title}</h3>
                                    <p className="text-xs text-base-content/50 mb-4">Deadline: {new Date(goal.deadline).toLocaleDateString()}</p>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span>{progress.toFixed(0)}%</span>
                                            {progress < 100 && <span className="text-primary">+50€/mo suggested</span>}
                                        </div>
                                        <progress
                                            className={`progress progress-${goal.color || 'primary'} w-full`}
                                            value={progress}
                                            max="100"
                                        ></progress>
                                    </div>

                                    <div className="card-actions justify-end mt-4 pt-4 border-t border-base-200">
                                        <button className="btn btn-ghost btn-sm gap-1 group-hover:text-primary transition-colors">
                                            View Details <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Summaries / Stats */}
                {!loading && !error && (
                    <div className="card bg-primary text-primary-content shadow-xl md:col-span-2 lg:col-span-1">
                        <div className="card-body">
                            <TrendingUp size={32} className="mb-2" />
                            <h2 className="card-title">Total Savings</h2>
                            <p className="text-4xl font-bold mt-2">
                                {goals.reduce((acc, curr) => acc + curr.currentAmount, 0).toLocaleString()}€
                            </p>
                            <p className="opacity-80 mt-2">Your progress towards all {goals.length} goals.</p>
                            <div className="card-actions justify-end mt-4">
                                <button className="btn btn-secondary btn-sm gap-2" onClick={handleAnalyze} disabled={isAnalyzing}>
                                    {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <TrendingUp size={16} />}
                                    {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className="toast toast-end toast-bottom z-[100] p-4">
                    <div className={`alert ${notification.type === 'success' ? 'alert-success' : notification.type === 'info' ? 'alert-info' : 'alert-error'} shadow-2xl border-none text-white animate-in slide-in-from-bottom-5 fade-in duration-300`}>
                        <div className="flex items-center gap-3">
                            {notification.type === 'info' && <Loader2 className="animate-spin" size={18} />}
                            <span className="font-bold tracking-tight">{notification.message}</span>
                        </div>
                    </div>
                </div>
            )}
            {/* Custom Confirmation Modal */}
            {confirmDeleteId && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all scale-100 p-6 text-center">
                        <div className="mx-auto bg-error/10 text-error p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="font-black text-xl mb-2">Delete Savings Goal?</h3>
                        <p className="text-sm opacity-60 mb-6 font-medium">This action cannot be undone. Are you sure you want to permanently remove this goal?</p>
                        <div className="flex gap-3 w-full">
                            <button className="btn btn-ghost flex-1 rounded-2xl" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                            <button className="btn btn-error flex-1 rounded-2xl text-white shadow-lg shadow-error/30" onClick={() => handleDelete(confirmDeleteId)}>
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Analysis Modal */}
            {showAnalysisModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-base-100 rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col border border-primary/20">
                        <div className="bg-primary/20 p-6 flex justify-between items-center">
                            <h3 className="font-black text-2xl flex items-center gap-3">
                                <TrendingUp className="text-primary" size={28} />
                                Savings AI Audit
                            </h3>
                            <button className="btn btn-ghost btn-circle btn-sm" onClick={() => setShowAnalysisModal(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 relative">
                            {isAnalyzing ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50 py-12">
                                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="font-black uppercase tracking-widest text-sm animate-pulse">Running Knowledge Base Models...</p>
                                </div>
                            ) : analysisResult ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none text-base-content/80">
                                    {analysisResult.split('\n').map((line, i) => {
                                        if (line.startsWith('###')) return <h3 key={i} className="text-xl font-bold text-primary mt-6 mb-2">{line.replace('###', '')}</h3>;
                                        if (line.startsWith('##')) return <h2 key={i} className="text-2xl font-black text-base-content mt-8 mb-4 border-b border-base-200 pb-2">{line.replace('##', '')}</h2>;
                                        if (line.startsWith('**') && line.endsWith('**')) return <h4 key={i} className="font-bold text-primary mt-4 mb-2">{line.replace(/\*\*/g, '')}</h4>;
                                        if (line.startsWith('-')) return <li key={i} className="ml-4 my-1 opacity-90">{line.replace('-', '')}</li>;
                                        if (line.trim() === '') return <br key={i} />;
                                        return <p key={i} className="my-2 leading-relaxed">{line}</p>;
                                    })}
                                </div>
                            ) : null}
                        </div>
                        {!isAnalyzing && (
                            <div className="p-6 bg-base-200/50 flex justify-end">
                                <button className="btn btn-primary px-8 rounded-xl font-bold uppercase tracking-widest text-xs" onClick={() => setShowAnalysisModal(false)}>
                                    Finish
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* New Goal Modal */}
            {isGoalModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-md border border-base-200 overflow-hidden">
                        <div className="bg-primary/10 p-6 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                                    <Target size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl tracking-tight">New Savings Goal</h3>
                                    <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Define your target</p>
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-circle btn-sm" onClick={() => setIsGoalModalOpen(false)}>✕</button>
                        </div>

                        <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold text-xs uppercase tracking-widest opacity-50">Goal Title</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Emergency Fund, New Car..."
                                    className="input input-bordered rounded-2xl font-semibold"
                                    required
                                    value={newGoal.title}
                                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-bold text-xs uppercase tracking-widest opacity-50">Target Amount (€)</span></label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        placeholder="5000"
                                        className="input input-bordered rounded-2xl font-semibold"
                                        required
                                        value={newGoal.targetAmount}
                                        onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-bold text-xs uppercase tracking-widest opacity-50">Already Saved (€)</span></label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        placeholder="0"
                                        className="input input-bordered rounded-2xl font-semibold"
                                        value={newGoal.currentAmount}
                                        onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold text-xs uppercase tracking-widest opacity-50">Deadline</span></label>
                                <input
                                    type="date"
                                    className="input input-bordered rounded-2xl font-semibold"
                                    required
                                    value={newGoal.deadline}
                                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-bold text-xs uppercase tracking-widest opacity-50">Icon</span></label>
                                    <select className="select select-bordered rounded-2xl font-semibold" value={newGoal.icon} onChange={(e) => setNewGoal({ ...newGoal, icon: e.target.value })}>
                                        <option value="Target">🎯 Target</option>
                                        <option value="Shield">🛡️ Shield</option>
                                        <option value="Laptop">💻 Laptop</option>
                                        <option value="Sun">☀️ Sun</option>
                                        <option value="Car">🚗 Car</option>
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text font-bold text-xs uppercase tracking-widest opacity-50">Color</span></label>
                                    <select className="select select-bordered rounded-2xl font-semibold" value={newGoal.color} onChange={(e) => setNewGoal({ ...newGoal, color: e.target.value })}>
                                        <option value="primary">Primary</option>
                                        <option value="secondary">Secondary</option>
                                        <option value="accent">Accent</option>
                                        <option value="success">Success</option>
                                        <option value="warning">Warning</option>
                                        <option value="info">Info</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" className="btn btn-ghost flex-1 rounded-2xl" onClick={() => setIsGoalModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary flex-1 rounded-2xl shadow-lg shadow-primary/30 font-black uppercase tracking-widest text-xs" disabled={isCreating}>
                                    {isCreating ? <><Loader2 className="animate-spin" size={16} /> Saving...</> : <><Plus size={16} /> Create Goal</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SavingsGoals;
