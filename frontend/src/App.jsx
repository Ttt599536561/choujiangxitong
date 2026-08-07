import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ConfigPage from './pages/admin/ConfigPage';
import PrizePage from './pages/admin/PrizePage';
import UserPage from './pages/admin/UserPage';
import CodePage from './pages/admin/CodePage';
import RecordsPage from './pages/admin/RecordsPage';
import ChangePassword from './pages/admin/ChangePassword';
import DecoyPage from './pages/admin/DecoyPage';
import './index.css';

/**
 * 按路由切换标签页图标和标题
 * 用户端是老虎机图标，后台是齿轮图标，两个标签页同时开着也能一眼分清
 */
const DocumentHead = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const isAdmin = pathname.startsWith('/admin');
    document.title = isAdmin ? '⚙️ 抽奖后台管理' : '🎰 幸运大抽奖';

    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      document.head.appendChild(link);
    }
    link.href = isAdmin ? '/favicon-admin.svg' : '/favicon.svg';
  }, [pathname]);

  return null;
};

function App() {
  return (
    <Router>
      <DocumentHead />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/config" element={<ConfigPage />} />
        <Route path="/admin/prizes" element={<PrizePage />} />
        <Route path="/admin/users" element={<UserPage />} />
        <Route path="/admin/codes" element={<CodePage />} />
        <Route path="/admin/records" element={<RecordsPage />} />
        <Route path="/admin/change-password" element={<ChangePassword />} />
        <Route path="/admin/decoys" element={<DecoyPage />} />
      </Routes>
    </Router>
  );
}

export default App;
