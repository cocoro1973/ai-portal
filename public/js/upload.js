document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const uploadBtn = document.getElementById('upload-btn');
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');
  let selectedFile = null;

  // scriptタグから送信先APIを取得（未指定の場合はデフォルトで通常PDF用API）
  const scriptTag = document.querySelector('script[src="/js/upload.js"]');
  const apiEndpoint = scriptTag ? (scriptTag.dataset.endpoint || '/api/summarize-pdf') : '/api/summarize-pdf';

  // クリックでファイル選択を開く
  dropZone.addEventListener('click', () => fileInput.click());

  // ファイル選択イベント
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
  });

  // ドラッグ＆ドロップ関連イベント
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]);
  });

  function handleFileSelect(file) {
    if (file.type !== 'application/pdf') {
      alert('PDFファイルを選択してください。');
      return;
    }
    selectedFile = file;
    document.getElementById('drop-text').innerHTML = `選択中のファイル:<br><strong>${file.name}</strong>`;
    uploadBtn.disabled = false;
  }

  // アップロード・要約実行ボタン
  uploadBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('pdf', selectedFile);

    uploadBtn.disabled = true;

    // OCRの場合は時間がかかるためメッセージを変更
    statusDiv.innerText = apiEndpoint.includes('image')
      ? '画像を文字認識(OCR)して解析中...（数十秒〜数分かかる場合があります）'
      : 'PDFを解析して要約中...';

    resultDiv.style.display = 'none';

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '通信エラー');

      statusDiv.innerText = `解析完了 (${data.filename} - 全${data.totalPages}ページ)`;
      resultDiv.innerText = data.summary;
      resultDiv.style.display = 'block';
    } catch (error) {
      statusDiv.innerText = `エラー: ${error.message}`;
    } finally {
      uploadBtn.disabled = false;
    }
  });
});