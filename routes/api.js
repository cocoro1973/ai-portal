const express = require('express');
const router = express.Router();
const multer = require('multer');

const summaryService = require('../services/summaryService');
const ocrSummaryService = require('../services/ocrSummaryService');
const chatService = require('../services/chatService');

const upload = multer({ storage: multer.memoryStorage() });

// PDFアップロード ＆ 要約API
router.post('/summarize-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDFファイルがアップロードされていません。' });
    }

    const result = await summaryService.processPdfAndSummarize(req.file.buffer);

    res.json({
      filename: req.file.originalname,
      totalPages: result.totalPages,
      summary: result.summary
    });

  } catch (error) {
    console.error('APIエラー:', error);
    res.status(500).json({ error: error.message || '処理中にエラーが発生しました。' });
  }
});

// ★ 追加: 画像PDF (OCR) 用エンドポイント
router.post('/summarize-image-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ファイルが選択されていません。' });
    }

    const result = await ocrSummaryService.processImagePdfAndSummarize(req.file.buffer);

    res.json({
      filename: req.file.originalname,
      totalPages: result.totalPages,
      summary: result.summary
    });

  } catch (error) {
    console.error('OCR APIエラー:', error);
    res.status(500).json({ error: error.message || 'OCR処理中にエラーが発生しました。' });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'メッセージ履歴が正しく送信されていません。' });
    }

    const reply = await chatService.sendChatMessage(messages);

    res.json({ reply });
  } catch (error) {
    console.error('チャットAPIエラー:', error);
    res.status(500).json({ error: error.message || 'AIの応答作成中にエラーが発生しました。' });
  }
  
});

module.exports = router;