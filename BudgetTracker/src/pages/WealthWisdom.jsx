import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Search, Send, Loader2, Sparkles, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { aiService } from '../services/api';

const WealthWisdom = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversation, setConversation] = useState([]);
    const [notification, setNotification] = useState(null);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation]);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        if (type !== 'info') {
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const handleQuery = async (e) => {
        e.preventDefault();
        if (!query.trim() || loading) return;

        const userQuery = query.trim();
        setQuery('');
        setConversation(prev => [...prev, { role: 'user', content: userQuery }]);
        setLoading(true);
        showNotification("Consulting Financial Knowledge Base...", "info");

        try {
            const data = await aiService.getAdvice(userQuery);
            setConversation(prev => [...prev, { role: 'assistant', content: data.answer }]);
            setNotification(null);
        } catch (err) {
            console.error("Error getting advice:", err);
            showNotification("Failed to connect to Knowledge Base", "error");
        } finally {
            setLoading(false);
        }
    };

    const bookBadges = [
        { name: "Dave Ramsey", title: "Total Money Makeover", color: "bg-blue-600" },
        { name: "Ramit Sethi", title: "I Will Teach You to Be Rich", color: "bg-orange-600" },
        { name: "Vicki Robin", title: "Your Money or Your Life", color: "bg-purple-600" },
        { name: "Stanley", title: "Millionaire Next Door", color: "bg-emerald-600" },
        { name: "YNAB", title: "You Need A Budget", color: "bg-red-600" }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
                <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-2 text-center md:text-left">
                        <h1 className="text-4xl font-black tracking-tight text-base-content flex items-center justify-center md:justify-start gap-3">
                            <BookOpen className="text-primary" size={36} />
                            Wealth Wisdom <span className="text-primary">RAG</span>
                        </h1>
                        <p className="text-base-content/60 font-medium max-w-md">
                            Ask questions powered by the world's most influential personal finance bestsellers.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                        {bookBadges.map((book) => (
                            <div key={book.name} className="flex flex-col items-center">
                                <div className={`badge badge-lg border-none text-white font-bold py-3 ${book.color} shadow-lg shadow-${book.color.split('-')[1]}/20`}>
                                    {book.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="card bg-base-100 shadow-xl border border-base-200 h-[600px] flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-base-300">
                    {conversation.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                            <Sparkles size={64} className="text-primary animate-pulse" />
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold">Your AI Financial Advisor</h2>
                                <p className="max-w-xs">"What is the Debt Snowball?" or "Explain the Crossover Point."</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl text-left">
                                <div className="p-4 bg-base-200 rounded-xl space-y-2">
                                    <ShieldCheck className="text-info" size={20} />
                                    <h3 className="font-bold text-sm">Safe & Proven</h3>
                                    <p className="text-xs">Advice synthesized from verified financial bestsellers.</p>
                                </div>
                                <div className="p-4 bg-base-200 rounded-xl space-y-2">
                                    <Zap className="text-warning" size={20} />
                                    <h3 className="font-bold text-sm">Action Oriented</h3>
                                    <p className="text-xs">Focus on practical steps like automation and baby steps.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        conversation.map((msg, idx) => (
                            <div key={idx} className={`chat ${msg.role === 'user' ? 'chat-end' : 'chat-start'} animate-in slide-in-from-bottom-2`}>
                                <div className={`chat-bubble shadow-md ${msg.role === 'user' ? 'chat-bubble-primary' : 'bg-base-200 text-base-content'} max-w-[85%] leading-relaxed p-4`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-headings:mb-2 prose-headings:mt-4 max-w-none">
                                            {/* Simple markdown parsing for the demonstration */}
                                            {msg.content.split('\n').map((line, i) => {
                                                if (line.startsWith('###')) return <h3 key={i} className="text-lg font-bold">{line.replace('###', '')}</h3>;
                                                if (line.startsWith('##')) return <h2 key={i} className="text-xl font-bold">{line.replace('##', '')}</h2>;
                                                if (line.startsWith('**')) return <p key={i}><strong>{line.replace(/\*\*/g, '')}</strong></p>;
                                                if (line.startsWith('-')) return <li key={i} className="ml-4">{line.replace('-', '')}</li>;
                                                return <p key={i}>{line}</p>;
                                            })}
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="chat chat-start animate-pulse">
                            <div className="chat-bubble bg-base-200 text-base-content flex items-center gap-3">
                                <Loader2 className="animate-spin" size={16} />
                                Thinking with expert knowledge...
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Bar */}
                <form onSubmit={handleQuery} className="p-4 bg-base-200/50 border-t border-base-200">
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Ask about saving strategies, debt, or money psychology..."
                            className="input input-lg w-full pr-16 shadow-inner focus:ring-2 focus:ring-primary transition-all border-base-300"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className={`btn btn-primary btn-square btn-lg absolute right-0 top-0 rounded-l-none ${loading && 'loading'}`}
                            disabled={!query.trim() || loading}
                        >
                            <Send size={24} />
                        </button>
                    </div>
                </form>
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
        </div>
    );
};

export default WealthWisdom;
