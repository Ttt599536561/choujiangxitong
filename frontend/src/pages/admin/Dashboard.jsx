import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { statsApi } from '../../services/adminApi';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await statsApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          加载中...
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: '总用户数',
      value: stats?.totalUsers || 0,
      icon: '👥',
      color: '#38BDF8',
      bgColor: 'rgba(56, 189, 248, 0.1)'
    },
    {
      title: '总抽奖次数',
      value: stats?.totalDraws || 0,
      icon: '🎰',
      color: '#E9A568',
      bgColor: 'rgba(233, 165, 104, 0.1)'
    },
    {
      title: '中奖人数',
      value: stats?.totalWinners || 0,
      icon: '🎉',
      color: '#6EE7B7',
      bgColor: 'rgba(110, 231, 183, 0.1)'
    },
    {
      title: '可用兑换码',
      value: stats?.availableCodes || 0,
      icon: '🎫',
      color: '#A78BFA',
      bgColor: 'rgba(167, 139, 250, 0.1)'
    }
  ];

  return (
    <AdminLayout>
      <div>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            📊 数据概览
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            抽奖系统实时统计数据
          </p>
        </div>

        {/* 统计卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {statCards.map((card, index) => (
            <div
              key={index}
              style={{
                background: 'linear-gradient(135deg, #161D2B 0%, #1E2636 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid rgba(233, 165, 104, 0.2)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: card.bgColor,
                  borderRadius: '12px'
                }}>
                  {card.icon}
                </div>
              </div>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: card.color,
                marginBottom: '0.5rem'
              }}>
                {card.value.toLocaleString()}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                {card.title}
              </div>
            </div>
          ))}
        </div>

        {/* 快速操作 */}
        <div style={{
          background: 'linear-gradient(135deg, #161D2B 0%, #1E2636 100%)',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid rgba(233, 165, 104, 0.2)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '1.5rem'
          }}>
            🚀 快速操作
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <a
              href="/admin/config"
              style={{
                display: 'block',
                padding: '1rem',
                background: 'rgba(233, 165, 104, 0.1)',
                border: '1px solid rgba(233, 165, 104, 0.3)',
                borderRadius: '12px',
                color: '#E9A568',
                textDecoration: 'none',
                fontWeight: '600',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(233, 165, 104, 0.2)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(233, 165, 104, 0.1)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              ⚙️ 配置抽奖规则
            </a>
            <a
              href="/admin/prizes"
              style={{
                display: 'block',
                padding: '1rem',
                background: 'rgba(110, 231, 183, 0.1)',
                border: '1px solid rgba(110, 231, 183, 0.3)',
                borderRadius: '12px',
                color: '#6EE7B7',
                textDecoration: 'none',
                fontWeight: '600',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(110, 231, 183, 0.2)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(110, 231, 183, 0.1)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🏆 管理奖项
            </a>
            <a
              href="/admin/users"
              style={{
                display: 'block',
                padding: '1rem',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '12px',
                color: '#38BDF8',
                textDecoration: 'none',
                fontWeight: '600',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(56, 189, 248, 0.2)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(56, 189, 248, 0.1)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              👥 导入用户
            </a>
            <a
              href="/admin/codes"
              style={{
                display: 'block',
                padding: '1rem',
                background: 'rgba(167, 139, 250, 0.1)',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                borderRadius: '12px',
                color: '#A78BFA',
                textDecoration: 'none',
                fontWeight: '600',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(167, 139, 250, 0.2)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(167, 139, 250, 0.1)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🎫 导入兑换码
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
