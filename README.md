# X (Twitter) MCP Server

This is a Model Context Protocol (MCP) server for the X (formerly Twitter) API. From an MCP client such as Claude Desktop you can post tweets, read timelines, search posts, and more.

## Features

This MCP server exposes the following tools:

- **post_tweet**: Post (publish) a tweet
- **get_home_timeline**: Fetch the authenticated user's home timeline
- **get_user_tweets**: Fetch the latest tweets for a specific user
- **search_tweets**: Search tweets by keyword
- **get_user_info**: Fetch information for a specific user
- **like_tweet**: Like a tweet
- **retweet**: Retweet a tweet

| Tool | Description | Key rate limits (Pro / Basic / Free) |
| --- | --- | --- |
| `post_tweet` | Create a new tweet with arbitrary text | Pro: 100 req/15 min (per user) · 10,000 req/24 h (per app)<br>Basic: 100 req/24 h (per user) · 1,667 req/24 h (per app)<br>Free: 17 req/24 h (per user/app) |
| `get_home_timeline` | Retrieve a configurable number of posts from the authenticated home timeline | Pro: 180 req/15 min (per user)<br>Basic: 5 req/15 min (per user)<br>Free: 1 req/15 min (per user) |
| `get_user_tweets` | Retrieve the latest tweets for a given username (without @) | Pro: 900 req/15 min (per user) · 1,500 req/15 min (per app)<br>Basic: 5 req/15 min (per user) · 10 req/15 min (per app)<br>Free: 1 req/15 min (per user/app) |
| `search_tweets` | Search recent tweets by keyword | Pro: 300 req/15 min (per user) · 450 req/15 min (per app)<br>Basic: 60 req/15 min (per user/app)<br>Free: 1 req/15 min (per user/app) |
| `get_user_info` | Fetch profile information for a given username | Pro: 900 req/15 min (per user) · 300 req/15 min (per app)<br>Basic: 100 req/24 h (per user) · 500 req/24 h (per app)<br>Free: 3 req/15 min (per user/app) |
| `like_tweet` | Like a tweet by ID | Pro: 1,000 req/24 h (per user)<br>Basic: 200 req/24 h (per user)<br>Free: 1 req/15 min (per user) |
| `retweet` | Retweet a tweet by ID | Pro: 50 req/15 min (per user)<br>Basic: 5 req/15 min (per user)<br>Free: 1 req/15 min (per user) |

※ Rate limits reference [docs.x.com/x-api/fundamentals/rate-limits](https://docs.x.com/x-api/fundamentals/rate-limits) (retrieved on 7 Nov 2025) and may change as plans or API behavior evolve.

## Setup

### 1. Requirements

- Node.js 18.0.0 or newer
- X (Twitter) Developer account with API keys

### 2. Obtain API keys from the X Developer Portal

1. Visit the [X Developer Portal](https://developer.x.com/en/portal/dashboard)
2. Create a new app or select an existing one
3. Collect the following credentials:
   - API Key (Consumer Key)
   - API Secret (Consumer Secret)
   - Access Token
   - Access Token Secret

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

Edit `.env`:

```env
X_API_KEY=your_api_key_here
X_API_SECRET=your_api_secret_here
X_ACCESS_TOKEN=your_access_token_here
X_ACCESS_TOKEN_SECRET=your_access_token_secret_here
```

### 5. Build

```bash
npm run build
```

## Using with Claude Desktop

### 1. Open the Claude Desktop config file

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

### 2. Add the MCP server entry

Append the following configuration (adjust paths as needed):

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

### 3. Restart Claude Desktop

Restart Claude Desktop completely so the settings take effect.

**macOS:**
- Choose "Quit Claude" from the menu
- Launch Claude Desktop again

**Windows:**
- Terminate Claude Desktop from Task Manager
- Launch Claude Desktop again

### 4. Verify the connection

After restarting, confirm that the tool icon (🔨) shows up in the bottom-left corner of the Claude input box.

## Usage examples

Ask Claude Desktop things like:

```
"Fetch the latest 10 posts from my home timeline."

"Search for the latest 5 tweets about 'AI technology'."

"Get the latest tweets from @example_user."

"Show me the profile for @example_user."

"Post the tweet 'Hello, this is an MCP server test!'"
```

## Troubleshooting

### Claude Desktop does not detect the server

1. Fully restart Claude Desktop
2. Double-check for syntax errors in `claude_desktop_config.json`
3. Ensure the path to `dist/index.js` is correct (use absolute paths)
4. Check the logs:
   - **macOS:** `~/Library/Logs/Claude/mcp*.log`
   - **Windows:** `%APPDATA%\Claude\logs\mcp*.log`

### API errors occur

1. Confirm that environment variables are set correctly
2. Verify that your X app has the required permissions (Read and Write)
3. Ensure the API keys are still valid

### Test the server manually

```bash
# Run in development mode
npm run dev

# Or run the built output
npm run build
node dist/index.js
```

## Development

### Watch mode

```bash
npm run watch
```

In another terminal:

```bash
npm run dev
```

## License

MIT

## Author

Hosaka Keigo <hosaka@piano.or.jp>
