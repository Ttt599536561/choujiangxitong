const express = require('express');
const router = express.Router();
const lotteryController = require('../controllers/lotteryController');

// 获取抽奖配置（公开接口）
router.get('/config', lotteryController.getLotteryConfig);

// 获取奖项列表（公开接口）
router.get('/prizes', lotteryController.getPrizes);

// 获取花样道具列表（公开接口）
router.get('/decoys', lotteryController.getDecoys);

// 执行抽奖
router.post('/draw', lotteryController.performLottery);

module.exports = router;
