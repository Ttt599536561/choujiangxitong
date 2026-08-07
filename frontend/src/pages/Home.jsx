import React, { useState, useEffect } from 'react';
import SlotMachine from '../components/SlotMachine';
import ResultModal from '../components/ResultModal';
import { lotteryApi } from '../services/lotteryApi';

const Home = () => {
  const [config, setConfig] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [drawResult, setDrawResult] = useState(null);

  useEffect(() => {
    loadConfig();
    loadPrizes();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await lotteryApi.getConfig();
      setConfig(response.data);
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  const loadPrizes = async () => {
    try {
      const response = await lotteryApi.getPrizes();
      setPrizes(response.data);
    } catch (error) {
      console.error('加载奖项失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrawComplete = (result) => {
    setDrawResult(result);
    setShowResult(true);
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setDrawResult(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        color: 'var(--text-primary)',
        fontSize: '1.5rem'
      }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* 活动说明 */}
      {config && (
        <div style={{
          maxWidth: '900px',
          margin: '0 auto 2rem auto',
          padding: '1.5rem',
          background: 'rgba(22, 29, 43, 0.6)',
          borderRadius: '16px',
          border: '1px solid rgba(233, 165, 104, 0.2)',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#E9A568',
            marginBottom: '1rem'
          }}>
            活动说明
          </h3>
          <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {config.mode === 'free' ? (
              <p>🎁 本次活动为免费抽奖，所有人均可参与！</p>
            ) : (
              <p>
                💰 累计充值满 <span style={{ color: '#E9A568', fontWeight: '600' }}>{config.currency_symbol || '¥'}{config.minRecharge}</span> 即可参与抽奖
              </p>
            )}
            <p style={{ marginTop: '0.5rem' }}>
              🎯 每个邮箱仅有一次抽奖机会
            </p>
            {config.maxWinners > 0 && (
              <p style={{ marginTop: '0.5rem' }}>
                📊 本次活动共 {config.maxWinners} 个中奖名额，已抽出 {config.currentWinners} 个
              </p>
            )}
          </div>
        </div>
      )}

      {/* 老虎机主体 */}
      <SlotMachine
        prizes={prizes}
        onDrawComplete={handleDrawComplete}
        currencySymbol={config?.currency_symbol || '¥'}
      />

      {/* 奖项列表展示 */}
      <div style={{
        maxWidth: '900px',
        margin: '3rem auto 0 auto',
        padding: '0 2rem'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#E9A568',
          textAlign: 'center',
          marginBottom: '1.5rem'
        }}>
          🎁 奖项设置
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {prizes.map((prize) => (
            <div
              key={prize.id}
              style={{
                background: 'rgba(22, 29, 43, 0.6)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(233, 165, 104, 0.2)',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                {prize.prize_icon}
              </div>
              <div style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.25rem'
              }}>
                {prize.prize_name}
              </div>
              {!prize.is_thanks && (
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#E9A568'
                }}>
                  {config?.currency_symbol || '¥'}{prize.prize_amount}
                </div>
              )}
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginTop: '0.5rem'
              }}>
                中奖率: {prize.win_rate}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 结果弹窗 */}
      <ResultModal
        isOpen={showResult}
        result={drawResult}
        onClose={handleCloseResult}
        thanksMessage={config?.thanksMessage}
        currencySymbol={config?.currency_symbol || '¥'}
      />
    </div>
  );
};

export default Home;
