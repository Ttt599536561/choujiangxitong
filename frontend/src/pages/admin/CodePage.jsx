import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { codeApi, prizeApi } from '../../services/adminApi';

const CodePage = () => {
  const [codes, setCodes] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, issued

  const [formData, setFormData] = useState({
    code: '',
    prize_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [codesRes, prizesRes] = await Promise.all([
        codeApi.getCodes(),
        prizeApi.getPrizes()
      ]);
      setCodes(codesRes.data);
      setPrizes(prizesRes.data.filter(p => !p.is_thanks)); // 只显示非"谢谢参与"的奖项
    } catch (error) {
      console.error('加载数据失败:', error);
      setMessage({ type: 'error', text: '加载数据失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      code: '',
      prize_id: prizes.length > 0 ? prizes[0].id : ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      await codeApi.addCode(formData);
      setMessage({ type: 'success', text: '兑换码添加成功！' });
      handleCloseModal();
      loadData();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('添加兑换码失败:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || '操作失败' });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validExt = ['.csv', '.xlsx', '.xls'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExt.includes(fileExt)) {
      setMessage({ type: 'error', text: '请上传 CSV 或 Excel（.xlsx/.xls）文件' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await codeApi.importCodes(file);
      setMessage({
        type: 'success',
        text: `导入成功！共导入 ${response.data.imported} 个兑换码（总数 ${response.data.total}）`
      });
      loadData();
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      console.error('导入失败:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || '导入失败' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const csvContent = `code,prize_id\nCODE001,1\nCODE002,1\nCODE003,2\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'codes_template.csv';
    link.click();
  };

  const filteredCodes = codes.filter(code => {
    if (filterStatus === 'all') return true;
    return code.status === filterStatus;
  });

  const stats = {
    total: codes.length,
    pending: codes.filter(c => c.status === 'pending').length,
    issued: codes.filter(c => c.status === 'issued').length
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
              🎫 兑换码管理
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              管理兑换码库存（共 {stats.total} 个，可用 {stats.pending} 个，已发放 {stats.issued} 个）
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={downloadTemplate}
              style={{
                padding: '0.875rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#38BDF8',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              📥 下载模板
            </button>
            <label
              style={{
                padding: '0.875rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#6EE7B7',
                background: 'rgba(110, 231, 183, 0.1)',
                border: '1px solid rgba(110, 231, 183, 0.3)',
                borderRadius: '12px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}
            >
              {uploading ? '📤 上传中...' : '📤 批量导入'}
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
            <button
              onClick={handleOpenModal}
              style={{
                padding: '0.875rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: 'white',
                background: 'linear-gradient(135deg, #E9A568 0%, #d89558 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 30px rgba(233, 165, 104, 0.3)'
              }}
            >
              ➕ 添加兑换码
            </button>
          </div>
        </div>

        {message.text && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            background: message.type === 'success'
              ? 'rgba(110, 231, 183, 0.1)'
              : 'rgba(220, 38, 38, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(110, 231, 183, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
            borderRadius: '12px',
            color: message.type === 'success' ? '#6EE7B7' : '#DC2626'
          }}>
            {message.text}
          </div>
        )}

        {/* CSV 格式说明 */}
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '12px',
          color: '#38BDF8',
          fontSize: '0.875rem'
        }}>
          💡 支持 CSV / Excel（.xlsx/.xls）格式，第一行为标题（code,prize_id），prize_id 对应奖项的 ID 编号
        </div>

        {/* 筛选按钮 */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => setFilterStatus('all')}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: filterStatus === 'all' ? 'white' : 'var(--text-secondary)',
              background: filterStatus === 'all'
                ? 'linear-gradient(135deg, #E9A568 0%, #d89558 100%)'
                : 'rgba(148, 163, 184, 0.1)',
              border: `1px solid ${filterStatus === 'all' ? '#E9A568' : 'rgba(148, 163, 184, 0.3)'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            全部 ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: filterStatus === 'pending' ? 'white' : '#6EE7B7',
              background: filterStatus === 'pending'
                ? 'linear-gradient(135deg, #6EE7B7 0%, #5dd4a6 100%)'
                : 'rgba(110, 231, 183, 0.1)',
              border: `1px solid ${filterStatus === 'pending' ? '#6EE7B7' : 'rgba(110, 231, 183, 0.3)'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            待发放 ({stats.pending})
          </button>
          <button
            onClick={() => setFilterStatus('issued')}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: filterStatus === 'issued' ? 'white' : 'var(--text-secondary)',
              background: filterStatus === 'issued'
                ? 'linear-gradient(135deg, #94A3B8 0%, #7c8a9f 100%)'
                : 'rgba(148, 163, 184, 0.1)',
              border: `1px solid ${filterStatus === 'issued' ? '#94A3B8' : 'rgba(148, 163, 184, 0.3)'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            已发放 ({stats.issued})
          </button>
        </div>

        {/* 兑换码列表 */}
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
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>兑换码</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>对应奖项</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>奖金</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>状态</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>发放给</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>发放时间</th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.map((code) => (
                  <tr
                    key={code.id}
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
                      #{code.id}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: '600' }}>
                      {code.code}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                      {code.prize_name}
                    </td>
                    <td style={{ padding: '1rem', color: '#E9A568', fontWeight: '600' }}>
                      ¥{code.prize_amount}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: code.status === 'pending' ? 'rgba(110, 231, 183, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                        color: code.status === 'pending' ? '#6EE7B7' : 'var(--text-secondary)'
                      }}>
                        {code.status === 'pending' ? '待发放' : '已发放'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {code.issued_to || '-'}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {code.issued_at ? new Date(code.issued_at).toLocaleString('zh-CN') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCodes.length === 0 && (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              暂无兑换码，点击"添加兑换码"或"批量导入"按钮添加
            </div>
          )}
        </div>

        {/* 添加模态框 */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={handleCloseModal}
          >
            <div style={{
              background: 'linear-gradient(135deg, #161D2B 0%, #1E2636 100%)',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              border: '2px solid rgba(233, 165, 104, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '1.5rem'
              }}>
                添加兑换码
              </h2>

              <form onSubmit={handleSubmit}>
                {/* 兑换码 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    兑换码 *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    placeholder="例如：ABC123XYZ"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      fontSize: '1rem',
                      borderRadius: '12px',
                      border: '2px solid rgba(233, 165, 104, 0.3)',
                      background: '#0F131C',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                {/* 对应奖项 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    对应奖项 *
                  </label>
                  <select
                    value={formData.prize_id}
                    onChange={(e) => setFormData({ ...formData, prize_id: parseInt(e.target.value) })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      fontSize: '1rem',
                      borderRadius: '12px',
                      border: '2px solid rgba(233, 165, 104, 0.3)',
                      background: '#0F131C',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {prizes.map((prize) => (
                      <option key={prize.id} value={prize.id}>
                        {prize.prize_name} (¥{prize.prize_amount})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 按钮 */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '0.875rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'white',
                      background: 'linear-gradient(135deg, #E9A568 0%, #d89558 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    添加
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    style={{
                      flex: 1,
                      padding: '0.875rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      background: 'rgba(148, 163, 184, 0.1)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CodePage;
