import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, DollarSign, TrendingUp } from 'lucide-react';
import { transactionService } from '../services/api';

const Calendar = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Current display month
    const [viewDate, setViewDate] = useState(new Date()); // Default to current date

    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const year = viewDate.getFullYear();

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                const response = await transactionService.getTransactions({
                    limit: 1000,
                    year: viewDate.getFullYear(),
                    month: viewDate.getMonth() + 1
                });
                setTransactions(response.items || []);
            } catch (err) {
                console.error("Error fetching transactions for calendar:", err);
                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, [viewDate]);

    const daysInMonth = new Date(year, viewDate.getMonth() + 1, 0).getDate();
    const startDayOffset = new Date(year, viewDate.getMonth(), 1).getDay();

    const changeMonth = (offset) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(newDate);
    };

    const setToday = () => {
        setViewDate(new Date());
    };

    const getEventsForDay = (day) => {
        return transactions.filter(t => {
            if (!t.date) return false;
            // Standardizing date comparison
            const dateParts = t.date.split('-');
            if (dateParts.length !== 3) return false;

            const tYear = parseInt(dateParts[0]);
            const tMonth = parseInt(dateParts[1]) - 1; // 0-indexed
            const tDay = parseInt(dateParts[2]);

            return tDay === day &&
                tMonth === viewDate.getMonth() &&
                tYear === year;
        });
    };

    const getTypeStyles = (type) => {
        switch (type) {
            case 'income': return 'bg-success/10 text-success border-success/20';
            case 'expense': return 'bg-error/10 text-error border-error/20';
            default: return 'bg-base-200 text-base-content border-base-300';
        }
    };

    const isToday = (day) => {
        const today = new Date();
        return today.getDate() === day &&
            today.getMonth() === viewDate.getMonth() &&
            today.getFullYear() === year;
    };

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        <CalendarIcon size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-base-content">Cash Flow Calendar</h1>
                        <p className="text-sm font-bold opacity-50 tracking-widest uppercase">{monthName} {year}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-base-100 p-2 rounded-2xl shadow-sm border border-base-200">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="btn btn-square btn-sm btn-ghost hover:bg-primary/10"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={setToday}
                        className="btn btn-ghost btn-sm font-black uppercase text-xs tracking-widest px-4"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => changeMonth(1)}
                        className="btn btn-square btn-sm btn-ghost hover:bg-primary/10"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </header>

            <div className="card bg-base-100 shadow-2xl flex-1 border border-base-200 overflow-hidden rounded-[2rem]">
                <div className="card-body p-0 h-full flex flex-col">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-base-200 bg-base-200/30">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="p-4 text-center text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(120px,1fr)] bg-base-200/50 gap-[1px] overflow-y-auto custom-scrollbar">
                        {/* Empty padding days from previous month */}
                        {Array.from({ length: startDayOffset }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-base-100/30 p-2"></div>
                        ))}

                        {/* Days */}
                        {loading ? (
                            <div className="col-span-7 bg-base-100 flex items-center justify-center h-full">
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="animate-spin text-primary" size={48} />
                                    <span className="font-black uppercase tracking-widest text-xs opacity-40">Syncing Ledger...</span>
                                </div>
                            </div>
                        ) : (
                            Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const events = getEventsForDay(day);

                                return (
                                    <div key={day} className="bg-base-100 p-3 hover:bg-base-200/30 transition-all duration-300 relative group overflow-hidden border-t-2 border-transparent hover:border-primary">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-black w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isToday(day) ? 'bg-primary text-primary-content shadow-lg shadow-primary/30' : 'opacity-40 group-hover:opacity-100'
                                                }`}>
                                                {day}
                                            </span>
                                            {events.length > 0 && (
                                                <div className="text-[10px] font-black opacity-20 group-hover:opacity-100 transition-opacity">
                                                    {events.length} {events.length === 1 ? 'Tx' : 'Txs'}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 overflow-y-auto max-h-[80px] no-scrollbar">
                                            {events.sort((a, b) => b.amount - a.amount).map(event => (
                                                <div
                                                    key={event.id}
                                                    className={`text-[9px] px-2 py-1 rounded-lg border flex items-center justify-between gap-1 transition-transform hover:scale-[1.03] ${getTypeStyles(event.type)}`}
                                                    title={`${event.title} - ${event.amount}€`}
                                                >
                                                    <span className="truncate flex-1 font-bold">{event.title}</span>
                                                    <span className="font-black tabular-nums">
                                                        {event.type === 'income' ? '+' : ''}{event.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* Fill the rest of the grid with empty slots */}
                        {Array.from({ length: (42 - (startDayOffset + daysInMonth)) % 7 }).map((_, i) => (
                            <div key={`empty-end-${i}`} className="bg-base-100/30 p-2"></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Stats Footer */}
            {!loading && (
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    <div className="bg-success/10 border border-success/20 p-4 rounded-2xl flex items-center gap-4 min-w-[200px]">
                        <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center text-success">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-black opacity-50 tracking-wider">Month Income</div>
                            <div className="text-xl font-black text-success tabular-nums">
                                {transactions
                                    .filter(t => t.type === 'income' && t.date && new Date(t.date).getMonth() === viewDate.getMonth() && new Date(t.date).getFullYear() === viewDate.getFullYear())
                                    .reduce((acc, t) => acc + t.amount, 0)
                                    .toLocaleString()}€
                            </div>
                        </div>
                    </div>
                    <div className="bg-error/10 border border-error/20 p-4 rounded-2xl flex items-center gap-4 min-w-[200px]">
                        <div className="w-10 h-10 rounded-xl bg-error/20 flex items-center justify-center text-error">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-black opacity-50 tracking-wider">Month Expenses</div>
                            <div className="text-xl font-black text-error tabular-nums">
                                {transactions
                                    .filter(t => t.type === 'expense' && t.date && new Date(t.date).getMonth() === viewDate.getMonth() && new Date(t.date).getFullYear() === viewDate.getFullYear())
                                    .reduce((acc, t) => acc + t.amount, 0)
                                    .toLocaleString()}€
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
