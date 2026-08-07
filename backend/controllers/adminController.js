const { db } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const xlsx = require('xlsx');

/**
 * 解析金额字符串，兼容 Excel 导出的常见格式：
 *   "￥1,109.90" / "$1,109.90" / "1,109.90" / "1109.9" / "（空）"
 * 会剥离货币符号、千分位逗号和空白（含全角空格），无法解析时返回 0。
 */
function parseAmount(value) {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isFinite(value) ? value : 0;

  // 只保留数字、小数点和负号，其余（货币符号、千分位逗号、空格）一律剥离
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return 0;

  const num = parseFloat(cleaned);
  return isFinite(num) ? num : 0;
}

/**
 * 按候选名依次取字段，容忍表头大小写、空格及 BOM 残留差异
 */
function pickField(row, ...names) {
  for (const name of names) {
    if (row[name] !== undefined && String(row[name]).trim() !== '') {
      return String(row[name]).trim();
    }
  }
  // 回退：规范化后再匹配一次（去 BOM、空格、下划线，忽略大小写）
  const normalize = (s) => s.replace(/^﻿/, '').replace(/[\s_]/g, '').toLowerCase();
  for (const name of names) {
    const target = normalize(name);
    for (const key of Object.keys(row)) {
      if (normalize(key) === target && String(row[key]).trim() !== '') {
        return String(row[key]).trim();
      }
    }
  }
  return '';
}

/**
 * 创建 CSV 解析流，自动处理编码：
 * UTF-8（含 BOM）直接读取；非法 UTF-8 序列（多为 Excel 导出的 GBK）转码后再解析。
 */
function createCsvStream(filePath) {
  const buffer = fs.readFileSync(filePath);

  // 含 U+FFFD 替换字符说明不是合法 UTF-8，按 GBK 再解一次
  let text = buffer.toString('utf8');
  if (text.includes('�')) {
    text = iconv.decode(buffer, 'gbk');
  }
  // 去掉 BOM，避免首个表头变成 "﻿email"
  text = text.replace(/^﻿/, '');

  const stream = csv();
  stream.write(text);
  stream.end();
  return stream;
}

/**
 * 删除上传的临时文件，失败仅记录不抛出
 */
function cleanupTempFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('清理临时文件失败:', error);
  }
}

/**
 * 解析 Excel 文件（.xlsx/.xls），返回与 CSV 行对象格式一致的数组。
 * 单元格数值会被转为字符串以便 pickField / parseAmount 统一处理。
 */
