const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');

// CSV / Excel 导入上传（原有）
const upload = multer({ dest: 'uploads/' });

// 图标上传：存到 uploads/icons/，以随机 hex + .svg 命名，防止覆盖
const iconStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'icons');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${crypto.randomBytes(16).toString('hex')}.svg`);
  }
});
const iconUpload = multer({
  storage: iconStorage,
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === 'image/svg+xml' || file.originalname.toLowerCase().endsWith('.svg');
    ok ? cb(null, true) : cb(new Error('只支持 SVG 格式'));
  },
  limits: { fileSize: 1 * 1024 * 1024 } // 最大 1 MB
});

// 所有管理后台路由都需要认证
router.use(authenticateToken);

// 配置管理
router.get('/config', adminController.getConfig);
router.put('/config', adminController.updateConfig);

// 奖项管理
router.get('/prizes', adminController.getPrizes);
router.post('/prizes', adminController.addPrize);
router.put('/prizes/:id', adminController.updatePrize);
router.delete('/prizes/:id', adminController.deletePrize);

// 用户管理
router.get('/users', adminController.getUsers);
router.post('/users', adminController.addUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/batch-delete', adminController.batchDeleteUsers);
router.post('/users/import', upload.single('file'), adminController.importUsers);

// 兑换码管理
router.get('/codes', adminController.getCodes);
router.post('/codes', adminController.addCode);
router.post('/codes/import', upload.single('file'), adminController.importCodes);

// 抽奖记录
router.get('/records', adminController.getLotteryRecords);

// 统计数据
router.get('/stats', adminController.getStats);

// 修改密码
router.put('/change-password', adminController.changePassword);

// 花样道具管理
router.get('/decoys', adminController.getDecoys);
router.post('/decoys', adminController.addDecoy);
router.put('/decoys/:id', adminController.updateDecoy);
router.delete('/decoys/:id', adminController.deleteDecoy);

// 自定义图标上传（SVG）
router.post('/upload-icon', iconUpload.single('icon'), adminController.uploadIcon);

module.exports = router;
