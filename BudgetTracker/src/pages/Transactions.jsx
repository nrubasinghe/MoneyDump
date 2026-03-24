import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Loader2, Trash2, ChevronLeft, ChevronRight, Hash, Calendar, Tag, ArrowUpDown } from 'lucide-react';
import { transactionService } from '../services/api';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filtering States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortBy, setSortBy] = useState('date-desc');
    const [filterYear, setFilterYear] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [categories, setCategories] = useState(['all']);
    const [notification, setNotification] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        if (type !== 'info') {
            setTimeout(() => setNotification(null), 5000);
        }
    };

    // Fetch transactions with server-side filters
    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                skip: (currentPage - 1) * itemsPerPage,
                limit: itemsPerPage,
                type: filterType === 'all' ? undefined : filterType,
                category: filterCategory === 'all' ? undefined : filterCategory,
                search: searchTerm || undefined,
                sort_by: sortBy,
                year: filterYear === 'all' ? undefined : Number(filterYear),
                month: filterMonth === 'all' ? undefined : Number(filterMonth)
            };

            const response = await transactionService.getTransactions(params);

            // The response is now { items: [], total: number }
            setTransactions(response.items || []);
            setTotalItems(response.total || 0);
            setError(null);
        } catch (err) {
            console.error("Error fetching transactions:", err);
            setError("Failed to load transactions. Is the API running?");
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, filterType, filterCategory, searchTerm, sortBy, filterYear, filterMonth]);

    // Fetch categories once on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // Fetch a large batch just to extract categories reliably
                const response = await transactionService.getTransactions({ limit: 1000 });
                const cats = new Set((response.items || []).map(t => t.category).filter(Boolean));
                setCategories(['all', ...Array.from(cats).sort()]);
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        };
        fetchCategories();
    }, []);

    // Re-fetch transactions when dependencies change
    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType, filterCategory, sortBy, itemsPerPage, filterYear, filterMonth]);

    const handleDelete = async (id) => {
        setDeletingId(id);
        showNotification("API Triggering: Deleting transaction...", "info");
        try {
            await transactionService.deleteTransaction(id);
            showNotification("Transaction deleted successfully");
            fetchTransactions();
        } catch (err) {
            console.error("Error deleting transaction:", err);
            showNotification("Failed to delete transaction. Please check your connection.", "error");
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        <Hash size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-base-content">Ledger</h1>
                        <p className="text-sm font-bold opacity-50 tracking-widest uppercase truncate max-w-xs md:max-w-none">
                            {totalItems} total entries in database
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 bg-base-100 p-1.5 rounded-2xl shadow-sm border border-base-200">
                    {['all', 'income', 'expense'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type
                                ? 'bg-primary text-primary-content shadow-lg shadow-primary/20'
                                : 'hover:bg-base-200 opacity-50 hover:opacity-100'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </header>

            {/* Premium Dynamic Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-base-100 p-4 rounded-[2rem] shadow-xl border border-base-200">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" size={18} />
                    <input
                        type="text"
                        placeholder="Search merchant or title..."
                        className="input input-bordered w-full pl-12 bg-base-200/50 border-none focus:bg-base-100 transition-all font-bold text-sm h-12 rounded-2xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="relative group">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-40" size={18} />
                    <select
                        className="select select-bordered w-full pl-12 bg-base-200/50 border-none focus:bg-base-100 transition-all font-bold text-sm h-12 rounded-2xl appearance-none"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="all">Every Category</option>
                        {categories.filter(c => c !== 'all').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="relative group">
                    <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-40" size={18} />
                    <select
                        className="select select-bordered w-full pl-12 bg-base-200/50 border-none focus:bg-base-100 transition-all font-bold text-sm h-12 rounded-2xl appearance-none"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="amount-desc">Highest Amount</option>
                        <option value="amount-asc">Lowest Amount</option>
                    </select>
                </div>

                <div className="relative group">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-40" size={18} />
                    <select
                        className="select select-bordered w-full pl-12 bg-base-200/50 border-none focus:bg-base-100 transition-all font-bold text-sm h-12 rounded-2xl appearance-none"
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    >
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                    </select>
                </div>

                <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-40" size={18} />
                    <select
                        className="select select-bordered w-full pl-12 bg-base-200/50 border-none focus:bg-base-100 transition-all font-bold text-sm h-12 rounded-2xl appearance-none"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                    >
                        <option value="all">All Months</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-40" size={18} />
                    <select
                        className="select select-bordered w-full pl-12 bg-base-200/50 border-none focus:bg-base-100 transition-all font-bold text-sm h-12 rounded-2xl appearance-none"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                    >
                        <option value="all">All Years</option>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div className="card bg-base-100 shadow-2xl border border-base-200 overflow-hidden rounded-[2rem]">
                <div className="card-body p-0">
                    <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
                        <table className="table table-pin-rows">
                            <thead>
                                <tr className="bg-base-200/50 backdrop-blur-md">
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest opacity-40">Entry Date</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest opacity-40">Transaction Details</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest opacity-40">Classification</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-right pr-12">Value</th>
                                    <th className="p-6 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-base-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-20">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="animate-spin text-primary" size={48} />
                                                <span className="font-black uppercase tracking-widest text-xs opacity-40">Syncing with Server...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-20 text-error">
                                            <div className="flex flex-col items-center gap-4 font-bold">
                                                <span>{error}</span>
                                                <button onClick={fetchTransactions} className="btn btn-sm btn-error btn-outline rounded-xl">Re-attempt sync</button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-20">
                                            <div className="flex flex-col items-center gap-4 opacity-30 italic">
                                                <Filter size={48} />
                                                <span className="font-bold">No entries found for this filter.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <Calendar size={14} className="text-primary" />
                                                    <span className="font-mono text-xs font-bold">{t.date}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${t.type === 'income' ? 'bg-success/10 text-success' : 'bg-base-200 text-base-content/70'
                                                        }`}>
                                                        {t.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-sm tracking-tight">{t.title}</div>
                                                        <div className="text-[10px] uppercase font-black opacity-30">{t.merchant}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="badge badge-outline border-base-300 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-tighter">
                                                        {t.category}
                                                    </div>
                                                    <div className={`badge badge-xs ${t.status === 'completed' ? 'badge-success' : 'badge-warning'}`}></div>
                                                </div>
                                            </td>
                                            <td className={`p-6 text-right pr-12 font-mono text-lg font-black tracking-tighter ${t.type === 'income' ? 'text-success' : 'text-base-content'
                                                }`}>
                                                <span className="opacity-30 mr-1 text-sm font-bold">€</span>
                                                {t.type === 'income' ? '+' : '-'}{parseFloat(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-6">
                                                <button
                                                    className="btn btn-ghost btn-circle btn-sm text-error opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/10"
                                                    onClick={() => setConfirmDeleteId(t.id)}
                                                    disabled={deletingId === t.id}
                                                >
                                                    {deletingId === t.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Premium Pagination Footer */}
                    {!loading && totalItems > 0 && (
                        <div className="p-6 bg-base-200/30 border-t border-base-200 flex flex-col md:flex-row items-center justify-between gap-4">
                            <span className="text-[10px] uppercase font-black opacity-40 tracking-[0.2em]">
                                Displaying <span className="text-base-content opacity-100">{startIndex + 1} – {Math.min(startIndex + itemsPerPage, totalItems)}</span> of <span className="text-base-content opacity-100">{totalItems}</span> sync'd entries
                            </span>

                            <div className="flex items-center gap-1">
                                <button
                                    className="btn btn-square btn-sm btn-ghost hover:bg-primary/10 rounded-xl"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={18} />
                                </button>

                                {Array.from({ length: totalPages }).map((_, i) => {
                                    const page = i + 1;
                                    // Only show current, first, last, neighbors
                                    if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${currentPage === page
                                                    ? 'bg-primary text-primary-content shadow-lg shadow-primary/20'
                                                    : 'hover:bg-primary/10'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (page === currentPage - 3 || page === currentPage + 3) {
                                        return <span key={page} className="opacity-20 flex items-center justify-center w-8">...</span>;
                                    }
                                    return null;
                                })}

                                <button
                                    className="btn btn-square btn-sm btn-ghost hover:bg-primary/10 rounded-xl"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Notifications */}
            {notification && (
                <div className="toast toast-end toast-bottom p-6 z-[100]">
                    <div className={`alert rounded-3xl shadow-2xl border-none font-black uppercase text-[10px] tracking-widest text-primary-content ${notification.type === 'success' ? 'bg-success' : notification.type === 'error' ? 'bg-error' : 'bg-primary'
                        }`}>
                        <div className="flex items-center gap-3">
                            {notification.type === 'info' && <Loader2 className="animate-spin" size={16} />}
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
                        <h3 className="font-black text-xl mb-2">Delete Transaction?</h3>
                        <p className="text-sm opacity-60 mb-6 font-medium">This action cannot be undone. Are you sure you want to permanently remove this entry?</p>
                        <div className="flex gap-3 w-full">
                            <button className="btn btn-ghost flex-1 rounded-2xl" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                            <button className="btn btn-error flex-1 rounded-2xl text-white shadow-lg shadow-error/30" onClick={() => handleDelete(confirmDeleteId)}>
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;
