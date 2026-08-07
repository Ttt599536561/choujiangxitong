import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../services/adminApi';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authApi.logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', label: '概览', icon: '📊' },
    { path: '/admin/config', label: '配置', icon: '⚙️' },
    { path: '/admin/prizes', label: '奖项', icon: '🏆' },
    { path: '/admin/users', label: '用户', icon: '👥' },
    { path: '/admin/codes', label: '兑换码', icon: '🎫' },
    { path: '/admin/records', label: '记录', icon: '📝' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <aside style={{
        width: '250px',
        background: 'linear-gradient(180deg, #161D2B 0%, #0F131C 100%)',
        borderRight: '1px solid rgba(233, 165, 104, 0.2)',
        padding: '2rem 0',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{
          padding: '0 1.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #E9A568 0%, #FFD700 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🎰 管理后台
          </h2>
        </div>

        {/* 导航菜单 */}
        <nav>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.875rem 1.5rem',
                  color: isActive ? '#E9A568' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: isActive ? '600' : '400',
                  background: isActive ? 'rgba(233, 165, 104, 0.1)' : 'transparent',
                  borderLeft: isActive ? '3px solid #E9A568' : '3px solid transparent',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.background = 'rgba(233, 165, 104, 0.05)';
                    e.target.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span style={{ marginRight: '0.75rem', fontSize: '1.25rem' }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 返回首页 & 退出登录 */}
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          width: '250px',
          padding: '0 1.5rem'
        }}>
          <Link
            to="/"
            style={{
              display: 'block',
              padding: '0.875rem 1rem',
              marginBottom: '0.5rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              textAlign: 'center',
              background: 'rgba(22, 29, 43, 0.5)',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(233, 165, 104, 0.1)';
              e.target.style.color = '#E9A568';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(22, 29, 43, 0.5)';
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            🏠 返回首页
          </Link>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              color: '#DC2626',
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(220, 38, 38, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(220, 38, 38, 0.1)';
            }}
          >
            🚪 退出登录
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main style={{
        marginLeft: '250px',
        flex: 1,
        padding: '2rem',
        minHeight: '100vh'
      }}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
