const { pdf } = require('pdf-to-img');
const { createWorker } = require('tesseract.js');
const { Ollama } = require('ollama');
const llmConfig = require('../llmConfig.json');

const ollama = new Ollama();

/**
 * 画像PDFからOCRでテキストを抽出し、LLMで要約する
 */
async function processImagePdfAndSummarize(pdfBuffer) {
  // 1. PDFバッファをページ画像ストリームに変換 (pdf-to-img を使用)
  console.log('PDFを画像に変換中...');
  const document = await pdf(pdfBuffer, { scale: 2.0 });

  // 2. Tesseractワーカー初期化
  const worker = await createWorker('jpn');
  let fullExtractedText = '';
  let pageIndex = 1;

  // 3. ページごとにOCR処理
  for await (const image of document) {
    console.log(`Page ${pageIndex} をOCR解析中...`);
    const ret = await worker.recognize(image);
    fullExtractedText += `\n--- Page ${pageIndex} ---\n` + ret.data.text;
    pageIndex++;
  }

  await worker.terminate();

  if (!fullExtractedText.trim()) {
    throw new Error('画像PDFからテキストを検出できませんでした。');
  }

  console.log('OCR処理完了。Ollamaへ送信します...');

  // 4. Ollamaで要約
  const response = await ollama.chat({
    model: llmConfig.model,
    messages: [
      {
        role: 'system',
        content: llmConfig.ocrSystemPrompt
      },
      {
        role: 'user',
        content: `${llmConfig.userPromptTemplate}\n${fullExtractedText}`
      }
    ]
  });

  return {
    totalPages: pageIndex - 1,
    summary: response.message.content
  };
}


module.exports = {
  processImagePdfAndSummarize
};