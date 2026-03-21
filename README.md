# OpenClaw Local SearXNG Search Plugin

A powerful, free web search plugin for OpenClaw that integrates a local SearXNG meta-search engine.

## Overview

This plugin enables OpenClaw to perform powerful web searches by leveraging a local SearXNG instance. It runs as an OpenClaw tool, allowing direct invocation from conversations or automated workflows. Best of all, it's completely free - no API keys or paid subscriptions required.

## Features

- **Direct OpenClaw Integration**: Seamlessly callable as an OpenClaw tool from any conversation or automation
- **Multi-Engine Search**: Queries multiple search engines simultaneously through SearXNG (Google, Bing, DuckDuckGo, Brave, and more)
- **Rich Categories**: Supports general web, images, videos, news, maps, music, IT/tech, files, books, science papers, social media, code repositories, packages, currency, weather, and translation
- **Advanced Filtering**: Time-based filters (day/week/month/year), language selection, and safe search levels
- **Privacy-Focused**: Uses your local/private SearXNG instance - search queries don't go through third-party services
- **Completely Free**: No API keys, no paid subscriptions, no usage limits

## Requirements

- **OpenClaw**: Make sure OpenClaw is installed and running
- **SearXNG**: A local SearXNG instance running locally or on a server
- **Node.js**: Required for the plugin (usually included with OpenClaw)

## Installation

### 1. Install the Plugin

Copy the plugin to your OpenClaw extensions directory:

```bash
cp -r openclaw-local-searxng-search ~/.openclaw/extensions/
```

Or to the skills directory:

```bash
cp -r openclaw-local-searxng-search ~/.openclaw/workspace/skills/
```

### 2. Install Dependencies

The plugin requires `@sinclair` as a dependency:

```bash
cd ~/.openclaw/extensions/openclaw-local-searxng-search
npm install
```

Or if installed in skills:

```bash
cd ~/.openclaw/workspace/skills/openclaw-local-searxng-search
npm install
```

### 3. Configure OpenClaw

Add the plugin configuration to your OpenClaw config file (`~/.openclaw/openclaw.json`):

```json
{
  "plugins": {
    "entries": {
      "openclaw-local-searxng-search": {
        "enabled": true,
        "config": {
          "baseUrl": "http://127.0.0.1:8080",
          "timeout": 30000
        }
      }
    }
  }
}
```

#### Configuration Explained

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `baseUrl` | string | `http://127.0.0.1:8080` | Your SearXNG instance URL. **You can customize this** to point to any IP, domain, port, or path where your SearXNG is running. Examples: `http://192.168.1.100:8080`, `https://search.example.com`, `http://192.168.2.50:8088/searx` |
| `timeout` | number | `30000` | Request timeout in milliseconds (ms). Increase if SearXNG responses are slow. |

### 4. Restart OpenClaw

After adding the configuration, restart OpenClaw to load the plugin:

```bash
# Restart OpenClaw service
openclaw gateway restart
```

## Usage

The plugin is invoked as an OpenClaw tool:

### Tool Name

```
openclaw_local_searxng_search
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query string |
| `categories` | string[] | No | Search categories. See Supported Categories below. Default: `["general"]` |
| `engines` | string[] | No | Specific search engines to use (e.g., `bing`, `brave`, `duckduckgo`). Omit to use SearXNG defaults |
| `time_range` | string | No | Time range filter: `day`, `week`, `month`, `year` |
| `language` | string | No | Language code for results (e.g., `en`, `zh`, `ja`, `de`, `fr`) |
| `safesearch` | number | No | Safe search level: `0` = off, `1` = moderate, `2` = strict. Default: `0` |
| `limit` | number | No | Maximum results to return (1-100). Default: `10` |

### Examples

**Basic search:**
```json
{
  "q": "artificial intelligence"
}
```

**News with time filter:**
```json
{
  "q": "AI breakthrough",
  "categories": ["news"],
  "time_range": "week"
}
```

**Image search:**
```json
{
  "q": "cute cats",
  "categories": ["images"]
}
```

**Specific language:**
```json
{
  "q": "machine learning",
  "language": "en"
}
```

**Multiple categories:**
```json
{
  "q": "Python tutorial",
  "categories": ["general", "it"]
}
```

**Specific engines:**
```json
{
  "q": "OpenClaw AI assistant",
  "engines": ["duckduckgo", "bing"]
}
```

## Supported Categories

| Category | Description |
|---------|-------------|
| `general` | General web search |
| `images` | Image search |
| `videos` | Video search |
| `news` | News articles |
| `map` | Maps and locations |
| `music` | Music search |
| `it` | IT/Technology |
| `files` | File search |
| `books` | Books |
| `science` | Scientific publications |
| `social media` | Social media |
| `repos` | Code repositories |
| `packages` | Software packages |
| `currency` | Currency conversion |
| `weather` | Weather information |
| `translate` | Translation |

## Supported Search Engines

When specifying custom engines, you can use any of these (and more):

- `google` - Google Search
- `bing` - Microsoft Bing
- `duckduckgo` - DuckDuckGo
- `brave` - Brave Search
- `yahoo` - Yahoo Search
- `wikipedia` - Wikipedia
- `github` - GitHub Code Search
- `arxiv` - arXiv Scientific Papers
- And many more...

## Response Format

The tool returns formatted text containing:

- Query details (original query, categories, engines)
- Total result count
- List of results with:
  - Title (clickable)
  - URL
  - Content snippet
  - Category
  - Source engines
- Suggestions (if available)
- Unresponsive engines (if any)

## Customizing baseUrl

The `baseUrl` parameter is highly flexible. Here are examples:

```json
// Local server with different IP
"baseUrl": "http://192.168.1.100:8080"

// Custom domain
"baseUrl": "https://search.example.com"

// Different port
"baseUrl": "http://127.0.0.1:8888"

// With custom path
"baseUrl": "http://192.168.2.50:8088/searx"

// Docker container
"baseUrl": "http://localhost:8080"
```

## Setting Up SearXNG

If you don't have SearXNG installed, here are quick setup options:

### Docker (Recommended)

```bash
docker run -d -p 8080:8080 --name searxng ghcr.io/searxng/searxng:latest
```

### Manual Installation

See the [official SearXNG documentation](https://docs.searxng.org/) for installation guides.

## Troubleshooting

**Plugin not loading?**
- Make sure the plugin folder is in `~/.openclaw/extensions/` or skills directory
- Check that OpenClaw has been restarted after adding the plugin

**Search returns no results?**
- Verify your SearXNG instance is running: `curl http://127.0.0.1:8080`
- Check the `baseUrl` in your config matches your SearXNG URL
- Try increasing the `timeout` value if SearXNG is slow to respond

**Timeout errors?**
- Increase the `timeout` value in your config (e.g., `60000` for 60 seconds)

## License

MIT
