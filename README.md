# X (Twitter) MCP Server

X (旧Twitter) APIを利用するためのModel Context Protocol (MCP) サーバーです。Claude DesktopなどのMCPクライアントから、ツイートの投稿、検索、タイムライン取得などの操作を行えます。

## 機能

このMCPサーバーは以下のツールを提供します：

- **post_tweet**: ツイート（ポスト）を投稿
- **get_home_timeline**: ホームタイムラインを取得
- **get_user_tweets**: 指定したユーザーの最新ツイートを取得
- **search_tweets**: キーワードでツイートを検索
- **get_user_info**: 指定したユーザーの情報を取得
- **like_tweet**: ツイートにいいね
- **retweet**: ツイートをリツイート

## セットアップ

### 1. 前提条件

- Node.js 18.0.0以上
- X (Twitter) Developer アカウントとAPIキー

### 2. X Developer Portal でAPIキーを取得

1. [X Developer Portal](https://developer.x.com/en/portal/dashboard) にアクセス
2. アプリを作成または既存のアプリを選択
3. 以下の認証情報を取得：
   - API Key (Consumer Key)
   - API Secret (Consumer Secret)
   - Access Token
   - Access Token Secret

### 3. 依存パッケージのインストール

```bash
npm install
```

### 4. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成し、取得したAPIキーを設定します：

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```env
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here
```

### 5. ビルド

```bash
npm run build
```

## Claude Desktopでの使用方法

### 1. Claude Desktop設定ファイルを開く

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

### 2. 設定を追加

設定ファイルに以下を追加します（パスは適宜変更してください）：

**macOS/Linux:**
```json
{
  "mcpServers": {
    "x-twitter": {
      "command": "node",
      "args": ["/Users/username/path/to/x-mcp-server/dist/index.js"],
      "env": {
        "TWITTER_API_KEY": "your_api_key",
        "TWITTER_API_SECRET": "your_api_secret",
        "TWITTER_ACCESS_TOKEN": "your_access_token",
        "TWITTER_ACCESS_TOKEN_SECRET": "your_access_token_secret"
      }
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "x-twitter": {
      "command": "node",
      "args": ["C:\\Users\\username\\path\\to\\x-mcp-server\\dist\\index.js"],
      "env": {
        "TWITTER_API_KEY": "your_api_key",
        "TWITTER_API_SECRET": "your_api_secret",
        "TWITTER_ACCESS_TOKEN": "your_access_token",
        "TWITTER_ACCESS_TOKEN_SECRET": "your_access_token_secret"
      }
    }
  }
}
```

### 3. Claude Desktopを再起動

設定を反映させるため、Claude Desktopを完全に再起動します。

**macOS:**
- Claude メニュー → "Quit Claude" を選択
- Claude Desktopを再度起動

**Windows:**
- タスクマネージャーでClaude Desktopのプロセスを完全に終了
- Claude Desktopを再度起動

### 4. 動作確認

Claude Desktopを起動後、入力欄の左下にツールアイコン（🔨）が表示されているか確認してください。

## 使用例

Claude Desktopで以下のように話しかけてみてください：

```
「最新のホームタイムラインを10件取得して」

「"AI技術"で検索して最新のツイートを5件表示して」

「@example_userの最新ツイートを取得して」

「@example_userのプロフィール情報を教えて」

「こんにちは、MCPサーバーのテストです！」というツイートを投稿して
```

## トラブルシューティング

### サーバーが認識されない場合

1. Claude Desktopを完全に再起動
2. `claude_desktop_config.json`の構文エラーを確認
3. パスが正しいか確認（絶対パスを使用）
4. ログを確認：
   - **macOS:** `~/Library/Logs/Claude/mcp*.log`
   - **Windows:** `%APPDATA%\Claude\logs\mcp*.log`

### APIエラーが発生する場合

1. 環境変数が正しく設定されているか確認
2. X Developer Portalでアプリの権限を確認（Read and Write権限が必要）
3. APIキーが有効か確認

### 手動でサーバーをテストする

```bash
# 開発モードで実行
npm run dev

# または、ビルド後に実行
npm run build
node dist/index.js
```

## 開発

### ウォッチモードでの開発

```bash
npm run watch
```

別のターミナルで：

```bash
npm run dev
```

## ライセンス

MIT

## 作者

Hosaka Keigo <hosaka@piano.or.jp>
