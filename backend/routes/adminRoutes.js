const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');

// 配置文件上传
const upload = multer({ dest: 'uploads/' });

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

module.exports = router;
