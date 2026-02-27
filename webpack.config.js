module.exports = {
  // モードの設定、v4系以降はmodeを指定しないと、webpack実行時に警告が出る
  mode: 'development',
  // エントリーポイントの設定
  entry: './src/omljs.mjs',
  // 出力の設定
  output: {
    // 出力するファイル名
    filename: 'bundle.js'
  }
};
