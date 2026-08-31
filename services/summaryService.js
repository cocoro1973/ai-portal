const pdf = require('pdf-parse');
const { Ollama } = require('ollama');
const llmConfig = require('../llmConfig.json');

const ollama = new Ollama();

/**
 * PDFバッファからテキストを抽出し、Ollamaで要約を生成する
 */
async function processPdfAndSummarize(buffer) {
  // 1. PDFからテキスト抽出
  const pdfData = await pdf(buffer);
  const extractedText = pdfData.text;

  if (!extractedText.trim()) {
    throw new Error('PDFからテキストを抽出できませんでした。');
  }

  // 2. Ollama呼び出し
  const response = await ollama.chat({
    model: llmConfig.model, // または elyza:8b / alibayram/medgemma:4b
    messages: [
      {
        role: 'system',
        content: llmConfig.systemPrompt
      },
      {
        role: 'user',
        content: `${llmConfig.userPromptTemplate}\n${extractedText}`
      }
    ]
  });

  return {
    totalPages: pdfData.numpages,
    summary: response.message.content
  };
}

module.exports = {
  processPdfAndSummarize
};