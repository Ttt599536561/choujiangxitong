const { db } = require('../config/database');
const {
  drawLottery,
  markCodeAsIssued,
  recordLottery,
  hasDrawn,
  getWinnerCount
} = require('../utils/lotteryAlgorithm');

/**
 * 获取抽奖配置信息（公开接口）
 */
exports.getLotteryConfig = (req, res) => {
  try {
    const config = db.prepare('SELECT * FROM lottery_config WHERE id = 1').get();

    // 获取奖项列表（用于前端展示）
    const prizes = db.prepare(`
      SELECT id, prize_name, prize_amount, prize_icon, win_rate, level, is_thanks
      FROM prizes
      ORDER BY level ASC
    `).all();

    // 获取当前中奖人数
    const winnerCount = getWinnerCount();

    res.json({
      mode: config.lottery_mode,
      minRecharge: config.min_recharge,
      rejectMessage: config.reject_message,
      maxWinners: config.max_winners,
      limitReachedMessage: config.limit_reached_message,
      thanksMessage: config.thanks_message,
      currency_symbol: config.currency_symbol || '¥',
      prizes,
      currentWinners: winnerCount
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
};

/**
 * 执行抽奖
 */
exports.performLottery = (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: '请输入有效的邮箱地址' });
  }

  try {
    // 1. 检查是否已抽过奖
    if (hasDrawn(email)) {
      return res.status(400).json({ error: '该邮箱已参与过抽奖，不可重复抽奖' });
    }

    // 2. 获取抽奖配置
    const config = db.prepare('SELECT * FROM lottery_config WHERE id = 1').get();

    // 3. 检查是否达到中奖人数上限
    const currentWinners = getWinnerCount();
    if (config.max_winners > 0 && currentWinners >= config.max_winners) {
      return res.status(400).json({
        error: config.limit_reached_message || '抽奖活动已结束'
      });
    }

    // 4. 如果是充值模式，验证充值资格
    if (config.lottery_mode === 'recharge') {
      const user = db.prepare('SELECT total_recharge FROM users WHERE email = ?').get(email);

      if (!user) {
        return res.status(400).json({ error: '该邮箱未找到充值记录' });
      }

      if (user.total_recharge < config.min_recharge) {
        return res.status(400).json({
          error: config.reject_message || '您的累计充值未达到抽奖门槛',
          required: config.min_recharge,
          current: user.total_recharge
        });
      }
    }

    // 5. 执行抽奖算法
    const result = drawLottery();

    // 6. 记录抽奖结果
    if (!result.isThanks && result.codeId) {
      // 标记兑换码为已发放
      markCodeAsIssued(result.codeId, email);
    }

    // 记录抽奖历史
    recordLottery(email, result.prizeId, result.codeId || null, result.isThanks);

    // 7. 返回结果
    res.json({
      success: true,
      prize: {
        id: result.prizeId,
        name: result.prizeName,
        amount: result.prizeAmount,
        icon: result.prizeIcon,
        isThanks: result.isThanks,
        code: result.code
      }
    });

  } catch (error) {
    console.error('抽奖失败:', error);
    res.status(500).json({ error: error.message || '抽奖失败，请稍后重试' });
  }
};

/**
 * 获取花样道具列表（公开接口，用于前端老虎机动画）
 */
exports.getDecoys = (req, res) => {
  try {
    const decoys = db.prepare(
      'SELECT id, icon, label, sort_order FROM slot_decoys WHERE enabled = 1 ORDER BY sort_order ASC, id ASC'
    ).all();
    res.json(decoys);
  } catch (error) {
    console.error('获取花样道具失败:', error);
    res.status(500).json({ error: '获取花样道具失败' });
  }
};

/**
 * 获取奖项列表（用于前端老虎机显示）
 */
exports.getPrizes = (req, res) => {
  try {
    const prizes = db.prepare(`
      SELECT id, prize_name, prize_amount, prize_icon, level, is_thanks
      FROM prizes
      ORDER BY level ASC
    `).all();

    res.json(prizes);
  } catch (error) {
    console.error('获取奖项失败:', error);
    res.status(500).json({ error: '获取奖项失败' });
  }
};
