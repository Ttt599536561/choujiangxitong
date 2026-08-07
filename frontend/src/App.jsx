import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ConfigPage from './pages/admin/ConfigPage';
import PrizePage from './pages/admin/PrizePage';
import UserPage from './pages/admin/UserPage';
import CodePage from './pages/admin/CodePage';
import RecordsPage from './pages/admin/RecordsPage';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/config" element={<ConfigPage />} />
        <Route path="/admin/prizes" element={<PrizePage />} />
        <Route path="/admin/users" element={<UserPage />} />
        <Route path="/admin/codes" element={<CodePage />} />
        <Route path="/admin/records" element={<RecordsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
