const pdf = require('pdf-parse');
const axios = require('axios');
const llmConfig = require('../llmConfig.json');

/**
 * 長文テキストを指定文字数ごとに分割するヘルパー関数
 */
function chunkText(text, chunkSize = 4000) {
  const chunks = [];
  let index = 0;
  while (index < text.length) {
    chunks.push(text.slice(index, index + chunkSize));
    index += chunkSize;
  }
  return chunks;
}

/**
 * PDFバッファからテキストを抽出し、分割要約を経て最終サマリーを生成する
 */
async function processPdfAndSummarize(buffer, onProgress = () => {}) {
  // 1. PDFからテキスト抽出
  const pdfData = await pdf(buffer);
  const extractedText = pdfData.text;

  if (!extractedText.trim()) {
    throw new Error('PDFからテキストを抽出できませんでした。');
  }

  // 2. テキストを約4,000文字単位で分割
  const chunks = chunkText(extractedText, 4000);
  const intermediateSummaries = [];

  // 3. 各チャンクごとに個別にOllamaへ投げて部分要約（Mapフェーズ）
  for (let i = 0; i < chunks.length; i++) {

    const percent = Math.floor(5 + ((i + 1) / chunks.length) * 75);
    onProgress(percent, `パーツ ${i + 1} / ${chunks.length} をAI分析中...`);



          const response = await axios.post(
      `${llmConfig.ollamaHost}/api/chat`,
      {
        model: llmConfig.model,
        messages: [
          {
            role: 'system',
            content: 'あなたは医療アシスタントです。提出された文章の重要情報を漏らさず簡潔に整理してください。'
          },
          {
            role: 'user',
            content: `以下は長文ドキュメントのパート${i + 1}です。要点を抽出してください：\n\n${chunks[i]}`
          }
        ],
        options: { num_ctx: 8192 },
        stream: false
      },
      { timeout: 0 } // ★ タイムアウト完全無制限化
    );

    intermediateSummaries.push(response.data.message.content);
  }

  // 分割が1つの場合はそのまま返却、複数の場合は統合作成（Reduceフェーズ）
  let finalSummary = intermediateSummaries[0];

  if (intermediateSummaries.length > 1) {

          onProgress(85, '分割した要約を統合し、最終サマリーを作成中...');

    const combinedSummaryText = intermediateSummaries
      .map((sum, idx) => `【パート${idx + 1}の要約】\n${sum}`)
      .join('\n\n');

    const finalResponse = await axios.post(
      `${llmConfig.ollamaHost}/api/chat`,
      {
        model: llmConfig.model,
        messages: [
          {
            role: 'system',
            content: llmConfig.systemPrompt
          },
          {
            role: 'user',
            content: `${llmConfig.userPromptTemplate}\n\n以下は各章の要約一覧です。これらを統合し、時系列や医療経過が分か
る最終サマリーを作成してください：\n\n${combinedSummaryText}`
          }
        ],
        options: { num_ctx: 16384 },
        stream: false
      },
      { timeout: 0 } // ★ タイムアウト完全無制限化
    );

    finalSummary = finalResponse.data.message.content;
  }

  return {
    totalPages: pdfData.numpages,
    summary: finalSummary
  };
}

module.exports = {
  processPdfAndSummarize
};
