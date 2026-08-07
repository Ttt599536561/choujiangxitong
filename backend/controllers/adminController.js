const { db } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const csv = require('csv-parser');
const fs = require('fs');

/**
 * 管理员登录
 */
exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '请提供用户名和密码' });
  }

  try {
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);

    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成 JWT
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, username: admin.username });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败' });
  }
};

/**
 * 获取抽奖配置
 */
exports.getConfig = (req, res) => {
  try {
    const config = db.prepare('SELECT * FROM lottery_config WHERE id = 1').get();
    res.json(config);
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
};

/**
 * 更新抽奖配置
 */
exports.updateConfig = (req, res) => {
  const {
    lottery_mode,
    min_recharge,
    reject_message,
    max_winners,
    limit_reached_message,
    thanks_message
  } = req.body;

  try {
    db.prepare(`
      UPDATE lottery_config
      SET lottery_mode = ?,
          min_recharge = ?,
          reject_message = ?,
          max_winners = ?,
          limit_reached_message = ?,
          thanks_message = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      lottery_mode,
      min_recharge,
      reject_message,
      max_winners,
      limit_reached_message,
      thanks_message
    );

    res.json({ success: true, message: '配置更新成功' });
  } catch (error) {
    console.error('更新配置失败:', error);
    res.status(500).json({ error: '更新配置失败' });
  }
};

/**
 * 获取所有奖项
 */
exports.getPrizes = (req, res) => {
  try {
    const prizes = db.prepare(`
      SELECT * FROM prizes ORDER BY level ASC
    `).all();
    res.json(prizes);
  } catch (error) {
    console.error('获取奖项失败:', error);
    res.status(500).json({ error: '获取奖项失败' });
  }
};

/**
 * 添加奖项
 */
exports.addPrize = (req, res) => {
  const { prize_name, prize_amount, prize_icon, win_rate, level, is_thanks } = req.body;

  if (!prize_name || win_rate === undefined) {
    return res.status(400).json({ error: '请提供完整的奖项信息' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO prizes (prize_name, prize_amount, prize_icon, win_rate, level, is_thanks)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      prize_name,
      prize_amount || 0,
      prize_icon || '🎁',
      win_rate,
      level || 0,
      is_thanks ? 1 : 0
    );

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('添加奖项失败:', error);
    res.status(500).json({ error: '添加奖项失败' });
  }
};

/**
 * 更新奖项
 */
exports.updatePrize = (req, res) => {
  const { id } = req.params;
  const { prize_name, prize_amount, prize_icon, win_rate, level, is_thanks } = req.body;

  try {
    db.prepare(`
      UPDATE prizes
      SET prize_name = ?, prize_amount = ?, prize_icon = ?, win_rate = ?, level = ?, is_thanks = ?
      WHERE id = ?
    `).run(prize_name, prize_amount, prize_icon, win_rate, level, is_thanks ? 1 : 0, id);

    res.json({ success: true });
  } catch (error) {
    console.error('更新奖项失败:', error);
    res.status(500).json({ error: '更新奖项失败' });
  }
};

/**
 * 删除奖项
 */
exports.deletePrize = (req, res) => {
  const { id } = req.params;

  try {
    db.prepare('DELETE FROM prizes WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('删除奖项失败:', error);
    res.status(500).json({ error: '删除奖项失败' });
  }
};

/**
 * 获取用户列表
 */
exports.getUsers = (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.*,
             (SELECT COUNT(*) FROM lottery_records WHERE email = u.email) as draw_count
      FROM users u
      ORDER BY created_at DESC
    `).all();
    res.json(users);
  } catch (error) {
    console.error('获取用户失败:', error);
    res.status(500).json({ error: '获取用户失败' });
  }
};

/**
 * 添加用户
 */
exports.addUser = (req, res) => {
  const { email, total_recharge } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: '请提供有效的邮箱地址' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO users (email, total_recharge)
      VALUES (?, ?)
    `).run(email, total_recharge || 0);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: '该邮箱已存在' });
    }
    console.error('添加用户失败:', error);
    res.status(500).json({ error: '添加用户失败' });
  }
};

/**
 * 更新用户
 */
exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { total_recharge } = req.body;

  try {
    db.prepare('UPDATE users SET total_recharge = ? WHERE id = ?').run(total_recharge, id);
    res.json({ success: true });
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({ error: '更新用户失败' });
  }
};

/**
 * 删除用户
 */
exports.deleteUser = (req, res) => {
  const { id } = req.params;

  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ error: '删除用户失败' });
  }
};

/**
 * 批量导入用户（CSV）
 */
exports.importUsers = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传CSV文件' });
  }

  const users = [];
  const errors = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      // 期望 CSV 格式：email,total_recharge
      if (row.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        users.push({
          email: row.email,
          total_recharge: parseFloat(row.total_recharge) || 0
        });
      } else {
        errors.push(`无效邮箱: ${row.email}`);
      }
    })
    .on('end', () => {
      let successCount = 0;

      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO users (email, total_recharge)
        VALUES (?, ?)
      `);

      const insertMany = db.transaction((users) => {
        for (const user of users) {
          try {
            insertStmt.run(user.email, user.total_recharge);
            successCount++;
          } catch (error) {
            errors.push(`导入失败: ${user.email}`);
          }
        }
      });

      insertMany(users);

      // 删除临时文件
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        imported: successCount,
        total: users.length,
        errors: errors.length > 0 ? errors : null
      });
    })
    .on('error', (error) => {
      console.error('导入失败:', error);
      res.status(500).json({ error: '导入失败' });
    });
};

