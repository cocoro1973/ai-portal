const { Ollama } = require('ollama');
const llmConfig = require('../llmConfig.json');

const ollama = new Ollama();

/**
 * チャット履歴を受け取り、Ollamaから応答を得る
 * @param {Array<{role: string, content: string}>} history 
 */
async function sendChatMessage(history) {
  // システムプロンプトを先頭に挿入（設定ファイルにあれば）
  const messages = [
    {
      role: 'system',
      content: llmConfig.chatSystemPrompt || 'あなたは優秀な医療・診療支援AIアシスタントです。丁寧かつ正確に回答してください。'
    },
    ...history
  ];

  const response = await ollama.chat({
    model: llmConfig.model,
    messages: messages
  });

  return response.message.content;
}

module.exports = {
  sendChatMessage
};