import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import MoneyDump from './pages/MoneyDump';
import Transactions from './pages/Transactions';
import BudgetBoard from './pages/BudgetBoard';
import Calendar from './pages/Calendar';
import SavingsGoals from './pages/SavingsGoals';
import Settings from './pages/Settings';
import BudgetAnalysis from './pages/BudgetAnalysis';
import WealthWisdom from './pages/WealthWisdom';
import NotFound from './pages/NotFound';
import Login from './pages/Login';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null') {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {
  useEffect(() => {
    // Globally sync theme on app boot
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<MoneyDump />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="analysis" element={<BudgetAnalysis />} />
            <Route path="budget-board" element={<BudgetBoard />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="goals" element={<SavingsGoals />} />
            <Route path="wealth-wisdom" element={<WealthWisdom />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
