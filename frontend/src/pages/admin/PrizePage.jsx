import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import { prizeApi, iconApi } from '../../services/adminApi';
import { useCurrencySymbol } from '../../hooks/useCurrencySymbol';

const PrizePage = () => {
  const currencySymbol = useCurrencySymbol();
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const iconFileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    prize_name: '',
    prize_amount: 0,
    prize_icon: '🎁',
    win_rate: 0,
    level: 0,
    is_thanks: false
  });

  const iconOptions = ['💎', '🏆', '💰', '🎁', '✨', '⭐️', '🎉', '🎊', '😊', '🌟'];

  useEffect(() => {
    loadPrizes();
  }, []);

  const loadPrizes = async () => {
    try {
      const response = await prizeApi.getPrizes();
      setPrizes(response.data);
    } catch (error) {
      console.error('加载奖项失败:', error);
      setMessage({ type: 'error', text: '加载奖项失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (prize = null) => {
    if (prize) {
      setEditingPrize(prize);
      setFormData({
        prize_name: prize.prize_name,
        prize_amount: prize.prize_amount,
        prize_icon: prize.prize_icon,
        win_rate: prize.win_rate,
        level: prize.level,
        is_thanks: Boolean(prize.is_thanks)
      });
    } else {
      setEditingPrize(null);
      setFormData({
        prize_name: '',
        prize_amount: 0,
        prize_icon: '🎁',
        win_rate: 0,
        level: 0,
        is_thanks: false
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPrize(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      if (editingPrize) {
        await prizeApi.updatePrize(editingPrize.id, formData);
        setMessage({ type: 'success', text: '奖项更新成功！' });
      } else {
        await prizeApi.addPrize(formData);
        setMessage({ type: 'success', text: '奖项添加成功！' });
      }
      handleCloseModal();
      loadPrizes();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('保存奖项失败:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || '操作失败' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个奖项吗？')) return;

    try {
      await prizeApi.deletePrize(id);
      setMessage({ type: 'success', text: '奖项删除成功！' });
      loadPrizes();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('删除奖项失败:', error);
      setMessage({ type: 'error', text: '删除失败' });
    }
  };

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true);
    try {
      const response = await iconApi.uploadIcon(file);
      setFormData(prev => ({ ...prev, prize_icon: response.data.url }));
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'SVG 上传失败' });
    } finally {
      setUploadingIcon(false);
      e.target.value = '';
    }
  };

  const totalRate = prizes.reduce((sum, prize) => sum + prize.win_rate, 0);

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
              🏆 奖项管理
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              配置奖项信息和中奖概率（总概率：{totalRate}%）
              {totalRate !== 100 && (
                <span style={{ color: '#DC2626', marginLeft: '0.5rem' }}>
                  ⚠️ 注意：概率总和应为 100%
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
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
            ➕ 添加奖项
          </button>
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

        {/* 奖项列表 */}
        <div style={{
          background: 'linear-gradient(135deg, #161D2B 0%, #1E2636 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(233, 165, 104, 0.2)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(233, 165, 104, 0.1)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>图标</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>奖项名称</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>奖金金额</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>中奖率</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>等级</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>类型</th>
                <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-primary)', fontWeight: '600' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {prizes.map((prize) => (
                <tr
                  key={prize.id}
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
                  <td style={{ padding: '1rem' }}>
                    {prize.prize_icon && (prize.prize_icon.startsWith('/') || prize.prize_icon.startsWith('http'))
                      ? <img src={prize.prize_icon} alt="" style={{ width: '2rem', height: '2rem', objectFit: 'contain' }} />
                      : <span style={{ fontSize: '2rem' }}>{prize.prize_icon}</span>}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                    {prize.prize_name}
                  </td>
                  <td style={{ padding: '1rem', color: '#E9A568', fontWeight: '600' }}>
                    {prize.is_thanks ? '-' : `${currencySymbol}${prize.prize_amount}`}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                    {prize.win_rate}%
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {prize.level}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: prize.is_thanks ? 'rgba(148, 163, 184, 0.1)' : 'rgba(233, 165, 104, 0.1)',
                      color: prize.is_thanks ? 'var(--text-secondary)' : '#E9A568'
                    }}>
                      {prize.is_thanks ? '谢谢参与' : '实物奖品'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleOpenModal(prize)}
                      style={{
                        padding: '0.5rem 1rem',
                        marginRight: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#38BDF8',
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(prize.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        color: '#DC2626',
                        background: 'rgba(220, 38, 38, 0.1)',
                        border: '1px solid rgba(220, 38, 38, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {prizes.length === 0 && (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              暂无奖项，点击"添加奖项"按钮创建
            </div>
          )}
        </div>

        {/* 添加/编辑模态框 */}
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
              border: '2px solid rgba(233, 165, 104, 0.3)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '1.5rem'
              }}>
                {editingPrize ? '编辑奖项' : '添加奖项'}
              </h2>

              <form onSubmit={handleSubmit}>
                {/* 奖项名称 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    奖项名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.prize_name}
                    onChange={(e) => setFormData({ ...formData, prize_name: e.target.value })}
                    required
                    placeholder="例如：一等奖"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      fontSize: '1rem',
                      borderRadius: '12px',
                      border: '2px solid rgba(233, 165, 104, 0.3)',
                      background: '#0F131C',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* 选择图标 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    图标 *
                  </label>

                  {/* 当前图标预览 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                    padding: '0.625rem 1rem',
                    background: '#0F131C',
                    borderRadius: '10px',
                    border: '1px solid rgba(233, 165, 104, 0.2)'
                  }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>当前：</span>
                    {formData.prize_icon && (formData.prize_icon.startsWith('/') || formData.prize_icon.startsWith('http'))
                      ? <img src={formData.prize_icon} alt="" style={{ width: '2.5rem', height: '2.5rem', objectFit: 'contain' }} />
                      : <span style={{ fontSize: '2.5rem' }}>{formData.prize_icon}</span>}
                  </div>

                  {/* 预设 Emoji */}
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>预设图标</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '0.875rem' }}>
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, prize_icon: icon })}
                        style={{
                          padding: '0.75rem',
                          fontSize: '2rem',
                          background: formData.prize_icon === icon ? 'rgba(233, 165, 104, 0.2)' : '#0F131C',
                          border: `2px solid ${formData.prize_icon === icon ? '#E9A568' : 'rgba(233, 165, 104, 0.3)'}`,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>

                  {/* SVG 上传 */}
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>或上传自定义 SVG</p>
                  <input
                    ref={iconFileInputRef}
                    type="file"
                    accept=".svg,image/svg+xml"
                    style={{ display: 'none' }}
                    onChange={handleIconUpload}
                  />
                  <button
                    type="button"
                    disabled={uploadingIcon}
                    onClick={() => iconFileInputRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      color: uploadingIcon ? 'var(--text-secondary)' : '#38BDF8',
                      background: 'rgba(56, 189, 248, 0.07)',
                      border: '1.5px dashed rgba(56, 189, 248, 0.4)',
                      borderRadius: '10px',
                      cursor: uploadingIcon ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {uploadingIcon ? '上传中…' : '📁 选择 SVG 文件（最大 1 MB）'}
                  </button>
                </div>

                {/* 是否为谢谢参与 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.is_thanks}
                      onChange={(e) => setFormData({ ...formData, is_thanks: e.target.checked })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      这是"谢谢参与"选项（不发放兑换码）
                    </span>
                  </label>
                </div>

                {/* 奖金金额 */}
                {!formData.is_thanks && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem'
                    }}>
                      奖金金额（{currencySymbol}）*
                    </label>
                    <input
                      type="number"
                      value={formData.prize_amount}
                      onChange={(e) => setFormData({ ...formData, prize_amount: parseFloat(e.target.value) })}
                      required
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        fontSize: '1rem',
                        borderRadius: '12px',
                        border: '2px solid rgba(233, 165, 104, 0.3)',
                        background: '#0F131C',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}

                {/* 中奖率 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    中奖率（%）*
                  </label>
                  <input
                    type="number"
                    value={formData.win_rate}
                    onChange={(e) => setFormData({ ...formData, win_rate: parseFloat(e.target.value) })}
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      fontSize: '1rem',
                      borderRadius: '12px',
                      border: '2px solid rgba(233, 165, 104, 0.3)',
                      background: '#0F131C',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* 等级 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    等级（数字越小等级越高）*
                  </label>
                  <input
                    type="number"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                    required
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      fontSize: '1rem',
                      borderRadius: '12px',
                      border: '2px solid rgba(233, 165, 104, 0.3)',
                      background: '#0F131C',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
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
                    {editingPrize ? '保存' : '添加'}
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

export default PrizePage;
