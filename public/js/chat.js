document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chat-box');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');

  // 会話履歴を保持する配列
  let conversationHistory = [];

  // Shift+Enterで改行、Enter単体で送信
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageText = userInput.value.trim();
    if (!messageText) return;

    // 1. ユーザーのメッセージを画面と履歴に追加
    appendMessage('user', messageText);
    conversationHistory.push({ role: 'user', content: messageText });
    userInput.value = '';
    userInput.style.height = 'auto';

    // 2. ローディングメッセージを表示
    const loadingDiv = appendMessage('assistant loading', 'AIが思考中...');
    sendBtn.disabled = true;

    try {
      // 3. API呼出
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '通信エラーが発生しました');

      // 4. ローディング消去 & AIの回答を表示
      loadingDiv.remove();
      appendMessage('assistant', data.reply);
      conversationHistory.push({ role: 'assistant', content: data.reply });

    } catch (error) {
      loadingDiv.remove();
      appendMessage('assistant error', `エラー: ${error.message}`);
    } finally {
      sendBtn.disabled = false;
      userInput.focus();
    }
  });

  /**
   * 画面にメッセージバブルを追加して最下部へスクロール
   */
  function appendMessage(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    // 改行コードを <br> に変換して表示
    bubbleDiv.innerHTML = text.replace(/\n/g, '<br>');

    messageDiv.appendChild(bubbleDiv);
    chatBox.appendChild(messageDiv);

    // 最下部へ自動スクロール
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageDiv;
  }
});