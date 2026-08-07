import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { configApi } from '../../services/adminApi';

const ConfigPage = () => {
  const [config, setConfig] = useState({
    lottery_mode: 'recharge',
    min_recharge: 100,
    reject_message: '您的累计充值未达到抽奖门槛',
    max_winners: 1000,
    limit_reached_message: '抽奖活动已结束，感谢参与',
    thanks_message: '谢谢参与,再接再厉!',
    currency_symbol: '¥'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await configApi.getConfig();
      setConfig(response.data);
    } catch (error) {
      console.error('加载配置失败:', error);
      setMessage({ type: 'error', text: '加载配置失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await configApi.updateConfig(config);
      setMessage({ type: 'success', text: '配置保存成功！' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('保存配置失败:', error);
      setMessage({ type: 'error', text: '保存失败，请稍后重试' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig({ ...config, [field]: value });
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
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            ⚙️ 抽奖配置
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            配置抽奖规则和提示信息
          </p>
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

        <form onSubmit={handleSubmit}>
          <div style={{
            background: 'linear-gradient(135deg, #161D2B 0%, #1E2636 100%)',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid rgba(233, 165, 104, 0.2)',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '1.5rem'
            }}>
              基础配置
            </h2>

            {/* 抽奖模式 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                抽奖模式
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: config.lottery_mode === 'recharge' ? 'rgba(233, 165, 104, 0.2)' : '#0F131C',
                  border: `2px solid ${config.lottery_mode === 'recharge' ? '#E9A568' : 'rgba(233, 165, 104, 0.3)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name="lottery_mode"
                    value="recharge"
                    checked={config.lottery_mode === 'recharge'}
                    onChange={(e) => handleChange('lottery_mode', e.target.value)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ color: 'var(--text-primary)' }}>充值资格模式</span>
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: config.lottery_mode === 'free' ? 'rgba(233, 165, 104, 0.2)' : '#0F131C',
                  border: `2px solid ${config.lottery_mode === 'free' ? '#E9A568' : 'rgba(233, 165, 104, 0.3)'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name="lottery_mode"
                    value="free"
                    checked={config.lottery_mode === 'free'}
                    onChange={(e) => handleChange('lottery_mode', e.target.value)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ color: 'var(--text-primary)' }}>免费抽奖模式</span>
                </label>
              </div>
            </div>

            {/* 充值门槛 */}
            {config.lottery_mode === 'recharge' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  充值门槛（元）
                </label>
                <input
                  type="number"
                  value={config.min_recharge}
                  onChange={(e) => handleChange('min_recharge', parseFloat(e.target.value))}
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

            {/* 中奖人数上限 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                中奖人数上限（0 表示不限制）
              </label>
              <input
                type="number"
                value={config.max_winners}
                onChange={(e) => handleChange('max_winners', parseInt(e.target.value))}
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

            {/* 货币符号 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                货币符号（例如：¥、$、€、₹等）
              </label>
              <input
                type="text"
                value={config.currency_symbol}
                onChange={(e) => handleChange('currency_symbol', e.target.value)}
                placeholder="¥"
                maxLength="5"
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
          </div>

          {/* 提示文案配置 */}
          <div style={{
            background: 'linear-gradient(135deg, #161D2B 0%, #1E2636 100%)',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid rgba(233, 165, 104, 0.2)',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '1.5rem'
            }}>
              提示文案配置
            </h2>

            {/* 不满足门槛提示 */}
            {config.lottery_mode === 'recharge' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  充值不足提示语
                </label>
                <input
                  type="text"
                  value={config.reject_message}
                  onChange={(e) => handleChange('reject_message', e.target.value)}
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

            {/* 名额已满提示 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                名额已满提示语
              </label>
              <input
                type="text"
                value={config.limit_reached_message}
                onChange={(e) => handleChange('limit_reached_message', e.target.value)}
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

            {/* 谢谢参与文案 */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                谢谢参与文案
              </label>
              <input
                type="text"
                value={config.thanks_message}
                onChange={(e) => handleChange('thanks_message', e.target.value)}
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
          </div>

          {/* 保存按钮 */}
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'white',
              background: saving
                ? 'rgba(233, 165, 104, 0.5)'
                : 'linear-gradient(135deg, #E9A568 0%, #d89558 100%)',
              border: 'none',
              borderRadius: '12px',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(233, 165, 104, 0.3)'
            }}
          >
            {saving ? '保存中...' : '💾 保存配置'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ConfigPage;
