const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/lottery.db');
let db = null;

// 初始化 SQL.js 数据库
async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  // 如果数据库文件存在，加载它
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    // 创建新数据库
    db = new SQL.Database();
  }

  return db;
}

// 保存数据库到文件
function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, buffer);
}

// 执行查询的辅助函数
function execQuery(sql, params = []) {
  try {
    if (params.length > 0) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const result = [];
      while (stmt.step()) {
        result.push(stmt.getAsObject());
      }
      stmt.free();
      return result;
    } else {
      db.run(sql);
      return [];
    }
  } catch (error) {
    console.error('SQL Error:', error);
    throw error;
  }
}

// 初始化数据库表
async function initDatabase() {
  console.log('Initializing database...');

  await getDb();

  // 启用外键约束
  db.run('PRAGMA foreign_keys = ON');

  // 1. 管理员表
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. 抽奖配置表
  db.run(`
    CREATE TABLE IF NOT EXISTS lottery_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lottery_mode TEXT DEFAULT 'recharge' CHECK(lottery_mode IN ('recharge', 'free')),
      min_recharge REAL DEFAULT 0,
      reject_message TEXT DEFAULT '您的累计充值未达到抽奖门槛',
      max_winners INTEGER DEFAULT 0,
      limit_reached_message TEXT DEFAULT '抽奖活动已结束，感谢参与',
      thanks_message TEXT DEFAULT '谢谢参与，再接再厉！',
      currency_symbol TEXT DEFAULT '¥',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      total_recharge REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 4. 奖项配置表
  db.run(`
    CREATE TABLE IF NOT EXISTS prizes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prize_name TEXT NOT NULL,
      prize_amount REAL DEFAULT 0,
      prize_icon TEXT DEFAULT '🎁',
      win_rate REAL NOT NULL CHECK(win_rate >= 0 AND win_rate <= 100),
      level INTEGER DEFAULT 0,
      is_thanks BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. 兑换码表
  db.run(`
    CREATE TABLE IF NOT EXISTS redemption_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      prize_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'issued')),
      issued_to TEXT,
      issued_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (prize_id) REFERENCES prizes(id) ON DELETE CASCADE
    )
  `);

  // 6. 抽奖记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS lottery_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      prize_id INTEGER,
      code_id INTEGER,
      is_thanks BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (prize_id) REFERENCES prizes(id),
      FOREIGN KEY (code_id) REFERENCES redemption_codes(id)
    )
  `);

  // 插入默认配置
  const configResult = db.exec('SELECT COUNT(*) as count FROM lottery_config');
  const configCount = configResult.length > 0 ? configResult[0].values[0][0] : 0;

  if (configCount === 0) {
    db.run(`
      INSERT INTO lottery_config (lottery_mode, min_recharge, max_winners, currency_symbol)
      VALUES ('recharge', 100, 1000, '¥')
    `);
    console.log('✓ Default lottery config created');
  }

  // 创建默认管理员账号
  const adminResult = db.exec('SELECT COUNT(*) as count FROM admins');
  const adminCount = adminResult.length > 0 ? adminResult[0].values[0][0] : 0;

  if (adminCount === 0) {
    const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

    const stmt = db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)');
    stmt.bind([defaultUsername, hashedPassword]);
    stmt.step();
    stmt.free();

    console.log(`✓ Default admin created: ${defaultUsername} / ${defaultPassword}`);
  }

  // 创建默认奖项（如果没有）
  const prizeResult = db.exec('SELECT COUNT(*) as count FROM prizes');
  const prizeCount = prizeResult.length > 0 ? prizeResult[0].values[0][0] : 0;

  if (prizeCount === 0) {
    const defaultPrizes = [
      { name: '一等奖', amount: 1000, icon: '💎', rate: 5, level: 1 },
      { name: '二等奖', amount: 500, icon: '🏆', rate: 10, level: 2 },
      { name: '三等奖', amount: 100, icon: '💰', rate: 15, level: 3 },
      { name: '四等奖', amount: 50, icon: '🎁', rate: 20, level: 4 },
      { name: '谢谢参与', amount: 0, icon: '😊', rate: 50, level: 99, is_thanks: 1 }
    ];

    for (const prize of defaultPrizes) {
      const stmt = db.prepare(`
        INSERT INTO prizes (prize_name, prize_amount, prize_icon, win_rate, level, is_thanks)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.bind([prize.name, prize.amount, prize.icon, prize.rate, prize.level, prize.is_thanks || 0]);
      stmt.step();
      stmt.free();
    }
    console.log('✓ Default prizes created');
  }

  // 保存数据库到文件
  saveDb();
  console.log('Database initialized successfully!');
}

// 创建一个兼容 better-sqlite3 API 的包装器
const dbWrapper = {
  prepare: (sql) => {
    return {
      get: (...params) => {
        if (!db) throw new Error('Database not initialized');
        const stmt = db.prepare(sql);
        stmt.bind(params);
        let result = null;
        if (stmt.step()) {
          result = stmt.getAsObject();
        }
        stmt.free();
        return result;
      },
      all: (...params) => {
        if (!db) throw new Error('Database not initialized');
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      },
      run: (...params) => {
        if (!db) throw new Error('Database not initialized');
        const stmt = db.prepare(sql);
        stmt.bind(params);
        stmt.step();
        stmt.free();
        saveDb();
        return { changes: db.getRowsModified(), lastInsertRowid: null };
      }
    };
  },
  exec: (sql) => {
    if (!db) throw new Error('Database not initialized');
    db.run(sql);
    saveDb();
  }
};

// 如果直接运行此文件，则初始化数据库
if (require.main === module) {
  initDatabase().then(() => {
    console.log('Done!');
    process.exit(0);
  }).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

module.exports = { db: dbWrapper, getDb, saveDb, initDatabase };
