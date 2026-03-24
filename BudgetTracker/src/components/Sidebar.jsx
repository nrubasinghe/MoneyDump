import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { PenTool, CreditCard, LayoutDashboard, Calendar, TrendingUp, Settings, LogOut, Menu, X, BookOpen } from 'lucide-react';
import { authService } from '../services/api';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { name: 'MoneyDump', icon: <PenTool size={20} />, path: '/' },
        { name: 'Transactions', icon: <CreditCard size={20} />, path: '/transactions' },
        { name: 'Budget Board', icon: <LayoutDashboard size={20} />, path: '/budget-board' },
        { name: 'Savings & Goals', icon: <TrendingUp size={20} />, path: '/goals' },
        { name: 'Analysis', icon: <TrendingUp size={20} />, path: '/analysis' },
        { name: 'Wealth Wisdom', icon: <BookOpen size={20} />, path: '/wealth-wisdom' },
        { name: 'Calendar', icon: <Calendar size={20} />, path: '/calendar' },
    ];

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 btn btn-square btn-ghost"
                onClick={toggleSidebar}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        h-screen w-64 bg-base-100 border-r border-base-300 
        flex flex-col justify-between p-4
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div>
                    <div className="flex items-center gap-2 mb-8 px-2 mt-12 lg:mt-0">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-content font-bold text-xl">
                            MD
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">MoneyDump</h1>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive
                                        ? 'bg-primary text-primary-content shadow-md'
                                        : 'hover:bg-base-200 text-base-content/70 hover:text-base-content'
                                    }`
                                }
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="border-t border-base-300 pt-4">
                    <NavLink
                        to="/settings"
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-200 font-medium ${isActive
                                ? 'bg-primary text-primary-content shadow-md'
                                : 'hover:bg-base-200 text-base-content/70 hover:text-base-content'
                            }`
                        }
                    >
                        <Settings size={20} />
                        <span>Settings</span>
                    </NavLink>
                    <button
                        onClick={() => authService.logout()}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-error/10 text-error hover:text-error-content transition-all duration-200 font-medium mt-1"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
