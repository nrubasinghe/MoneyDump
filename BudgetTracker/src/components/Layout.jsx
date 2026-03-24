import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    const location = useLocation();

    // Check if we need full width layout for specific pages (like boards)
    const isFullWidthPage = location.pathname === '/budget-board';

    return (
        <div className="flex h-screen bg-base-200 font-sans overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 lg:p-8 pt-16 lg:pt-8 w-full">
                <div className={isFullWidthPage ? "w-full" : "max-w-5xl mx-auto"}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
