import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ResultModal.css';

const ResultModal = ({ isOpen, result, onClose, thanksMessage, currencySymbol = '¥' }) => {
  if (!isOpen || !result) return null;

  const isWinner = !result.isThanks;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            onClick={(e) => e.stopPropagation()}
          >
            {isWinner ? (
              <>
                <div className="modal-header winner">
                  <motion.div
                    className="prize-icon-large"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {result.icon}
                  </motion.div>
                  <h2 className="modal-title winner-title">🎉 恭喜中奖！🎉</h2>
                </div>
                <div className="modal-body">
                  <div className="prize-info">
                    <div className="prize-name-large">{result.name}</div>
                    <div className="prize-amount-large">{currencySymbol}{result.amount}</div>
                  </div>
                  {result.code && (
                    <div className="code-section">
                      <p className="code-label">您的兑换码：</p>
                      <div className="code-display">{result.code}</div>
                      <p className="code-hint">请妥善保存此兑换码，刷新页面后将无法找回</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="modal-header thanks">
                  <div className="prize-icon-large">{result.icon}</div>
                  <h2 className="modal-title thanks-title">{result.name}</h2>
                </div>
                <div className="modal-body">
                  <p className="thanks-message">{thanksMessage || '谢谢参与，再接再厉！'}</p>
                </div>
              </>
            )}
            <button className="close-button" onClick={onClose}>
              关闭
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ResultModal;
