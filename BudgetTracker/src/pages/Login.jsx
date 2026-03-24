import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Wallet, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await authService.login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-300 flex items-center justify-center p-4">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-primary rounded-[1.8rem] flex items-center justify-center text-primary-content shadow-2xl shadow-primary/40 mb-4 rotate-3">
                        <Wallet size={36} />
                    </div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-base-content">MoneyDump</h1>
                    <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] mt-2">Premium Capital Management</p>
                </div>

                {/* Login Card */}
                <div className="bg-base-100 rounded-[3rem] p-8 md:p-12 shadow-2xl border border-base-200">
                    <div className="mb-8">
                        <h2 className="text-2xl font-black tracking-tight uppercase italic">Welcome Back</h2>
                        <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1">Initialize your session</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-black uppercase text-[10px] tracking-widest opacity-40">Email Address</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-base-content/30">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    placeholder="commander@economy.net"
                                    className="input input-bordered w-full h-14 pl-12 rounded-2xl font-bold transition-all focus:border-primary border-base-200 bg-base-200/30"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-black uppercase text-[10px] tracking-widest opacity-40">Security Code</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-base-content/30">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="input input-bordered w-full h-14 pl-12 rounded-2xl font-bold transition-all focus:border-primary border-base-200 bg-base-200/30"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-error rounded-2xl py-3 px-4 shadow-lg shadow-error/10 border-none animate-in slide-in-from-top-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-error-content">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full h-14 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/20 border-none group mt-4"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Authorize Session
                                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-base-200 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-30 px-6 leading-relaxed">
                            Access restricted to authorized personnel.
                            Unauthorized access is tracked and recorded.
                        </p>
                    </div>
                </div>

                {/* Demo Credentials Hint */}
                <div className="mt-8 text-center bg-base-100/50 backdrop-blur-md rounded-2xl py-3 px-6 border border-base-200/50 max-w-[280px] mx-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mr-2">Demo:</span>
                    <span className="text-[10px] font-mono font-black text-primary uppercase">user@example.com / password123</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
