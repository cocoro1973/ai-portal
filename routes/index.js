const express = require('express');
const router = express.Router();

// TOP画面の表示
router.get('/', (req, res) => {
  res.render('index');
});

// ★ 追加: スキャン画像PDF(OCR)要約画面
router.get('/ocr-summary', (req, res) => {
  res.render('ocr-summary');
});

// ★ AIチャット画面を追加
router.get('/chat', (req, res) => {
  res.render('chat');
});

module.exports = router;