function parseXlsxFile(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // raw:false 让数字/日期也返回格式化字符串，defval:'' 补空列
  return xlsx.utils.sheet_to_json(sheet, { raw: false, defval: '' });
}

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
    thanks_message,
    currency_symbol
  } = req.body;

  try {
    // 货币符号为空时回退为 ¥，避免前台金额没有任何前缀
    const symbol = (currency_symbol || '').trim() || '¥';

    db.prepare(`
      UPDATE lottery_config
      SET lottery_mode = ?,
          min_recharge = ?,
          reject_message = ?,
          max_winners = ?,
          limit_reached_message = ?,
          thanks_message = ?,
          currency_symbol = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      lottery_mode,
      min_recharge,
      reject_message,
      max_winners,
      limit_reached_message,
      thanks_message,
      symbol
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
 * 批量删除用户
 * 请求体：{ ids: [1, 2, 3] }
 * 注意：不会删除 lottery_records 里的抽奖历史。历史按邮箱记录，
 * 保留是为了审计，也为了防止「删号后重新导入」绕过一个邮箱只能抽一次的限制。
 */
exports.batchDeleteUsers = (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: '请提供要删除的用户 ID 列表' });
  }

  // 去重 + 只保留合法整数
  const seen = new Set();
  const list = [];
  for (const raw of ids) {
    const id = parseInt(raw, 10);
    if (!Number.isInteger(id) || seen.has(id)) continue;
    seen.add(id);
    list.push(id);
  }

  if (list.length === 0) {
    return res.status(400).json({ error: '请提供至少一个有效的用户 ID' });
  }

  try {
    const deleteStmt = db.prepare('DELETE FROM users WHERE id = ?');
    let deleted = 0;
    const deleteMany = db.transaction((items) => {
      for (const id of items) {
        const result = deleteStmt.run(id);
        if (result.changes > 0) deleted++;
      }
    });
    deleteMany(list);

    res.json({
      success: true,
      deleted,
      requested: list.length
    });
  } catch (error) {
    console.error('批量删除用户失败:', error);
    res.status(500).json({ error: '批量删除用户失败' });
  }
};

/**
 * 批量导入用户（CSV / Excel .xlsx/.xls）
 */
exports.importUsers = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传 CSV 或 Excel 文件' });
  }

  // 将行数组写入数据库，CSV 和 xlsx 路径共用
  const insertRows = (rows) => {
    const users = [];
    const errors = [];

    for (const row of rows) {
      const email = pickField(row, 'email');
      const amountRaw = pickField(row, 'total_recharge', 'recharge_amount', 'amount');
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        users.push({ email, total_recharge: parseAmount(amountRaw) });
      } else {
        errors.push(`无效邮箱: ${email || '(空)'}`);
      }
    }

    if (users.length === 0) {
      cleanupTempFile(req.file.path);
      return res.status(400).json({
        error: '文件中没有可导入的有效数据，请确认表头包含 email 列' +
          (errors.length > 0 ? `（${errors.slice(0, 3).join('; ')}）` : '')
      });
    }

    let successCount = 0;
    try {
      const insertStmt = db.prepare(
        'INSERT OR REPLACE INTO users (email, total_recharge) VALUES (?, ?)'
      );
      const insertMany = db.transaction((list) => {
        for (const user of list) {
          insertStmt.run(user.email, user.total_recharge);
          successCount++;
        }
      });
      insertMany(users);
    } catch (error) {
      console.error('导入用户失败:', error);
      cleanupTempFile(req.file.path);
      return res.status(500).json({ error: `导入失败: ${error.message}` });
    }

    cleanupTempFile(req.file.path);
    res.json({
      success: true,
      imported: successCount,
      total: users.length,
      errors: errors.length > 0 ? errors : null
    });
  };

  // Excel 路径（同步解析）
  const ext = path.extname(req.file.originalname || '').toLowerCase();
  if (ext === '.xlsx' || ext === '.xls') {
    try {
      const rows = parseXlsxFile(req.file.path);
      insertRows(rows);
    } catch (error) {
      console.error('解析 Excel 失败:', error);
      cleanupTempFile(req.file.path);
      res.status(500).json({ error: `Excel 解析失败: ${error.message}` });
    }
    return;
  }

  // CSV 路径（流式，兼容 GBK）
  const users = [];
  const errors = [];
  let responded = false;

  const fail = (message, status = 500) => {
    if (responded) return;
    responded = true;
    cleanupTempFile(req.file.path);
    res.status(status).json({ error: message });
  };

  createCsvStream(req.file.path)
    .on('data', (row) => {
      const email = pickField(row, 'email');
      const amountRaw = pickField(row, 'total_recharge', 'recharge_amount', 'amount');
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        users.push({ email, total_recharge: parseAmount(amountRaw) });
      } else {
        errors.push(`无效邮箱: ${email || '(空)'}`);
      }
    })
    .on('end', () => {
      if (responded) return;
      if (users.length === 0) {
        return fail(
          'CSV 中没有可导入的有效数据，请确认表头包含 email 列' +
          (errors.length > 0 ? `（${errors.slice(0, 3).join('; ')}）` : ''),
          400
        );
      }
      let successCount = 0;
      try {
        const insertStmt = db.prepare(
          'INSERT OR REPLACE INTO users (email, total_recharge) VALUES (?, ?)'
        );
        const insertMany = db.transaction((list) => {
          for (const user of list) {
            insertStmt.run(user.email, user.total_recharge);
            successCount++;
          }
        });
        insertMany(users);
      } catch (error) {
        console.error('导入用户失败:', error);
        return fail(`导入失败: ${error.message}`);
      }
      responded = true;
      cleanupTempFile(req.file.path);
      res.json({
        success: true,
        imported: successCount,
        total: users.length,
        errors: errors.length > 0 ? errors : null
      });
    })
    .on('error', (error) => {
      console.error('解析 CSV 失败:', error);
      fail(`CSV 解析失败: ${error.message}`);
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
 * 添加兑换码（单个或批量）
 * 请求体兼容两种形式：
 *   { code: 'ABC123', prize_id: 1 }          单个
 *   { codes: ['ABC', 'DEF'], prize_id: 1 }   批量
 * 已存在的兑换码会被跳过（INSERT OR IGNORE），不影响其余写入。
 */
exports.addCode = (req, res) => {
  const { code, codes, prize_id } = req.body;

  const prizeId = parseInt(prize_id, 10);
  if (!Number.isInteger(prizeId)) {
    return res.status(400).json({ error: '请提供有效的奖项ID' });
  }

  // 显式校验奖项存在：sql.js 的 export() 会关闭并重开连接，
  // PRAGMA foreign_keys 在首次落盘后即失效，不能依赖外键拦截脏数据
  const prizeExists = db.prepare('SELECT id FROM prizes WHERE id = ?').get(prizeId);
  if (!prizeExists) {
    return res.status(400).json({ error: '奖项不存在，请重新选择' });
  }

  // 统一成数组：去空白、丢空值、按首次出现去重
  const rawList = Array.isArray(codes) ? codes : [code];
  const seen = new Set();
  const list = [];
  for (const item of rawList) {
    if (item === undefined || item === null) continue;
    const value = String(item).trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    list.push(value);
  }

  if (list.length === 0) {
    return res.status(400).json({ error: '请提供至少一个兑换码' });
  }

  const isSingle = !Array.isArray(codes) && list.length === 1;

  try {
    const insertStmt = db.prepare(
      'INSERT OR IGNORE INTO redemption_codes (code, prize_id) VALUES (?, ?)'
    );
    let imported = 0;
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        const result = insertStmt.run(item, prizeId);
        if (result.changes > 0) imported++;
      }
    });
    insertMany(list);

    // 单个提交被忽略，说明兑换码已存在，沿用原有报错
    if (isSingle && imported === 0) {
      return res.status(400).json({ error: '该兑换码已存在' });
    }

    res.json({
      success: true,
      imported,
      skipped: list.length - imported,
      total: list.length
    });
  } catch (error) {
    if (error.message.includes('FOREIGN KEY')) {
      return res.status(400).json({ error: '奖项不存在，请重新选择' });
    }
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: '该兑换码已存在' });
    }
    console.error('添加兑换码失败:', error);
    res.status(500).json({ error: '添加兑换码失败' });
  }
};

/**
 * 批量导入兑换码（CSV / Excel .xlsx/.xls）
 */
exports.importCodes = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传 CSV 或 Excel 文件' });
  }

  // 将行数组写入数据库，CSV 和 xlsx 路径共用
  const insertRows = (rows) => {
    const codes = [];
    const errors = [];

    for (const row of rows) {
      const code = pickField(row, 'code');
      const prizeIdRaw = pickField(row, 'prize_id', 'prizeId');
      const prizeId = parseInt(prizeIdRaw, 10);
      if (code && Number.isInteger(prizeId)) {
        codes.push({ code, prize_id: prizeId });
      } else {
        errors.push(`无效数据: ${JSON.stringify(row)}`);
      }
    }

    if (codes.length === 0) {
      cleanupTempFile(req.file.path);
      return res.status(400).json({
        error: '文件中没有可导入的有效数据，请确认表头包含 code 与 prize_id 列' +
          (errors.length > 0 ? `（${errors.slice(0, 3).join('; ')}）` : '')
      });
    }

    let successCount = 0;
    try {
      const insertStmt = db.prepare(
        'INSERT OR IGNORE INTO redemption_codes (code, prize_id) VALUES (?, ?)'
      );
      const insertMany = db.transaction((list) => {
        for (const item of list) {
          const result = insertStmt.run(item.code, item.prize_id);
          if (result.changes > 0) successCount++;
        }
      });
      insertMany(codes);
    } catch (error) {
      console.error('导入兑换码失败:', error);
      cleanupTempFile(req.file.path);
      return res.status(500).json({ error: `导入失败: ${error.message}` });
    }

    cleanupTempFile(req.file.path);
    res.json({
      success: true,
      imported: successCount,
      total: codes.length,
      errors: errors.length > 0 ? errors : null
    });
  };

  // Excel 路径（同步解析）
  const ext = path.extname(req.file.originalname || '').toLowerCase();
  if (ext === '.xlsx' || ext === '.xls') {
    try {
      const rows = parseXlsxFile(req.file.path);
      insertRows(rows);
    } catch (error) {
      console.error('解析 Excel 失败:', error);
      cleanupTempFile(req.file.path);
      res.status(500).json({ error: `Excel 解析失败: ${error.message}` });
    }
    return;
  }

  // CSV 路径（流式，兼容 GBK）
  const codes = [];
  const errors = [];
  let responded = false;

  const fail = (message, status = 500) => {
    if (responded) return;
    responded = true;
    cleanupTempFile(req.file.path);
    res.status(status).json({ error: message });
  };

  createCsvStream(req.file.path)
    .on('data', (row) => {
      const code = pickField(row, 'code');
      const prizeIdRaw = pickField(row, 'prize_id', 'prizeId');
      const prizeId = parseInt(prizeIdRaw, 10);
      if (code && Number.isInteger(prizeId)) {
        codes.push({ code, prize_id: prizeId });
      } else {
        errors.push(`无效数据: ${JSON.stringify(row)}`);
      }
    })
    .on('end', () => {
      if (responded) return;
      if (codes.length === 0) {
        return fail(
          'CSV 中没有可导入的有效数据，请确认表头包含 code 与 prize_id 列' +
          (errors.length > 0 ? `（${errors.slice(0, 3).join('; ')}）` : ''),
          400
        );
      }
      let successCount = 0;
      try {
        const insertStmt = db.prepare(
          'INSERT OR IGNORE INTO redemption_codes (code, prize_id) VALUES (?, ?)'
        );
        const insertMany = db.transaction((list) => {
          for (const item of list) {
            const result = insertStmt.run(item.code, item.prize_id);
            if (result.changes > 0) successCount++;
          }
        });
        insertMany(codes);
      } catch (error) {
        console.error('导入兑换码失败:', error);
        return fail(`导入失败: ${error.message}`);
      }
      responded = true;
      cleanupTempFile(req.file.path);
      res.json({
        success: true,
        imported: successCount,
        total: codes.length,
        errors: errors.length > 0 ? errors : null
      });
    })
    .on('error', (error) => {
      console.error('解析 CSV 失败:', error);
      fail(`CSV 解析失败: ${error.message}`);
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
  const adminId = req.user && req.user.id; // 从 JWT 中获取（authMiddleware 挂在 req.user）

  if (!adminId) {
    return res.status(401).json({ error: '认证信息无效，请重新登录' });
  }

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

/**
 * 获取花样道具列表（含禁用项，仅管理员）
 */
exports.getDecoys = (req, res) => {
  try {
    const decoys = db.prepare(
      'SELECT * FROM slot_decoys ORDER BY sort_order ASC, id ASC'
    ).all();
    res.json(decoys);
  } catch (error) {
    console.error('获取花样道具失败:', error);
    res.status(500).json({ error: '获取花样道具失败' });
  }
};

/**
 * 新增花样道具
 */
/**
 * 归一化角标文字：空/空白 = 不显示角标，最长 12 字
 * 前台只在这个值非空时才渲染角标，不再写死任何文案
 */
const normalizeBadgeText = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim().slice(0, 12);
};

exports.addDecoy = (req, res) => {
  const { icon, label, badge_text, sort_order = 0, enabled = 1 } = req.body;
  if (!icon || !label) {
    return res.status(400).json({ error: '请提供图标和文字标签' });
  }
  try {
    const result = db.prepare(
      'INSERT INTO slot_decoys (icon, label, badge_text, sort_order, enabled) VALUES (?, ?, ?, ?, ?)'
    ).run(icon.trim(), label.trim(), normalizeBadgeText(badge_text), sort_order, enabled ? 1 : 0);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('新增花样道具失败:', error);
    res.status(500).json({ error: '新增花样道具失败' });
  }
};

/**
 * 更新花样道具
 */
exports.updateDecoy = (req, res) => {
  const { id } = req.params;
  const { icon, label, badge_text, sort_order, enabled } = req.body;
  if (!icon || !label) {
    return res.status(400).json({ error: '请提供图标和文字标签' });
  }
  try {
    db.prepare(
      'UPDATE slot_decoys SET icon = ?, label = ?, badge_text = ?, sort_order = ?, enabled = ? WHERE id = ?'
    ).run(icon.trim(), label.trim(), normalizeBadgeText(badge_text), sort_order ?? 0, enabled ? 1 : 0, id);
    res.json({ success: true });
  } catch (error) {
    console.error('更新花样道具失败:', error);
    res.status(500).json({ error: '更新花样道具失败' });
  }
};

/**
 * 删除花样道具
 */
exports.deleteDecoy = (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM slot_decoys WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('删除花样道具失败:', error);
    res.status(500).json({ error: '删除花样道具失败' });
  }
};

/**
 * 上传自定义图标（SVG）
 * multer diskStorage 已将文件写到 uploads/icons/<uuid>.svg
 * 直接返回可供前端使用的静态路径
 */
exports.uploadIcon = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有收到上传文件' });
  }
  res.json({ url: `/uploads/icons/${req.file.filename}` });
};
