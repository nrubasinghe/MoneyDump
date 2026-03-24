import React, { useState, useEffect } from 'react';
import { Palette, Moon, Sun, Monitor, Bell, Save, Shield } from 'lucide-react';

const Settings = () => {
    const [currentTheme, setCurrentTheme] = useState('dark');

    // Available DaisyUI themes
    const themes = [
        { name: 'light', label: 'Light', icon: <Sun size={20} /> },
        { name: 'dark', label: 'Dark', icon: <Moon size={20} /> },
        { name: 'emerald', label: 'Emerald', icon: <Palette size={20} /> },
        { name: 'synthwave', label: 'Synthwave', icon: <Palette size={20} /> },
        { name: 'retro', label: 'Retro', icon: <Palette size={20} /> },
        { name: 'cyberpunk', label: 'Cyberpunk', icon: <Palette size={20} /> },
    ];

    // Load theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setCurrentTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    // Handle theme change
    const handleThemeChange = (themeName) => {
        setCurrentTheme(themeName);
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('theme', themeName);
    };

    const [ragProvider, setRagProvider] = useState('gemini');
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        const savedProvider = localStorage.getItem('ragProvider') || 'gemini';
        const savedKey = localStorage.getItem('apiKey') || '';
        setRagProvider(savedProvider);
        setApiKey(savedKey);
    }, []);

    const handleSaveRagSettings = () => {
        localStorage.setItem('ragProvider', ragProvider);
        localStorage.setItem('apiKey', apiKey);
        alert('AI Settings Saved!');
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <header>
                <h1 className="text-4xl font-black mb-2 text-base-content">Settings</h1>
                <p className="text-base-content/60 text-lg">
                    Customize your MoneyDump experience.
                </p>
            </header>

            {/* Theme Settings */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Palette className="text-primary" size={28} />
                        <div>
                            <h2 className="text-2xl font-bold">Theme</h2>
                            <p className="text-base-content/60">Choose your preferred color scheme</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {themes.map((theme) => (
                            <button
                                key={theme.name}
                                onClick={() => handleThemeChange(theme.name)}
                                className={`
                  card border transition-all duration-200 hover:scale-105 active:scale-95
                  ${currentTheme === theme.name
                                        ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20'
                                        : 'border-base-200 hover:border-primary/50 hover:bg-base-200/50'
                                    }
                `}
                            >
                                <div className="card-body p-4 flex flex-row items-center gap-3">
                                    <div className={`
                    ${currentTheme === theme.name ? 'text-primary' : 'text-base-content/70'}
                  `}>
                                        {theme.icon}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h3 className="font-semibold text-lg">{theme.label}</h3>
                                        <p className="text-xs text-base-content/50 capitalize">{theme.name}</p>
                                    </div>
                                    {currentTheme === theme.name && (
                                        <div className="badge badge-primary badge-sm">Active</div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Integration Settings */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Monitor className="text-accent" size={24} />
                        AI Integration (RAG)
                    </h2>
                    <p className="text-base-content/60 mb-6">Configure the AI provider for your financial brain dump.</p>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-semibold">AI Provider</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={ragProvider}
                                onChange={(e) => setRagProvider(e.target.value)}
                            >
                                <option value="gemini">Google Gemini</option>
                                <option value="openai">OpenAI (GPT-4)</option>
                                <option value="anthropic">Anthropic Claude</option>
                                <option value="local">Local LLM (Ollama)</option>
                            </select>
                        </div>

                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-semibold">API Key</span>
                            </label>
                            <input
                                type="password"
                                placeholder="Enter your API Key here"
                                className="input input-bordered w-full font-mono"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <label className="label">
                                <span className="label-text-alt text-base-content/50">Keys are stored locally in your browser.</span>
                            </label>
                        </div>
                    </div>

                    <div className="card-actions justify-end mt-4">
                        <button className="btn btn-primary" onClick={handleSaveRagSettings}>
                            <Save size={18} />
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>

            {/* Additional Settings Sections */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Shield className="text-secondary" size={24} />
                        Preferences
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-base-200/50 border border-base-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-base-300 rounded-lg">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Notifications</h3>
                                    <p className="text-sm text-base-content/60">Enable budget alerts & reminders</p>
                                </div>
                            </div>
                            <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-base-200/50 border border-base-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-base-300 rounded-lg">
                                    <Save size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Auto-save</h3>
                                    <p className="text-sm text-base-content/60">Automatically save MoneyDump entries</p>
                                </div>
                            </div>
                            <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                        </div>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body p-6">
                    <h2 className="text-2xl font-bold mb-4">About</h2>
                    <div className="space-y-2 text-base-content/70">
                        <p><strong>MoneyDump</strong> - AI-Powered Budget & Expense Management</p>
                        <p className="text-sm">Version 1.0.0 (MSc Project Release)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
