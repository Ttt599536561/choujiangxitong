import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 抽奖相关 API
export const lotteryApi = {
  // 获取抽奖配置
  getConfig: () => api.get('/lottery/config'),

  // 获取奖项列表
  getPrizes: () => api.get('/lottery/prizes'),

  // 执行抽奖
  draw: (email) => api.post('/lottery/draw', { email })
};

export default api;
