import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { recordsApi } from '../../services/adminApi';

const RecordsPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, winner, thanks

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const response = await recordsApi.getRecords();
      setRecords(response.data);
    } catch (error) {
      console.error('加载抽奖记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    if (filterType === 'all') return true;
    if (filterType === 'winner') return !record.is_thanks;
    if (filterType === 'thanks') return record.is_thanks;
    return true;
  });

  const stats = {
    total: records.length,
    winners: records.filter(r => !r.is_thanks).length,
    thanks: records.filter(r => r.is_thanks).length
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

  return (
    <AdminLayout>
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}>
              📝 抽奖记录
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              查看所有抽奖历史记录（共 {stats.total} 次，中奖 {stats.winners} 次，未中奖 {stats.thanks} 次）
            </p>
          </div>
        </div>

        {/* 筛选按钮 */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => setFilterType('all')}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: filterType === 'all' ? 'white' : 'var(--text-secondary)',
              background: filterType === 'all'
                ? 'linear-gradient(135deg, #E9A568 0%, #d89558 100%)'
                : 'rgba(148, 163, 184, 0.1)',
              border: `1px solid ${filterType === 'all' ? '#E9A568' : 'rgba(148, 163, 184, 0.3)'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            全部记录 ({stats.total})
          </button>
          <button
            onClick={() => setFilterType('winner')}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: filterType === 'winner' ? 'white' : '#6EE7B7',
              background: filterType === 'winner'
                ? 'linear-gradient(135deg, #6EE7B7 0%, #5dd4a6 100%)'
                : 'rgba(110, 231, 183, 0.1)',
              border: `1px solid ${filterType === 'winner' ? '#6EE7B7' : 'rgba(110, 231, 183, 0.3)'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            中奖记录 ({stats.winners})
          </button>
          <button
            onClick={() => setFilterType('thanks')}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: filterType === 'thanks' ? 'white' : 'var(--text-secondary)',
              background: filterType === 'thanks'
                ? 'linear-gradient(135deg, #94A3B8 0%, #7c8a9f 100%)'
                : 'rgba(148, 163, 184, 0.1)',
              border: `1px solid ${filterType === 'thanks' ? '#94A3B8' : 'rgba(148, 163, 184, 0.3)'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            谢谢参与 ({stats.thanks})
          </button>
        </div>

        {/* 抽奖记录列表 */}
        <div style={{
          background: 'linear-gradient(135deg, #161D2B 0%, #1E2636 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(233, 165, 104, 0.2)',
          overflow: 'hidden'
        }}>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'rgba(233, 165, 104, 0.1)', zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>ID</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>邮箱</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>中奖奖项</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>奖金金额</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>兑换码</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>抽奖时间</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    style={{
                      borderBottom: '1px solid rgba(233, 165, 104, 0.1)',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(233, 165, 104, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      #{record.id}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {record.email}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{record.prize_icon}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                          {record.prize_name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {record.is_thanks ? (
                        <span style={{ color: 'var(--text-secondary)' }}>-</span>
                      ) : (
                        <span style={{ color: '#E9A568', fontWeight: '600' }}>
                          ¥{record.prize_amount}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {record.redemption_code ? (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          fontWeight: '600',
                          background: 'rgba(110, 231, 183, 0.1)',
                          color: '#6EE7B7',
                          border: '1px solid rgba(110, 231, 183, 0.3)'
                        }}>
                          {record.redemption_code}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {new Date(record.draw_time).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              暂无抽奖记录
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default RecordsPage;
