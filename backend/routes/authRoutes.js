const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// 登录（不需要认证）
router.post('/login', adminController.login);

module.exports = router;
