import axios from 'axios';

const API_BASE_URL = '/api';

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 自动添加 Token
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理 401 错误
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// 认证
export const authApi = {
  login: (username, password) =>
    axios.post(`${API_BASE_URL}/auth/login`, { username, password }),
  logout: () => {
    localStorage.removeItem('admin_token');
  },
  changePassword: (oldPassword, newPassword) =>
    adminApi.put('/admin/change-password', { oldPassword, newPassword })
};

// 配置管理
export const configApi = {
  getConfig: () => adminApi.get('/admin/config'),
  updateConfig: (data) => adminApi.put('/admin/config', data)
};

// 奖项管理
export const prizeApi = {
  getPrizes: () => adminApi.get('/admin/prizes'),
  addPrize: (data) => adminApi.post('/admin/prizes', data),
  updatePrize: (id, data) => adminApi.put(`/admin/prizes/${id}`, data),
  deletePrize: (id) => adminApi.delete(`/admin/prizes/${id}`)
};

// 用户管理
export const userApi = {
  getUsers: () => adminApi.get('/admin/users'),
  addUser: (data) => adminApi.post('/admin/users', data),
  updateUser: (id, data) => adminApi.put(`/admin/users/${id}`, data),
  deleteUser: (id) => adminApi.delete(`/admin/users/${id}`),
  batchDeleteUsers: (ids) => adminApi.post('/admin/users/batch-delete', { ids }),
  importUsers: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return adminApi.post('/admin/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// 兑换码管理
export const codeApi = {
  getCodes: () => adminApi.get('/admin/codes'),
  addCode: (data) => adminApi.post('/admin/codes', data),
  importCodes: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return adminApi.post('/admin/codes/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// 抽奖记录
export const recordsApi = {
  getRecords: () => adminApi.get('/admin/records')
};

// 统计数据
export const statsApi = {
  getStats: () => adminApi.get('/admin/stats')
};

// 花样道具管理
export const decoyApi = {
  getDecoys: () => adminApi.get('/admin/decoys'),
  addDecoy: (data) => adminApi.post('/admin/decoys', data),
  updateDecoy: (id, data) => adminApi.put(`/admin/decoys/${id}`, data),
  deleteDecoy: (id) => adminApi.delete(`/admin/decoys/${id}`)
};

export default adminApi;
