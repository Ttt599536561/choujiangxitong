import { useState, useEffect } from 'react';
import { configApi } from '../services/adminApi';

/**
 * 后台各页面共享的货币符号
 *
 * 抽奖配置里改了符号，奖项/兑换码/记录/用户页都要跟着变，
 * 所以这里做模块级缓存 + localStorage 兜底：
 *   - 缓存命中直接返回，多个页面之间来回切不会重复打接口
 *   - localStorage 让刷新后首屏不闪一下默认的 ¥
 *   - 保存配置后调 setCurrencySymbol()，已挂载的页面立即刷新
 */
const STORAGE_KEY = 'admin_currency_symbol';
export const DEFAULT_SYMBOL = '¥';

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

let cached = readStored();
let inflight = null;
const listeners = new Set();

/** 配置页保存成功后调用，同步所有已挂载页面 */
export const setCurrencySymbol = (symbol) => {
  const value = (symbol || '').trim() || DEFAULT_SYMBOL;
  cached = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // 隐私模式下写不了，只用内存缓存
  }
  listeners.forEach((fn) => fn(value));
};

const fetchSymbol = () => {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;

  inflight = configApi
    .getConfig()
    .then((res) => {
      const value = (res.data?.currency_symbol || '').trim() || DEFAULT_SYMBOL;
      setCurrencySymbol(value);
      return value;
    })
    .catch(() => DEFAULT_SYMBOL)
    .finally(() => {
      inflight = null;
    });

  return inflight;
};

export const useCurrencySymbol = () => {
  const [symbol, setSymbol] = useState(cached || DEFAULT_SYMBOL);

  useEffect(() => {
    let alive = true;
    listeners.add(setSymbol);
    fetchSymbol().then((value) => {
      if (alive) setSymbol(value);
    });
    return () => {
      alive = false;
      listeners.delete(setSymbol);
    };
  }, []);

  return symbol;
};
