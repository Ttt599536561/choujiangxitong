import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import { authApi } from '../../services/adminApi';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // 验证
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage({ type: 'error', text: '请填写所有字段' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码长度至少为6位' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }

    setLoading(true);

    try {
      await authApi.changePassword(formData.oldPassword, formData.newPassword);
      setMessage({ type: 'success', text: '密码修改成功！' });

      // 清空表单
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // 3秒后自动跳转到登录页
      setTimeout(() => {
        authApi.logout();
        window.location.href = '/admin/login';
      }, 3000);
    } catch (error) {
      console.error('修改密码失败:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || '修改密码失败，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

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
            🔒 修改密码
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            修改管理员登录密码
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
            marginBottom: '1.5rem',
            maxWidth: '500px'
          }}>
            {/* 旧密码 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                旧密码
              </label>
              <input
                type="password"
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                placeholder="请输入当前密码"
                disabled={loading}
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

            {/* 新密码 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                新密码
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="请输入新密码（至少6位）"
                disabled={loading}
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

            {/* 确认新密码 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                确认新密码
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="请再次输入新密码"
                disabled={loading}
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

            {/* 提示信息 */}
            <div style={{
              padding: '1rem',
              background: 'rgba(233, 165, 104, 0.1)',
              border: '1px solid rgba(233, 165, 104, 0.3)',
              borderRadius: '12px',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.6'
            }}>
              <p style={{ margin: 0 }}>💡 密码修改提示：</p>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                <li>新密码长度至少为6位</li>
                <li>建议使用字母、数字、符号组合</li>
                <li>修改成功后需要重新登录</li>
              </ul>
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              color: 'white',
              background: loading
                ? 'rgba(233, 165, 104, 0.5)'
                : 'linear-gradient(135deg, #E9A568 0%, #d89558 100%)',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(233, 165, 104, 0.3)'
            }}
          >
            {loading ? '修改中...' : '🔒 修改密码'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ChangePassword;
