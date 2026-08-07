import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { userApi } from '../../services/adminApi';

const UserPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    total_recharge: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userApi.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('加载用户失败:', error);
      setMessage({ type: 'error', text: '加载用户失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        total_recharge: user.total_recharge
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        total_recharge: 0
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      if (editingUser) {
        await userApi.updateUser(editingUser.id, { total_recharge: formData.total_recharge });
        setMessage({ type: 'success', text: '用户更新成功！' });
      } else {
        await userApi.addUser(formData);
        setMessage({ type: 'success', text: '用户添加成功！' });
      }
      handleCloseModal();
      loadUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('保存用户失败:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || '操作失败' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个用户吗？')) return;

    try {
      await userApi.deleteUser(id);
      setMessage({ type: 'success', text: '用户删除成功！' });
      loadUsers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('删除用户失败:', error);
      setMessage({ type: 'error', text: '删除失败' });
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
      const response = await userApi.importUsers(file);
      setMessage({
        type: 'success',
        text: `导入成功！共导入 ${response.data.imported} 个用户（总数 ${response.data.total}）`
      });
      loadUsers();
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
    const csvContent = 'email,total_recharge\nuser1@example.com,150\nuser2@example.com,200\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'users_template.csv';
    link.click();
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
              👥 用户管理
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              管理用户邮箱和充值金额（共 {users.length} 个用户）
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
              ➕ 添加用户
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
          💡 支持 CSV / Excel（.xlsx/.xls）格式，第一行为标题（email,total_recharge），之后每行一个用户数据
        </div>

        {/* 用户列表 */}
        <div style={{
          background: 'linear-gradient(135deg, #161D2B 0%, #1E2636 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(233, 165, 104, 0.2)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(233, 165, 104, 0.1)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>ID</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>邮箱</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>累计充值</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>抽奖次数</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: '600' }}>创建时间</th>
                <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-primary)', fontWeight: '600' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
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
                    #{user.id}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '1rem', color: '#E9A568', fontWeight: '600' }}>
                    ¥{user.total_recharge}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                    {user.draw_count || 0} 次
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {new Date(user.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleOpenModal(user)}
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
                      onClick={() => handleDelete(user.id)}
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

          {users.length === 0 && (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              暂无用户，点击"添加用户"或"批量导入"按钮添加
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
                {editingUser ? '编辑用户' : '添加用户'}
              </h2>

              <form onSubmit={handleSubmit}>
                {/* 邮箱 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    邮箱地址 *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!editingUser}
                    placeholder="user@example.com"
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      fontSize: '1rem',
                      borderRadius: '12px',
                      border: '2px solid rgba(233, 165, 104, 0.3)',
                      background: editingUser ? 'rgba(15, 19, 28, 0.5)' : '#0F131C',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: editingUser ? 'not-allowed' : 'text'
                    }}
                  />
                  {editingUser && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      邮箱地址不可修改
                    </p>
                  )}
                </div>

                {/* 累计充值 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    累计充值（元）*
                  </label>
                  <input
                    type="number"
                    value={formData.total_recharge}
                    onChange={(e) => setFormData({ ...formData, total_recharge: parseFloat(e.target.value) })}
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
                    {editingUser ? '保存' : '添加'}
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

export default UserPage;
