import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { decoyApi } from '../../services/adminApi';

const DecoyPage = () => {
  const [decoys, setDecoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDecoy, setEditingDecoy] = useState(null);
  const [formData, setFormData] = useState({ icon: '', label: '', sort_order: 0, enabled: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadDecoys();
  }, []);

  const loadDecoys = async () => {
    try {
      const response = await decoyApi.getDecoys();
      setDecoys(response.data);
    } catch (err) {
      setError('加载花样道具失败');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingDecoy(null);
    setFormData({ icon: '🎟️', label: '', sort_order: decoys.length + 1, enabled: true });
    setError('');
    setShowModal(true);
  };

  const openEdit = (decoy) => {
    setEditingDecoy(decoy);
    setFormData({
      icon: decoy.icon,
      label: decoy.label,
      sort_order: decoy.sort_order,
      enabled: decoy.enabled === 1 || decoy.enabled === true
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.icon.trim()) { setError('请输入图标'); return; }
    if (!formData.label.trim()) { setError('请输入文字'); return; }

    setSaving(true);
    setError('');
    try {
      if (editingDecoy) {
        await decoyApi.updateDecoy(editingDecoy.id, formData);
        setSuccess('修改成功');
      } else {
        await decoyApi.addDecoy(formData);
        setSuccess('添加成功');
      }
      setShowModal(false);
      await loadDecoys();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确认删除这个花样道具？')) return;
    try {
      await decoyApi.deleteDecoy(id);
      setSuccess('删除成功');
      await loadDecoys();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('删除失败');
    }
  };

  const cardStyle = {
    background: 'rgba(22, 29, 43, 0.6)',
    borderRadius: '16px',
    border: '1px solid rgba(233, 165, 104, 0.2)',
    padding: '2rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(22, 29, 43, 0.8)',
    border: '1px solid rgba(233, 165, 104, 0.3)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    boxSizing: 'border-box'
  };

  const btnPrimary = {
    padding: '0.625rem 1.5rem',
    background: 'linear-gradient(135deg, #E9A568 0%, #D4894A 100%)',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer'
  };

  const btnDanger = {
    padding: '0.5rem 1rem',
    background: 'rgba(220, 38, 38, 0.15)',
    color: '#EF4444',
    border: '1px solid rgba(220, 38, 38, 0.3)',
    borderRadius: '6px',
    fontSize: '0.85rem',
    cursor: 'pointer'
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: '900px' }}>
        {/* 标题行 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              🎪 花样道具
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              抽奖动画中混入的非奖品条目，增加悬念感
            </p>
          </div>
          <button style={btnPrimary} onClick={openAdd}>＋ 添加道具</button>
        </div>

        {/* 提示横幅 */}
        {success && (
          <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '8px', color: '#34D399', marginBottom: '1rem' }}>
            ✅ {success}
          </div>
        )}
        {error && !showModal && (
          <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)',
            borderRadius: '8px', color: '#EF4444', marginBottom: '1rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* 道具列表 */}
        <div style={cardStyle}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>加载中...</div>
          ) : decoys.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>暂无花样道具</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(233,165,104,0.2)' }}>
                  {['图标', '文字', '排序', '状态', '操作'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#E9A568',
                      fontSize: '0.85rem', fontWeight: '600' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {decoys.map((decoy) => (
                  <tr key={decoy.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '1.75rem' }}>{decoy.icon}</td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {decoy.label}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>{decoy.sort_order}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        background: (decoy.enabled === 1 || decoy.enabled === true)
                          ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.2)',
                        color: (decoy.enabled === 1 || decoy.enabled === true) ? '#34D399' : '#94A3B8'
                      }}>
                        {(decoy.enabled === 1 || decoy.enabled === true) ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <button style={{ ...btnPrimary, padding: '0.4rem 0.9rem', fontSize: '0.8rem', marginRight: '0.5rem' }}
                        onClick={() => openEdit(decoy)}>编辑</button>
                      <button style={btnDanger} onClick={() => handleDelete(decoy.id)}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 添加/编辑弹窗 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#161D2B', borderRadius: '16px', border: '1px solid rgba(233,165,104,0.3)',
            padding: '2rem', width: '420px', maxWidth: '90vw' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
              {editingDecoy ? '编辑花样道具' : '添加花样道具'}
            </h2>

            {error && (
              <div style={{ padding: '0.625rem 1rem', background: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.3)', borderRadius: '8px', color: '#EF4444',
                marginBottom: '1rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem',
                marginBottom: '0.5rem' }}>图标（Emoji）</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input style={{ ...inputStyle, width: '80px', fontSize: '1.5rem', textAlign: 'center' }}
                  value={formData.icon}
                  onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))}
                  maxLength={4}
                  placeholder="🎟️"
                />
                <span style={{ alignSelf: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  预览: {formData.icon}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem',
                marginBottom: '0.5rem' }}>文字</label>
              <input style={inputStyle}
                value={formData.label}
                onChange={e => setFormData(p => ({ ...p, label: e.target.value }))}
                placeholder="例：9.9折优惠券"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem',
                marginBottom: '0.5rem' }}>排序（数字越小越靠前）</label>
              <input style={inputStyle} type="number" min="0"
                value={formData.sort_order}
                onChange={e => setFormData(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input type="checkbox" id="decoy-enabled" checked={formData.enabled}
                onChange={e => setFormData(p => ({ ...p, enabled: e.target.checked }))}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="decoy-enabled" style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>
                启用此道具
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button style={{ padding: '0.625rem 1.25rem', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
                color: 'var(--text-secondary)', cursor: 'pointer' }}
                onClick={() => setShowModal(false)} disabled={saving}>
                取消
              </button>
              <button style={btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default DecoyPage;
