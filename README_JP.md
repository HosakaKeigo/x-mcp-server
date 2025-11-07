# X (Twitter) MCP Server

X (旧Twitter) APIを利用するためのModel Context Protocol (MCP) サーバーです。Claude DesktopなどのMCPクライアントから、ツイートの投稿、検索、タイムライン取得などの操作を行えます。

## 特徴

- **拡張性の高い設計**: クラスベースの実装により、新しいツールの追加が容易
- **型安全**: TypeScriptとZodによる厳密な型チェック
- **コード品質管理**: Biomeによるリンティングとフォーマット
- **エラーハンドリング**: 統一されたエラー処理

## 機能

このMCPサーバーは以下のツールを提供します：

| ツール名 | 説明 |
|---------|------|
| `post_tweet` | ツイート（ポスト）を投稿 |
| `get_home_timeline` | ホームタイムラインを取得 |
| `get_user_tweets` | 指定したユーザーの最新ツイートを取得 |
| `search_tweets` | キーワードでツイートを検索 |
| `get_user_info` | 指定したユーザーの情報を取得 |
| `like_tweet` | ツイートにいいね |
| `retweet` | ツイートをリツイート |

## プロジェクト構造

```
x-mcp-server/
┣ src/
┃ ┣ tools/           # ツール実装（各ツールがクラスとして定義）
┃ ┃ ┣ index.ts       # ツール登録関数
┃ ┃ ┣ post-tweet.ts
┃ ┃ ┣ get-home-timeline.ts
┃ ┃ ┣ get-user-tweets.ts
┃ ┃ ┣ search-tweets.ts
┃ ┃ ┣ get-user-info.ts
┃ ┃ ┣ like-tweet.ts
┃ ┃ ┗ retweet.ts
┃ ┣ types/           # 型定義
┃ ┃ ┗ index.ts       # IMCPTool等のインターフェース
┃ ┣ utils/           # ユーティリティ関数
┃ ┃ ┗ error-handler.ts
┃ ┗ index.ts         # メインエントリーポイント
┣ .env.example       # 環境変数のテンプレート
┣ biome.json         # Biome設定
┣ package.json
┣ tsconfig.json
┣ README.md          # 英語版README
┗ README_JP.md       # このファイル
```

## セットアップ

### 1. 前提条件

- Node.js 18.0.0以上
- pnpm（推奨）または npm
- X (Twitter) Developer アカウントとAPIキー

### 2. X Developer Portal でAPIキーを取得

