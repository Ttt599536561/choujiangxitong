import React, { useState, useEffect, useRef, useMemo } from 'react';
import './SlotMachine.css';

// Toast 浮层组件
const Toast = ({ message, type = 'error', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: '2rem',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '1rem 2rem',
      background: type === 'error'
        ? 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
        : 'linear-gradient(135deg, #6EE7B7 0%, #10B981 100%)',
      color: 'white',
      borderRadius: '999px',
      fontSize: '1rem',
      fontWeight: '600',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      zIndex: 9999,
      animation: 'slideDown 0.3s ease-out'
    }}>
      {message}
    </div>
  );
};

// 条目高度：JS 和 CSS 共用这一份数字
// 之前 CSS 手机端写 100px、JS 写死 120px，两边一对不上中奖行就偏了
// 现在由 JS 通过 --slot-item-height 下发，CSS 里不要再另写一份高度
const ITEM_HEIGHT_DESKTOP = 176;
const ITEM_HEIGHT_MOBILE = 140;
const MOBILE_QUERY = '(max-width: 768px)';

const useItemHeight = () => {
  const [itemHeight, setItemHeight] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return ITEM_HEIGHT_DESKTOP;
    return window.matchMedia(MOBILE_QUERY).matches ? ITEM_HEIGHT_MOBILE : ITEM_HEIGHT_DESKTOP;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const sync = (e) => setItemHeight(e.matches ? ITEM_HEIGHT_MOBILE : ITEM_HEIGHT_DESKTOP);
    // 老版本 Safari 只有 addListener
    if (mq.addEventListener) mq.addEventListener('change', sync);
    else mq.addListener(sync);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', sync);
      else mq.removeListener(sync);
    };
  }, []);

  return itemHeight;
};

// 将奖品和花样道具交错排列，增加滚动时的悬念感
const buildAllItems = (prizes, decoys) => {
  if (!decoys || decoys.length === 0) return prizes;
  const result = [];
  const maxLen = Math.max(prizes.length, decoys.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < prizes.length) result.push(prizes[i]);
    if (i < decoys.length) {
      result.push({
        id: `decoy-${decoys[i].id}`,
        prize_icon: decoys[i].icon,
        prize_name: decoys[i].label,
        // 角标文字为空 = 后台没配，前台就不显示；这里不兜任何默认文案
        badge_text: (decoys[i].badge_text || '').trim(),
        is_decoy: true
      });
    }
  }
  return result;
};

const SlotColumn = ({ items, isSpinning, finalPrize, initialOffset = 0, onStopComplete, currencySymbol, itemHeight }) => {
  // 位置按“第几个条目”记，不按像素记
  // 这样切换手机/桌面尺寸时条目高度变了，中奖行照样对得准
  const [offsetIndex, setOffsetIndex] = useState(initialOffset);

  useEffect(() => {
    if (!isSpinning) {
      // 使用第二份复制中的目标位置，避免 index=0 时的边缘问题
      const finalIndex = items.findIndex(p => p.id === finalPrize?.id);
      if (finalIndex !== -1) {
        setOffsetIndex(items.length + finalIndex - 1);
        setTimeout(() => onStopComplete(), 500);
      }
    } else {
      const interval = setInterval(() => {
        setOffsetIndex(prev => (prev + 1 >= items.length ? 0 : prev + 1));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isSpinning, finalPrize, items]);

  const position = -(offsetIndex * itemHeight);

  const displayItems = [...items, ...items, ...items];

  return (
    <div className="slot-column">
      <div
        className="slot-column-inner"
        style={{
          transform: `translateY(${position}px)`,
          transition: isSpinning ? 'none' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {displayItems.map((item, index) => (
          <div key={`${item.id}-${index}`} className={`slot-item${item.is_decoy ? ' slot-item-decoy' : ''}`}>
            <div className="prize-icon">{item.prize_icon}</div>
            <div className="prize-name">{item.prize_name}</div>
            {item.is_decoy ? (
              // 只有后台填了角标文字才显示
              item.badge_text ? <div className="decoy-badge">{item.badge_text}</div> : null
            ) : !item.is_thanks ? (
              <div className="prize-amount">{currencySymbol}{item.prize_amount}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

const SlotMachine = ({ prizes, decoys = [], onDrawComplete, currencySymbol = '¥' }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState(null);
  const [result, setResult] = useState(null);
  const [stoppedColumns, setStoppedColumns] = useState([false, false, false]);
  const itemHeight = useItemHeight();

  const allItems = buildAllItems(prizes, decoys);

  // 每列的随机起始偏移量——只在首次挂载时计算一次，保证每次刷新都不同
  const columnOffsets = useMemo(
    () => [0, 1, 2].map(() => allItems.length > 0 ? Math.floor(Math.random() * allItems.length) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // 空依赖：只在挂载时随机一次
  );

  const handleDraw = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setToast({ message: '请输入有效的邮箱地址', type: 'error' });
      return;
    }
    setToast(null);
    setIsSpinning(true);
    setStoppedColumns([false, false, false]);

    try {
      const { lotteryApi } = await import('../services/lotteryApi');
      const response = await lotteryApi.draw(email);
      const prizeResult = response.data.prize;

      const winPrize = prizes.find(p => p.id === prizeResult.id);
      setResult({ ...prizeResult, prize: winPrize });

      setTimeout(() => setStoppedColumns([true, false, false]), 1000);
      setTimeout(() => setStoppedColumns([true, true, false]), 1500);
      setTimeout(() => setStoppedColumns([true, true, true]), 2000);
    } catch (err) {
      setIsSpinning(false);
      setToast({ message: err.response?.data?.error || '抽奖失败，请稍后重试', type: 'error' });
    }
  };

  const handleColumnStop = () => {
    if (stoppedColumns.every(stopped => stopped)) {
      setIsSpinning(false);
      setTimeout(() => onDrawComplete(result), 300);
    }
  };

  // 条目高度下发给 CSS，列高/高亮框都按它算，不会和 JS 动画错位
  return (
    <div className="slot-machine-container" style={{ '--slot-item-height': `${itemHeight}px` }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="slot-machine-header">
        <h1 className="slot-title">🎰 幸运大抽奖 🎰</h1>
        <p className="slot-subtitle">试试你的手气，大奖等你来拿！</p>
      </div>

      <div className="slot-machine">
        <div className="slot-frame">
          {[0, 1, 2].map((columnIndex) => (
            <SlotColumn
              key={columnIndex}
              items={allItems}
              isSpinning={isSpinning && !stoppedColumns[columnIndex]}
              finalPrize={result?.prize}
              initialOffset={columnOffsets[columnIndex]}
              onStopComplete={handleColumnStop}
              currencySymbol={currencySymbol}
              itemHeight={itemHeight}
            />
          ))}
        </div>
      </div>

      <div className="slot-input-section">
        <div className="email-input-wrapper">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="📧 请输入您的邮箱地址"
            className="email-input"
            disabled={isSpinning}
          />
        </div>
        <button
          onClick={handleDraw}
          disabled={isSpinning}
          className="draw-button"
        >
          {isSpinning ? '🎰 抽奖中...' : '🎰 拉动把手开始抽奖'}
        </button>
      </div>
    </div>
  );
};

export default SlotMachine;

