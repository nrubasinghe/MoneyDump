import React, { useState, useEffect, useMemo } from 'react';
import { Plus, MoreHorizontal, Loader2, AlertCircle, Trash2, Wallet, Target, Activity, ShieldAlert, CheckCircle2, MoreVertical, TrendingUp } from 'lucide-react';
import { budgetService, transactionService } from '../services/api';

const BudgetBoard = () => {
    const [budgets, setBudgets] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        if (type !== 'info') {
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const now = new Date();
            const [budgetData, transData] = await Promise.all([
                budgetService.getBudgets(),
                transactionService.getTransactions({
                    limit: 1000,
                    year: now.getFullYear(),
                    month: now.getMonth() + 1
                })
            ]);
            setBudgets(Array.isArray(budgetData) ? budgetData : []);
            setTransactions(transData.items || []);
            setError(null);
        } catch (err) {
            console.error("Error fetching board data:", err);
            setError("Failed to sync financial data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id) => {
        setDeletingId(id);
        setConfirmDeleteId(null);
        showNotification("API Triggering: Dissolving budget allocation...", "info");
        try {
            await budgetService.deleteBudget(id);
            showNotification("Budget allocation dissolved");
            fetchData();
        } catch (err) {
            console.error("Error deleting budget:", err);
            showNotification("Failed to delete budget", "error");
        } finally {
            setDeletingId(null);
        }
    };

    // Smart Budget Calculation & Categorization
    const smartBudgets = useMemo(() => {
        return budgets.map(budget => {
            // Calculate real spent from transactions for this category
            const realSpent = transactions
                .filter(t => t.type === 'expense' && t.category.toLowerCase() === budget.category.toLowerCase())
                .reduce((sum, t) => sum + t.amount, 0);

            const percent = budget.limit > 0 ? (realSpent / budget.limit) * 100 : 0;

            // Dynamic Status Determination
            let dynamicStatus = 'active';
            if (realSpent === 0) dynamicStatus = 'planned';
            else if (realSpent >= budget.limit) dynamicStatus = 'exceeded';
            else if (percent >= 80) dynamicStatus = 'warning';

            return {
                ...budget,
                realSpent,
                percent,
                dynamicStatus
            };
        });
    }, [budgets, transactions]);

    const columns = [
        { title: 'Planned', id: 'planned', icon: <Target size={16} />, color: 'primary' },
        { title: 'Active', id: 'active', icon: <Activity size={16} />, color: 'success' },
        { title: 'On Watch', id: 'warning', icon: <ShieldAlert size={16} />, color: 'warning' },
        { title: 'Exceeded', id: 'exceeded', icon: <AlertCircle size={16} />, color: 'error' }
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBudget, setNewBudget] = useState({
        category: '',
        limit: 0,
        color: 'primary'
    });

    const handleCreateBudget = async (e) => {
        e.preventDefault();
        try {
            showNotification("API Triggering: Creating budget group...", "info");
            await budgetService.createBudget({
                ...newBudget,
                spent: 0,
                status: 'active'
            });
            showNotification("Budget group established");
            setIsModalOpen(false);
            setNewBudget({ category: '', limit: 0, color: 'primary' });
            fetchData();
        } catch (err) {
            showNotification("Failed to create budget", "error");
        }
    };

    const getProgressHSL = (percent) => {
        if (percent >= 100) return 'hsl(var(--er))';
        if (percent >= 80) return 'hsl(var(--wa))';
        return 'hsl(var(--p))';
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 flex flex-col">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary shadow-inner">
                        <Wallet size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-base-content">Budget Board</h1>
                        <p className="text-xs font-bold opacity-50 tracking-[0.2em] uppercase">Dynamic Liquidity Management</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-6 px-6 py-3 bg-base-100 rounded-2xl border border-base-200 shadow-sm">
                        <div className="text-right">
                            <div className="text-[10px] font-black opacity-30 uppercase tracking-widest">Global Limit</div>
                            <div className="font-mono font-black text-lg">€{smartBudgets.reduce((s, b) => s + b.limit, 0).toLocaleString()}</div>
                        </div>
                        <div className="w-px h-8 bg-base-200"></div>
                        <div className="text-right">
                            <div className="text-[10px] font-black opacity-30 uppercase tracking-widest">Utilized</div>
                            <div className="font-mono font-black text-lg text-primary">€{smartBudgets.reduce((s, b) => s + b.realSpent, 0).toLocaleString()}</div>
                        </div>
                    </div>
                    <button
                        className="btn btn-primary h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 gap-3 border-none group"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span className="font-black uppercase tracking-widest text-xs">New Allocation</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-5 opacity-40">
                        <Loader2 className="animate-spin text-primary" size={48} />
                        <p className="font-black uppercase tracking-[0.3em] text-xs">Calibrating Columns...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full gap-5">
                        <div className="p-4 bg-error/10 rounded-full text-error">
                            <ShieldAlert size={48} />
                        </div>
                        <p className="font-bold text-error">{error}</p>
                        <button onClick={fetchData} className="btn btn-error btn-sm btn-outline rounded-xl px-8">Sync Again</button>
                    </div>
                ) : (
                    <div className="flex gap-6 h-full min-w-max pb-4">
                        {columns.map((col) => {
                            const items = smartBudgets.filter(b => b.dynamicStatus === col.id);
                            return (
                                <div key={col.id} className="w-80 flex flex-col bg-base-200/40 rounded-[2.5rem] p-4 border border-base-200 items-stretch h-fit">
                                    <div className="flex items-center justify-between mb-6 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-${col.color}/10 text-${col.color}`}>
                                                {col.icon}
                                            </div>
                                            <h3 className="font-black text-xs uppercase tracking-[0.1em] opacity-40">
                                                {col.title}
                                            </h3>
                                        </div>
                                        <span className={`badge badge-sm rounded-lg font-black bg-base-200 border-none opacity-40`}>
                                            {items.length}
                                        </span>
                                    </div>

                                    <div className="space-y-4 pb-4">
                                        {items.length > 0 ? (
                                            items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="card bg-base-100 shadow-xl border border-base-200 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] cursor-default group"
                                                >
                                                    <div className="card-body p-5 gap-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-black text-sm tracking-tight capitalize">{item.category}</h4>
                                                                <div className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Monthly cycle</div>
                                                            </div>
                                                            <div className="dropdown dropdown-end">
                                                                <label tabIndex={0} className="btn btn-ghost btn-xs btn-square opacity-20 group-hover:opacity-100 transition-opacity focus:opacity-100">
                                                                    <MoreVertical size={16} />
                                                                </label>
                                                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-200 rounded-2xl w-40 mt-2 border border-base-300">
                                                                    <li><button className="text-error font-bold text-xs uppercase" onClick={() => setConfirmDeleteId(item.id)}>
                                                                        {deletingId === item.id ? <Loader2 className="animate-spin inline mr-1" size={14} /> : <Trash2 size={14} />} Remove
                                                                    </button></li>
                                                                </ul>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-end">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black opacity-30 uppercase tracking-tighter">Spent</span>
                                                                    <span className={`font-mono text-base font-black ${item.percent >= 100 ? 'text-error' : 'text-base-content'}`}>
                                                                        €{item.realSpent.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                                                    </span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="text-[10px] font-black opacity-30 uppercase tracking-tighter">Allocation</span>
                                                                    <div className="font-mono text-xs opacity-50 font-bold">€{item.limit.toLocaleString()}</div>
                                                                </div>
                                                            </div>

                                                            <div className="relative h-2 w-full bg-base-200 rounded-full overflow-hidden shadow-inner">
                                                                <div
                                                                    className={`h-full transition-all duration-1000 ease-out rounded-full ${item.percent >= 100 ? 'bg-error shadow-[0_0_10px_rgba(255,0,0,0.5)]' :
                                                                        item.percent >= 80 ? 'bg-warning' :
                                                                            'bg-primary'
                                                                        }`}
                                                                    style={{ width: `${Math.min(item.percent, 100)}%` }}
                                                                />
                                                            </div>

                                                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                                                <span className={item.percent >= 100 ? 'text-error animate-pulse' : 'opacity-30'}>
                                                                    {item.percent >= 100 ? 'Limit Exceeded' : `${Math.round(item.percent)}% utilized`}
                                                                </span>
                                                                {item.percent < 100 && (
                                                                    <span className="opacity-30">
                                                                        €{(item.limit - item.realSpent).toLocaleString()} Left
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="h-24 border-2 border-dashed border-base-300/50 rounded-[2rem] flex flex-col items-center justify-center text-base-content/20 gap-2">
                                                <Activity size={24} className="opacity-20" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Idle Sector</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* New Allocation Modal */}
            {isModalOpen && (
                <div className="modal modal-open backdrop-blur-sm bg-base-300/40">
                    <div className="modal-box rounded-[2.5rem] p-8 border border-base-200">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-2xl tracking-tighter uppercase italic">New Allocation</h3>
                                <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Setup capital boundary</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateBudget} className="space-y-6">
                            <div className="form-control">
                                <label className="label"><span className="label-text font-black uppercase text-[10px] tracking-widest opacity-40">Sector Category</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. INFRASTRUCTURE, LOGISTICS..."
                                    className="input input-bordered h-14 rounded-2xl font-bold transition-all focus:border-primary border-base-200 bg-base-200/50"
                                    required
                                    value={newBudget.category}
                                    onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-black uppercase text-[10px] tracking-widest opacity-40">Capital Limit (€)</span></label>
                                <input
                                    type="number"
                                    className="input input-bordered h-14 rounded-2xl font-bold transition-all focus:border-primary border-base-200 bg-base-200/50"
                                    required
                                    value={newBudget.limit}
                                    onChange={(e) => setNewBudget({ ...newBudget, limit: parseFloat(e.target.value) })}
                                />
                            </div>

                            <div className="modal-action gap-3 mt-10">
                                <button type="button" className="btn btn-ghost h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest opacity-50" onClick={() => setIsModalOpen(false)}>Abort</button>
                                <button type="submit" className="btn btn-primary h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 border-none">Establish Allocation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Premium Notification Toast */}
            {notification && (
                <div className="toast toast-end toast-bottom z-[100] p-6">
                    <div className={`alert rounded-[2rem] shadow-2xl border-none text-primary-content font-black uppercase text-[10px] tracking-wider py-4 px-8 animate-in slide-in-from-right-10 ${notification.type === 'success' ? 'bg-success' : notification.type === 'info' ? 'bg-primary' : 'bg-error'
                        }`}>
                        <div className="flex items-center gap-4">
                            {notification.type === 'info' && <Loader2 className="animate-spin" size={18} />}
                            {notification.type === 'success' && <CheckCircle2 size={18} />}
                            <span>{notification.message}</span>
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
                        <h3 className="font-black text-xl mb-2">Dissolve Budget?</h3>
                        <p className="text-sm opacity-60 mb-6 font-medium">This action cannot be undone. Are you sure you want to permanently remove this budget allocation?</p>
                        <div className="flex gap-3 w-full">
                            <button className="btn btn-ghost flex-1 rounded-2xl" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                            <button className="btn btn-error flex-1 rounded-2xl text-white shadow-lg shadow-error/30" onClick={() => handleDelete(confirmDeleteId)}>
                                Yes, Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetBoard;