/**
 * 获取兑换码列表
 */
exports.getCodes = (req, res) => {
  try {
    const codes = db.prepare(`
      SELECT rc.*, p.prize_name, p.prize_amount
      FROM redemption_codes rc
      LEFT JOIN prizes p ON rc.prize_id = p.id
      ORDER BY rc.created_at DESC
    `).all();
    res.json(codes);
  } catch (error) {
    console.error('获取兑换码失败:', error);
    res.status(500).json({ error: '获取兑换码失败' });
  }
};

/**
 * 添加兑换码
 */
exports.addCode = (req, res) => {
  const { code, prize_id } = req.body;

  if (!code || !prize_id) {
    return res.status(400).json({ error: '请提供兑换码和奖项ID' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO redemption_codes (code, prize_id)
      VALUES (?, ?)
    `).run(code, prize_id);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: '该兑换码已存在' });
    }
    console.error('添加兑换码失败:', error);
    res.status(500).json({ error: '添加兑换码失败' });
  }
};

/**
 * 批量导入兑换码（CSV）
 */
exports.importCodes = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传CSV文件' });
  }

  const codes = [];
  const errors = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      // 期望 CSV 格式：code,prize_id
      if (row.code && row.prize_id) {
        codes.push({
          code: row.code,
          prize_id: parseInt(row.prize_id)
        });
      } else {
        errors.push(`无效数据: ${JSON.stringify(row)}`);
      }
    })
    .on('end', () => {
      let successCount = 0;

      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO redemption_codes (code, prize_id)
        VALUES (?, ?)
      `);

      const insertMany = db.transaction((codes) => {
        for (const item of codes) {
          try {
            const result = insertStmt.run(item.code, item.prize_id);
            if (result.changes > 0) successCount++;
          } catch (error) {
            errors.push(`导入失败: ${item.code}`);
          }
        }
      });

      insertMany(codes);

      // 删除临时文件
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        imported: successCount,
        total: codes.length,
        errors: errors.length > 0 ? errors : null
      });
    })
    .on('error', (error) => {
      console.error('导入失败:', error);
      res.status(500).json({ error: '导入失败' });
    });
};

/**
 * 获取抽奖记录
 */
exports.getLotteryRecords = (req, res) => {
  try {
    const records = db.prepare(`
      SELECT lr.*, p.prize_name, p.prize_amount, p.prize_icon, rc.code
      FROM lottery_records lr
      LEFT JOIN prizes p ON lr.prize_id = p.id
      LEFT JOIN redemption_codes rc ON lr.code_id = rc.id
      ORDER BY lr.created_at DESC
      LIMIT 100
    `).all();
    res.json(records);
  } catch (error) {
    console.error('获取抽奖记录失败:', error);
    res.status(500).json({ error: '获取抽奖记录失败' });
  }
};

/**
 * 获取统计数据
 */
exports.getStats = (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalDraws = db.prepare('SELECT COUNT(*) as count FROM lottery_records').get().count;
    const totalWinners = db.prepare('SELECT COUNT(*) as count FROM lottery_records WHERE is_thanks = 0').get().count;
    const totalCodes = db.prepare('SELECT COUNT(*) as count FROM redemption_codes WHERE status = "pending"').get().count;

    res.json({
      totalUsers,
      totalDraws,
      totalWinners,
      availableCodes: totalCodes
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
};

/**
 * 修改管理员密码
 */
exports.changePassword = (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const adminId = req.admin.id; // 从 JWT 中获取

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '请提供旧密码和新密码' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度至少为6位' });
  }

  try {
    // 验证旧密码
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(adminId);

    if (!admin || !bcrypt.compareSync(oldPassword, admin.password)) {
      return res.status(401).json({ error: '旧密码错误' });
    }

    // 加密新密码
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // 更新密码
    db.prepare('UPDATE admins SET password = ? WHERE id = ?').run(hashedPassword, adminId);

    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ error: '修改密码失败' });
  }
};
