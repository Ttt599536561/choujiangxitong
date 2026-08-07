const { db } = require('../config/database');

/**
 * 抽奖算法 - 根据概率抽取奖项
 * @returns {Object} 中奖结果 { prizeId, prizeName, prizeAmount, prizeIcon, isThanks, code }
 */
function drawLottery() {
  // 1. 获取所有奖项及其概率
  const prizes = db.prepare(`
    SELECT id, prize_name, prize_amount, prize_icon, win_rate, is_thanks
    FROM prizes
    ORDER BY level ASC
  `).all();

  if (prizes.length === 0) {
    throw new Error('没有配置奖项');
  }

  // 2. 验证概率总和是否为 100%
  const totalRate = prizes.reduce((sum, prize) => sum + prize.win_rate, 0);
  if (Math.abs(totalRate - 100) > 0.01) {
    throw new Error(`奖项概率总和必须为100%，当前为${totalRate}%`);
  }

  // 3. 生成随机数 (0-100)
  const random = Math.random() * 100;

  // 4. 根据概率区间确定中奖奖项
  let currentRate = 0;
  let selectedPrize = null;

  for (const prize of prizes) {
    currentRate += prize.win_rate;
    if (random <= currentRate) {
      selectedPrize = prize;
      break;
    }
  }

  if (!selectedPrize) {
    // 兜底：如果没有选中（理论上不会发生），选择最后一个奖项
    selectedPrize = prizes[prizes.length - 1];
  }

  // 5. 如果是"谢谢参与"，直接返回
  if (selectedPrize.is_thanks) {
    return {
      prizeId: selectedPrize.id,
      prizeName: selectedPrize.prize_name,
      prizeAmount: selectedPrize.prize_amount,
      prizeIcon: selectedPrize.prize_icon,
      isThanks: true,
      code: null
    };
  }

  // 6. 获取该奖项对应的待发放兑换码
  const availableCode = db.prepare(`
    SELECT id, code
    FROM redemption_codes
    WHERE prize_id = ? AND status = 'pending'
    LIMIT 1
  `).get(selectedPrize.id);

  // 如果没有可用兑换码，降级为"谢谢参与"
  if (!availableCode) {
    console.warn(`奖项"${selectedPrize.prize_name}"没有可用兑换码，降级为谢谢参与`);

    const thanksPrize = prizes.find(p => p.is_thanks);
    if (thanksPrize) {
      return {
        prizeId: thanksPrize.id,
        prizeName: thanksPrize.prize_name,
        prizeAmount: thanksPrize.prize_amount,
        prizeIcon: thanksPrize.prize_icon,
        isThanks: true,
        code: null
      };
    }
  }

  // 7. 返回中奖结果（包含兑换码信息）
  return {
    prizeId: selectedPrize.id,
    prizeName: selectedPrize.prize_name,
    prizeAmount: selectedPrize.prize_amount,
    prizeIcon: selectedPrize.prize_icon,
    isThanks: false,
    code: availableCode.code,
    codeId: availableCode.id
  };
}

/**
 * 标记兑换码为已发放
 */
function markCodeAsIssued(codeId, email) {
  db.prepare(`
    UPDATE redemption_codes
    SET status = 'issued', issued_to = ?, issued_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(email, codeId);
}

/**
 * 记录抽奖历史
 */
function recordLottery(email, prizeId, codeId, isThanks) {
  db.prepare(`
    INSERT INTO lottery_records (email, prize_id, code_id, is_thanks)
    VALUES (?, ?, ?, ?)
  `).run(email, prizeId, codeId, isThanks ? 1 : 0);
}

/**
 * 检查邮箱是否已抽过奖
 */
function hasDrawn(email) {
  const record = db.prepare('SELECT id FROM lottery_records WHERE email = ? LIMIT 1').get(email);
  return !!record;
}

/**
 * 获取当前中奖人数
 */
function getWinnerCount() {
  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM lottery_records
    WHERE is_thanks = 0
  `).get();
  return result.count;
}

module.exports = {
  drawLottery,
  markCodeAsIssued,
  recordLottery,
  hasDrawn,
  getWinnerCount
};
