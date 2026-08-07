import React, { useState, useEffect, useRef } from 'react';
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

const SlotColumn = ({ prizes, isSpinning, finalPrize, columnIndex, onStopComplete, currencySymbol }) => {
  const [position, setPosition] = useState(0);
  const columnRef = useRef(null);
  const itemHeight = 120; // 每个奖项的高度

  useEffect(() => {
    if (!isSpinning) {
      // 停止时，找到最终奖项的位置，让它显示在中间
      const finalIndex = prizes.findIndex(p => p.id === finalPrize?.id);
      if (finalIndex !== -1) {
        // 中间位置：向上移动 (finalIndex - 1) * itemHeight，这样中奖项就在中间
        const targetPosition = -(finalIndex - 1) * itemHeight;
        setPosition(targetPosition);

        // 延迟通知停止完成
        setTimeout(() => {
          onStopComplete();
        }, 500);
      }
    } else {
      // 快速滚动动画
      const interval = setInterval(() => {
        setPosition(prev => {
          const newPos = prev - itemHeight;
          // 循环滚动
          if (Math.abs(newPos) >= prizes.length * itemHeight) {
            return 0;
          }
          return newPos;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isSpinning, finalPrize, prizes, itemHeight]);

  const displayPrizes = [...prizes, ...prizes, ...prizes]; // 复制三份用于循环

  return (
    <div className="slot-column">
      <div
        className="slot-column-inner"
        ref={columnRef}
        style={{
          transform: `translateY(${position}px)`,
          transition: isSpinning ? 'none' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {displayPrizes.map((prize, index) => (
          <div key={`${prize.id}-${index}`} className="slot-item">
            <div className="prize-icon">{prize.prize_icon}</div>
            <div className="prize-name">{prize.prize_name}</div>
            {!prize.is_thanks && (
              <div className="prize-amount">{currencySymbol}{prize.prize_amount}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SlotMachine = ({ prizes, onDrawComplete, currencySymbol = '¥' }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState(null);
  const [result, setResult] = useState(null);
  const [stoppedColumns, setStoppedColumns] = useState([false, false, false]);

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

      // 找到中奖的奖项
      const winPrize = prizes.find(p => p.id === prizeResult.id);
      setResult({ ...prizeResult, prize: winPrize });

      // 依次停止三列
      setTimeout(() => setStoppedColumns([true, false, false]), 1000);
      setTimeout(() => setStoppedColumns([true, true, false]), 1500);
      setTimeout(() => setStoppedColumns([true, true, true]), 2000);

    } catch (err) {
      setIsSpinning(false);
      setToast({ message: err.response?.data?.error || '抽奖失败，请稍后重试', type: 'error' });
    }
  };

  const handleColumnStop = (columnIndex) => {
    // 当所有列都停止时
    if (stoppedColumns.every(stopped => stopped)) {
      setIsSpinning(false);
      setTimeout(() => {
        onDrawComplete(result);
      }, 300);
    }
  };

  return (
    <div className="slot-machine-container">
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
              prizes={prizes}
              isSpinning={isSpinning && !stoppedColumns[columnIndex]}
              finalPrize={result?.prize}
              columnIndex={columnIndex}
              onStopComplete={() => handleColumnStop(columnIndex)}
              currencySymbol={currencySymbol}
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
