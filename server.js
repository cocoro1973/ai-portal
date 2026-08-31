const express = require('express');
const path = require('path');

const indexRoutes = require('./routes/index');
const apiRoutes = require('./routes/api');

const app = express();
const port = 3000;

// EJS & 静的ファイル（publicフォルダ）の設定
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ルーティングの登録
app.use('/', indexRoutes);
app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`サーバー起動: http://localhost:${port}`);
});