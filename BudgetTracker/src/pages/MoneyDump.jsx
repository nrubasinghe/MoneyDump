import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Save, Mic, MicOff, Send, Command, Loader2 } from 'lucide-react';
import { transactionService, goalService, aiService } from '../services/api';

const MoneyDump = () => {
    const [dumpText, setDumpText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const textareaRef = useRef(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [extractedItems, setExtractedItems] = useState({ expenses: [], income: [], goals: [], budgets: [] });
    const [notification, setNotification] = useState(null);

    const formatDate = (dateStr) => {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
            return d.toISOString().split('T')[0];
        } catch (e) {
            return new Date().toISOString().split('T')[0];
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        if (type !== 'info') {
            setTimeout(() => setNotification(null), 5000);
        }
    };

    // Auto-save simulation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (dumpText) {
                setIsSaving(true);
                localStorage.setItem('moneyDump_v2', dumpText);
                setTimeout(() => setIsSaving(false), 500);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [dumpText]);

    useEffect(() => {
        const saved = localStorage.getItem('moneyDump_v2');
        if (saved) setDumpText(saved);
        if (textareaRef.current) textareaRef.current.focus();
    }, []);

    const [isProcessing, setIsProcessing] = useState(false);

    const handleExtract = async () => {
        if (!dumpText.trim()) return;

        setIsProcessing(true);
        showNotification("Analyzing your financial thoughts...", "info");
        try {
            const data = await aiService.processDump(dumpText);
            setNotification(null);

            // Normalize all fields for common state management
            const processedData = {
                expenses: (data.expenses || []).map(item => ({
                    id: Math.random().toString(36).substr(2, 9),
                    title: item.title,
                    amount: item.amount,
                    category: item.category || 'Misc',
                    date: formatDate(item.date || item.time),
                    merchant: item.merchant || 'General'
                })),
                income: (data.income || []).map(item => ({
                    id: Math.random().toString(36).substr(2, 9),
                    title: item.title,
                    amount: item.amount,
                    category: item.category || 'Salary',
                    date: formatDate(item.date || item.time)
                })),
                goals: (data.goals || []).map(item => ({
                    id: Math.random().toString(36).substr(2, 9),
                    title: item.title,
                    amount: item.targetAmount || item.amount || 0,
                    date: formatDate(item.deadline || item.date || item.targetDate)
                })),
                budgets: (data.budgets || []).map(item => ({
                    id: Math.random().toString(36).substr(2, 9),
                    category: item.category || 'Misc',
                    limit: item.limit || 0,
                    color: item.color || 'primary'
                }))
            };

            setExtractedItems(processedData);
            setIsModalOpen(true);
        } catch (err) {
            console.error("AI Processing Error:", err);
            showNotification("Failed to process your request with AI. Please check your connection.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const updateItem = (type, id, field, value) => {
        setExtractedItems(prev => ({
            ...prev,
            [type]: prev[type].map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }));
    };

    const deleteItem = (type, id) => {
        setExtractedItems(prev => ({
            ...prev,
            [type]: prev[type].filter(item => item.id !== id)
        }));
    };

    const toggleRecording = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            showNotification("Voice input is not supported in this browser. Please try Chrome or Edge.", "error");
            return;
        }

        if (isRecording) {
            if (window.recognitionInstance) {
                window.recognitionInstance.stop();
            }
            setIsRecording(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;
        window.recognitionInstance = recognition;

        recognition.onstart = () => {
            setIsRecording(true);
            showNotification("Listening... (Tap mic to stop)", "info");
        };

        const startText = dumpText.trim() ? dumpText.trim() + " " : "";

        recognition.onresult = (event) => {
            let sessionTranscript = '';
            for (let i = 0; i < event.results.length; ++i) {
                sessionTranscript += event.results[i][0].transcript + (event.results[i].isFinal ? ". " : " ");
            }
            setDumpText(startText + sessionTranscript);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsRecording(false);
            if (event.error === 'not-allowed') {
                showNotification("Microphone access denied.", "error");
            }
        };

        recognition.onend = () => {
            setIsRecording(false);
            setNotification(null);
            window.recognitionInstance = null;
        };

        recognition.start();
    };

    const handleKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            handleExtract();
        }
    };

    const handleConfirm = async () => {
        setIsSaving(true);
        showNotification("Syncing data to your account...", "info");
        try {
            const payload = {
                transactions: [
                    ...extractedItems.income.map(item => ({
                        title: item.title,
                        amount: parseFloat(item.amount),
                        type: 'income',
                        category: item.category,
                        date: item.date,
                        merchant: 'General',
                        status: 'completed',
                        recurring: false
                    })),
                    ...extractedItems.expenses.map(item => ({
                        title: item.title,
                        amount: parseFloat(item.amount),
                        type: 'expense',
                        category: item.category,
                        date: item.date,
                        merchant: item.merchant || 'General',
                        status: 'completed',
                        recurring: false
                    }))
                ],
                goals: extractedItems.goals.map(item => ({
                    title: item.title,
                    targetAmount: parseFloat(item.amount),
                    currentAmount: 0,
                    deadline: item.date,
                    color: 'primary',
                    icon: 'Target'
                })),
                budgets: extractedItems.budgets.map(item => ({
                    category: item.category,
                    limit: parseFloat(item.limit),
                    spent: 0,
                    color: item.color,
                    status: 'active'
                }))
            };

            await aiService.confirmDump(payload);

            showNotification("Successfully saved all items to your dashboard!", "success");
            setDumpText('');
            setIsModalOpen(false);
            localStorage.removeItem('moneyDump_v2');
        } catch (err) {
            console.error("Bulk save error:", err);
            showNotification("Failed to save items. Please check your backend connection.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const addItem = (type) => {
        const newItem = {
            id: Math.random().toString(36).substr(2, 9),
            title: '',
            amount: 0,
            date: new Date().toISOString().split('T')[0]
        };
        if (type === 'expenses') {
            newItem.category = 'Misc';
            newItem.merchant = 'General';
        }
        if (type === 'income') newItem.category = 'Salary';
        if (type === 'budgets') {
            newItem.category = 'New Budget';
            newItem.limit = 0;
            newItem.color = 'primary';
        }

        setExtractedItems(prev => ({
            ...prev,
            [type]: [...prev[type], newItem]
        }));
    };

    // Review Modal Render Function
    const renderReviewModal = () => {
        if (!isModalOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col transform transition-all scale-100">
                    <div className="p-6 border-b border-base-200 flex justify-between items-center bg-base-200/30">
                        <div>
                            <h3 className="font-bold text-2xl flex items-center gap-2">
                                <Sparkles className="text-primary" size={24} />
                                Confirm Financial Data
                            </h3>
                            <p className="text-sm opacity-70">The AI has analyzed your input. Please verify the accuracy.</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-circle btn-sm">
                            <Command size={18} />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-6 space-y-8">
                        {/* Income Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-base-200 pb-2">
                                <h4 className="font-bold text-success flex items-center gap-2 text-sm uppercase tracking-wider">
                                    Income ({extractedItems.income.length})
                                </h4>
                                <button onClick={() => addItem('income')} className="btn btn-xs btn-ghost text-success hover:bg-success/10">+ Add</button>
                            </div>
                            {extractedItems.income.map(item => (
                                <div key={item.id} className="flex flex-col md:flex-row gap-2 p-3 rounded-xl bg-success/5 border border-success/20 shadow-sm transition-colors group">
                                    <input
                                        type="text"
                                        value={item.title}
                                        onChange={(e) => updateItem('income', item.id, 'title', e.target.value)}
                                        className="input input-bordered input-sm flex-1 font-medium bg-base-100"
                                    />
                                    <input
                                        type="number"
                                        value={item.amount}
                                        onChange={(e) => updateItem('income', item.id, 'amount', e.target.value)}
                                        className="input input-bordered input-sm w-24 bg-base-100"
                                    />
                                    <input
                                        type="date"
                                        value={item.date}
                                        onChange={(e) => updateItem('income', item.id, 'date', e.target.value)}
                                        className="input input-bordered input-sm w-32 bg-base-100"
                                    />
                                    <select
                                        className="select select-bordered select-sm w-32 bg-base-100"
                                        value={item.category}
                                        onChange={(e) => updateItem('income', item.id, 'category', e.target.value)}
                                    >
                                        <option>Salary</option>
                                        <option>Freelance</option>
                                        <option>Gift</option>
                                        <option>Investment</option>
                                    </select>
                                    <button onClick={() => deleteItem('income', item.id)} className="btn btn-ghost btn-xs text-error transition-opacity">
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Expenses Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-base-200 pb-2">
                                <h4 className="font-bold text-error flex items-center gap-2 text-sm uppercase tracking-wider">
                                    Expenses ({extractedItems.expenses.length})
                                </h4>
                                <button onClick={() => addItem('expenses')} className="btn btn-xs btn-ghost text-error hover:bg-error/10">+ Add</button>
                            </div>
                            {extractedItems.expenses.map(item => (
                                <div key={item.id} className="flex flex-col md:flex-row gap-2 p-3 rounded-xl bg-error/5 border border-error/20 shadow-sm transition-colors group">
                                    <div className="flex-1 flex flex-col gap-1">
                                        <input
                                            type="text"
                                            value={item.title}
                                            placeholder="Detail"
                                            onChange={(e) => updateItem('expenses', item.id, 'title', e.target.value)}
                                            className="input input-bordered input-sm w-full font-medium bg-base-100"
                                        />
                                        <input
                                            type="text"
                                            value={item.merchant}
                                            placeholder="Merchant"
                                            onChange={(e) => updateItem('expenses', item.id, 'merchant', e.target.value)}
                                            className="input input-bordered input-sm w-full text-xs bg-base-100 opacity-70"
                                        />
                                    </div>
                                    <div className="flex gap-2 items-start">
                                        <input
                                            type="number"
                                            value={item.amount}
                                            onChange={(e) => updateItem('expenses', item.id, 'amount', e.target.value)}
                                            className="input input-bordered input-sm w-20 bg-base-100 text-error font-bold"
                                        />
                                        <input
                                            type="date"
                                            value={item.date}
                                            onChange={(e) => updateItem('expenses', item.id, 'date', e.target.value)}
                                            className="input input-bordered input-sm w-32 bg-base-100"
                                        />
                                        <select
                                            className="select select-bordered select-sm w-28 bg-base-100"
                                            value={item.category}
                                            onChange={(e) => updateItem('expenses', item.id, 'category', e.target.value)}
                                        >
                                            <option>Housing</option>
                                            <option>Utilities</option>
                                            <option>Food & Dining</option>
                                            <option>Transportation</option>
                                            <option>Health & Medical</option>
                                            <option>Insurance</option>
                                            <option>Personal & Fun</option>
                                            <option>Debt & Loans</option>
                                            <option>Savings & Investing</option>
                                            <option>Giving</option>
                                            <option>Misc</option>
                                        </select>
                                        <button onClick={() => deleteItem('expenses', item.id)} className="btn btn-ghost btn-xs text-error transition-opacity">
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Goals Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-base-200 pb-2">
                                <h4 className="font-bold text-info flex items-center gap-2 text-sm uppercase tracking-wider">
                                    Savings Goals ({extractedItems.goals.length})
                                </h4>
                                <button onClick={() => addItem('goals')} className="btn btn-xs btn-ghost text-info hover:bg-info/10">+ Add</button>
                            </div>
                            {extractedItems.goals.map(item => (
                                <div key={item.id} className="flex flex-col md:flex-row gap-2 p-3 rounded-xl bg-info/5 border border-info/20 shadow-sm transition-colors group">
                                    <input
                                        type="text"
                                        value={item.title}
                                        onChange={(e) => updateItem('goals', item.id, 'title', e.target.value)}
                                        className="input input-bordered input-sm flex-1 font-medium bg-base-100"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={item.amount}
                                            onChange={(e) => updateItem('goals', item.id, 'amount', e.target.value)}
                                            className="input input-bordered input-sm w-24 bg-base-100"
                                        />
                                        <input
                                            type="date"
                                            value={item.date}
                                            onChange={(e) => updateItem('goals', item.id, 'date', e.target.value)}
                                            className="input input-bordered input-sm w-32 bg-base-100"
                                        />
                                        <button onClick={() => deleteItem('goals', item.id)} className="btn btn-ghost btn-xs text-error transition-opacity">
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Budgets Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center border-b border-base-200 pb-2">
                                <h4 className="font-bold text-accent flex items-center gap-2 text-sm uppercase tracking-wider">
                                    Budgets ({extractedItems.budgets.length})
                                </h4>
                                <button onClick={() => addItem('budgets')} className="btn btn-xs btn-ghost text-accent hover:bg-accent/10">+ Add</button>
                            </div>
                            {extractedItems.budgets.map(item => (
                                <div key={item.id} className="flex flex-col md:flex-row gap-2 p-3 rounded-xl bg-accent/5 border border-accent/20 shadow-sm transition-colors group">
                                    <input
                                        type="text"
                                        value={item.category}
                                        placeholder="Category"
                                        onChange={(e) => updateItem('budgets', item.id, 'category', e.target.value)}
                                        className="input input-bordered input-sm flex-1 font-medium bg-base-100"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={item.limit}
                                            onChange={(e) => updateItem('budgets', item.id, 'limit', e.target.value)}
                                            className="input input-bordered input-sm w-24 bg-base-100"
                                        />
                                        <select
                                            className="select select-bordered select-sm w-32 bg-base-100"
                                            value={item.color}
                                            onChange={(e) => updateItem('budgets', item.id, 'color', e.target.value)}
                                        >
                                            <option value="primary">Primary</option>
                                            <option value="secondary">Secondary</option>
                                            <option value="accent">Accent</option>
                                            <option value="info">Info</option>
                                            <option value="success">Success</option>
                                            <option value="warning">Warning</option>
                                            <option value="error">Error</option>
                                        </select>
                                        <button onClick={() => deleteItem('budgets', item.id)} className="btn btn-ghost btn-xs text-error transition-opacity">
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 border-t border-base-200 bg-base-100 flex justify-end gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Discard</button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSaving}
                            className="btn btn-primary px-8"
                        >
                            {isSaving ? 'Saving...' : 'Confirm & Save All'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="text-center space-y-3 py-6">
                <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2 text-primary ring-4 ring-primary/5">
                    <Sparkles size={32} />
                </div>
                <h1 className="text-4xl font-black tracking-tight text-base-content">
                    What's on your money mind?
                </h1>
                <p className="text-lg text-base-content/60 max-w-xl mx-auto leading-relaxed">
                    Just speak or type natively. We'll organize your expenses, income, and budget goals automatically.
                </p>
            </header>

            <div className={`card bg-base-100 shadow-2xl border transition-all duration-300 ${isRecording ? 'border-error ring-4 ring-error/10' : 'border-base-200 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary'}`}>
                <div className="card-body p-0 relative">
                    {/* Voice Recording Indicator Overlay */}
                    {isRecording && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 text-error animate-pulse font-mono text-sm bg-error/10 px-3 py-1 rounded-full pointer-events-none">
                            <div className="w-2 h-2 bg-error rounded-full"></div>
                            Listening...
                        </div>
                    )}

                    <textarea
                        ref={textareaRef}
                        className="textarea textarea-ghost w-full min-h-[250px] text-xl md:text-2xl p-6 md:p-8 focus:outline-none resize-none leading-relaxed placeholder:opacity-30 font-medium"
                        placeholder="Ex: I spent $50 on groceries yesterday and paid the electric bill. Also set aside $200 for my vacation fund..."
                        value={dumpText}
                        onChange={(e) => setDumpText(e.target.value)}
                        onKeyDown={handleKeyDown}
                    ></textarea>

                    {/* Bottom Action Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-base-200 bg-base-50/50 gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button
                                className={`btn btn-circle btn-lg transition-all duration-200 ${isRecording ? 'btn-error scale-110 shadow-lg' : 'btn-ghost hover:bg-base-200 text-base-content/70'}`}
                                onClick={toggleRecording}
                                title={isRecording ? "Stop Recording" : "Start Voice Input"}
                            >
                                {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                            </button>
                            <div className="text-xs text-base-content/40 font-mono hidden md:block">
                                {isSaving ? 'Saving...' : 'Auto-saved'}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <span className="hidden md:flex items-center gap-1 text-xs text-base-content/40 font-bold px-2 py-1 bg-base-200 rounded border border-base-300">
                                <Command size={10} /> + Enter
                            </span>
                            <button
                                className={`btn btn-primary btn-lg gap-3 px-8 flex-1 md:flex-none shadow-primary/30 shadow-lg ${(!dumpText.trim() || isProcessing) && 'btn-disabled opacity-50'}`}
                                onClick={handleExtract}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="loading loading-spinner loading-sm"></div>
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        Process
                                        <Send size={20} className={dumpText.trim() ? "translate-x-1 transition-transform" : ""} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {renderReviewModal()}


            {/* Notification Toast */}
            {notification && (
                <div className="toast toast-end toast-bottom z-[100] p-4">
                    <div className={`alert ${notification.type === 'success' ? 'alert-success' : notification.type === 'info' ? 'alert-info' : 'alert-error'} shadow-2xl border-none text-white animate-in slide-in-from-bottom-5 fade-in duration-300`}>
                        <div className="flex items-center gap-3">
                            {notification.type === 'info' ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : notification.type === 'success' ? (
                                <div className="bg-white/20 p-1 rounded-full"><Save size={18} /></div>
                            ) : (
                                <div className="bg-white/20 p-1 rounded-full"><Sparkles size={18} /></div>
                            )}
                            <span className="font-bold tracking-tight">{notification.message}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MoneyDump;