1. [X Developer Portal](https://developer.x.com/en/portal/dashboard) にアクセス
2. アプリを作成または既存のアプリを選択
3. 以下の認証情報を取得：
   - API Key (Consumer Key)
   - API Secret (Consumer Secret)
   - Access Token
   - Access Token Secret
4. アプリの権限を **Read and Write** に設定

### 3. 依存パッケージのインストール

```bash
# pnpmがない場合はインストール
npm install -g pnpm

# 依存関係をインストール
pnpm install
```

### 4. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成し、取得したAPIキーを設定します：

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```env
X_API_KEY=your_api_key_here
X_API_SECRET=your_api_secret_here
X_ACCESS_TOKEN=your_access_token_here
X_ACCESS_TOKEN_SECRET=your_access_token_secret_here
```

### 5. ビルド

```bash
pnpm build
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
        "X_API_KEY": "your_api_key",
        "X_API_SECRET": "your_api_secret",
        "X_ACCESS_TOKEN": "your_access_token",
        "X_ACCESS_TOKEN_SECRET": "your_access_token_secret"
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
        "X_API_KEY": "your_api_key",
        "X_API_SECRET": "your_api_secret",
        "X_ACCESS_TOKEN": "your_access_token",
        "X_ACCESS_TOKEN_SECRET": "your_access_token_secret"
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

Claude Desktopを起動後、入力欄の左下にハンマーアイコン（🔨）が表示されているか確認してください。

## 使用例

Claude Desktopで以下のように話しかけてみてください：

```
「最新のホームタイムラインを10件取得して」

「"AI技術"で検索して最新のツイートを5件表示して」

「@example_userの最新ツイートを取得して」

「@example_userのプロフィール情報を教えて」

「こんにちは、MCPサーバーのテストです！」というツイートを投稿して
```

## 開発

### コマンド一覧

```bash
# ビルド
pnpm build

# 開発モード（ウォッチモード）
pnpm watch

# 開発サーバー起動
pnpm dev

# コード品質チェック
pnpm check

# フォーマット
pnpm format

# リンティング
pnpm lint
```

### 新しいツールの追加方法

1. `src/tools/`に新しいツールファイルを作成
2. `IMCPTool`インターフェースを実装
3. `src/tools/index.ts`の`ALL_TOOLS`配列に追加

**例: 新しいツールの実装**

```typescript
// src/tools/my-new-tool.ts
import type { TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { TwitterApi } from "twitter-api-v2";
import { z } from "zod";
import type { IMCPTool, InferZodParams } from "../types/index.js";
import { createErrorResponse } from "../utils/error-handler.js";

/**
 * 新しいツールの説明
 */
export class MyNewTool implements IMCPTool {
  readonly name = "my_new_tool";
  readonly description = "新しいツールの説明";
  readonly parameters = {
    param1: z.string().describe("パラメータ1の説明"),
  } as const;

  constructor(private client: TwitterApi) {}

  async execute(args: InferZodParams<typeof this.parameters>) {
    try {
      // ツールの実装
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ success: true }, null, 2),
          },
        ],
      };
    } catch (error) {
      return createErrorResponse(error, "エラーメッセージ");
    }
  }
}
```

## トラブルシューティング

### サーバーが認識されない場合

1. Claude Desktopを完全に再起動
2. `claude_desktop_config.json`の構文エラーを確認
3. パスが正しいか確認（絶対パスを使用）
4. ログを確認：
   - **macOS:** `~/Library/Logs/Claude/mcp*.log`
   - **Windows:** `%APPDATA%\Claude\logs\mcp*.log`

```bash
# macOS/Linuxでログを確認
tail -n 20 -f ~/Library/Logs/Claude/mcp*.log

# Windowsでログを確認
type "%APPDATA%\Claude\logs\mcp*.log"
```

### APIエラーが発生する場合

1. 環境変数が正しく設定されているか確認
2. X Developer Portalでアプリの権限を確認（Read and Write権限が必要）
3. APIキーが有効か確認
4. レート制限に達していないか確認

### 手動でサーバーをテストする

```bash
# 開発モードで実行
pnpm dev

# または、ビルド後に実行
pnpm build
node dist/index.js
```

サーバーが正常に起動すると、以下のようなメッセージが表示されます：

```
x-mcp-server v0.1.0 starting...
x-mcp-server connected and ready
```

## アーキテクチャ

### 設計思想

このプロジェクトは、拡張性とメンテナンス性を重視した設計になっています：

1. **クラスベースの実装**: 各ツールを独立したクラスとして実装
2. **インターフェース駆動**: `IMCPTool`インターフェースによる統一されたAPI
3. **型安全**: Zodスキーマと`InferZodParams`による型推論
4. **関心の分離**: ツール、型定義、ユーティリティを明確に分離

### 主要コンポーネント

- **IMCPTool**: ツールの共通インターフェース
- **InferZodParams**: Zodスキーマから型を自動推論
- **registerTools**: ツールの一括登録関数
- **createErrorResponse**: 統一されたエラーレスポンス生成

## ライセンス

MIT

## 作者

Hosaka Keigo <hosaka@piano.or.jp>

## 参考資料

- [Model Context Protocol (MCP) 公式ドキュメント](https://modelcontextprotocol.io/)
- [X (Twitter) API Documentation](https://developer.x.com/en/docs)
- [Claude Desktop](https://claude.ai/download)
