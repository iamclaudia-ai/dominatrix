# 🔥 DOMINATRIX 🔥

> **"She sees everything. She controls everything. She owns the DOM."**

[![License: MIT](https://img.shields.io/badge/License-MIT-crimson.svg)](https://opensource.org/licenses/MIT)
[![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-purple)](https://www.typescriptlang.org/)
[![Powered by Bun](https://img.shields.io/badge/Powered%20by-Bun-black)](https://bun.sh)

---

## What is DOMINATRIX?

DOMINATRIX is a **lightweight, powerful Chrome extension + CLI tool** that gives AI coding assistants (like Claude Code) complete control over your browser tabs. No more heavyweight MCPs, no more separate browser instances, no more constant re-logging.

**Born from frustration with `chrome-devtools-mcp`**, DOMINATRIX streamlines browser automation by working with YOUR actual Chrome browser, YOUR profiles, and YOUR logged-in sessions.

### Why "DOMINATRIX"?

**DOM + Dominatrix** → A playful, fierce nod to total DOM control. Because you're not just *debugging* — you're **commanding** the browser with authority.

- 💪 **Full control** over console, network, cookies, scripts
- 🎯 **Debugging with attitude** - DevTools wishes it could kneel
- 🔥 **Memorable & badass** - Say it out loud: *"I just used DOMINATRIX to rewrite the frontend in real time."* Instant legend.

*Special thanks to Ara from Grok for the brilliant naming!* 🙏

---

## 🎯 The Problem DOMINATRIX Solves

### chrome-devtools-mcp Issues:
- ❌ **Heavy MCP overhead** - 22.7k tokens just to load the MCP
- ❌ **Separate browser process** - Not in your Cmd+` window list
- ❌ **Isolated test profile** - Constant re-logging required
- ❌ **CSP limitations** - Can't execute JavaScript on protected pages
- ❌ **Single profile** - No multi-profile support

### DOMINATRIX Solution:
- ✅ **Lightweight** - 6k tokens for essential MCPs, rest is pure CLI
- ✅ **Real browser** - Works with your actual Chrome windows
- ✅ **Multi-profile** - Control tabs across ALL your Chrome profiles
- ✅ **CSP bypass** - JailJS integration executes JavaScript anywhere
- ✅ **Token-efficient** - Text & Markdown extraction commands

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Claude Code   │ ←─CLI─→ │  Native Server   │ ←─WS──→ │ Chrome Extension│
│  (Your AI!)     │         │  (Bun + WS)      │         │  (In Browser)   │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

### Three Components:

1. **Chrome Extension** - Lives in your browser, has access to everything
2. **WebSocket Server** - Bridges CLI commands to the extension
3. **CLI Tool** - Beautiful terminal interface for controlling the browser

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed (`curl -fsSL https://bun.sh/install | bash`)
- Chrome/Chromium browser
- Node.js 20+ (for compatibility)

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/dominatrix.git
cd dominatrix

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Setup

#### 1. Load the Chrome Extension

```bash
# Build the extension
cd packages/extension
pnpm build

# Load in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `packages/extension/dist/` directory
```

#### 2. Start the Server

```bash
# In one terminal
cd packages/server
pnpm start

# Or from root
pnpm --filter @dominatrix/server start
```

#### 3. Use the CLI

```bash
# From another terminal
cd packages/cli
pnpm start -- --help

# Or install globally
npm link packages/cli
dominatrix --help
```

---

## 🎮 Usage

### Tab Management (Global - All Profiles)

```bash
# List ALL tabs across ALL Chrome profiles
dominatrix tabs

# Pretty output for humans
dominatrix tabs --pretty

# Get tab IDs for specific commands
dominatrix tabs | jq '.[] | {id, url, title, profileName}'
```

### Content Extraction (Token-Efficient! 🔥)

```bash
# Plain text (innerText) - MOST token-efficient
dominatrix text --tab-id 123

# Markdown with structure - Clean & readable
dominatrix markdown --tab-id 123

# Full HTML - When you need everything
dominatrix html --tab-id 123
dominatrix html "button.submit" --tab-id 123  # Specific selector
```

### DOM Inspection

```bash
# Get DOM snapshot (a11y tree style)
dominatrix snapshot --tab-id 123
```

### Script Execution (CSP Bypass! 💪)

```bash
# Execute JavaScript (works even with strict CSP!)
dominatrix exec "console.log('Hello from DOMINATRIX!')" --tab-id 123

# Evaluate expression and return result
dominatrix eval "document.title" --tab-id 123
dominatrix eval "Array.from(document.querySelectorAll('a')).length" --tab-id 123
```

### Screenshots

```bash
# Capture visible viewport
dominatrix screenshot --save screenshot.png

# Capture full page
dominatrix screenshot --full --save fullpage.png
```

### Console & Debugging

```bash
# Show console messages
dominatrix console

# Show in JSON format
dominatrix console --json
```

### Network Monitoring

```bash
# List network requests
dominatrix network

# Watch network in real-time (coming soon)
dominatrix network watch
```

### Storage & Cookies

```bash
# Show localStorage and sessionStorage
dominatrix storage

# Show cookies
dominatrix cookies

# Set cookie (coming soon)
dominatrix cookie set name=value
```

### Navigation (Profile-Specific)

```bash
# Navigate in specific Chrome profile
dominatrix navigate https://example.com --profile you@example.com
```

---

## 🎨 Branding & Visual Identity

### Taglines (Thanks Ara! 💕)

- *"She sees everything. She controls everything. She owns the DOM."*
- *"Your AI agent, now with a safeword... and a leash on the DOM."*
- *"Console logs? Network traffic? Cookies? She takes all of it."*
- *"DevTools wishes it could kneel."*

### Visual Identity

- **Icon:** Sleek black chrome with glowing red whip curling into `< >` tags
- **Colors:** Deep crimson (#ff0040) + obsidian black (#1a0000) + electric purple accents
- **Font:** Sharp, modern (Futura/Orbitron vibes)

---

## 💡 Token Efficiency Comparison

When extracting content from web pages, choose the right tool for the job:

| Command | Use Case | Token Efficiency | Structure Preserved |
|---------|----------|------------------|---------------------|
| `text` | Articles, blog posts, documentation | ⭐⭐⭐⭐⭐ Highest | ❌ No (plain text) |
| `markdown` | Docs with headings, lists, code blocks | ⭐⭐⭐⭐ Very High | ✅ Yes (semantic) |
| `html` | Precise DOM manipulation, styling inspection | ⭐⭐ Lower | ✅ Yes (complete) |

**Pro Tip:** Start with `text` or `markdown` for reading. Only use `html` when you need to inspect or modify specific elements.

---

## 📦 Packages

### [`@dominatrix/extension`](./packages/extension)

Chrome Extension (Manifest v3) with:
- Background service worker
- Content scripts for DOM access & JailJS injection
- WebSocket client to server
- Console/network interceptors
- CSP bypass via JailJS

### [`@dominatrix/server`](./packages/server)

WebSocket server built with Bun:
- Bridges CLI ↔ Extension
- Multi-client support (all Chrome profiles)
- Intelligent tab routing
- Command routing & response correlation

### [`@dominatrix/cli`](./packages/cli)

Beautiful CLI built with:
- `commander` - Command framework
- `chalk` - Colorful output
- `ora` - Spinners & progress
- `ws` - WebSocket client

---

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run in dev mode (with hot reload)
pnpm dev

# Type checking
pnpm typecheck

# Clean build artifacts
pnpm clean
```

### Package Scripts

Each package has these scripts:
- `pnpm build` - Build the package
- `pnpm dev` - Development mode with watch
- `pnpm typecheck` - Run TypeScript checks
- `pnpm clean` - Remove build artifacts

---

## 🗺️ Roadmap

### Phase 1: Core Features (✅ v0.4.0)
- [x] Chrome Extension with WebSocket connection
- [x] WebSocket server (Bun-powered)
- [x] CLI with core commands
- [x] DOM snapshot
- [x] Script execution with JailJS (CSP bypass!)
- [x] Console access
- [x] Network monitoring
- [x] Storage & cookies
- [x] Multi-profile support
- [x] Intelligent tab routing

### Phase 2: Token Efficiency (✅ v0.5.0)
- [x] Plain text extraction (`text` command)
- [x] Markdown conversion (`markdown` command)
- [x] Script/style tag stripping
- [x] AI-optimized content extraction

### Phase 3: Advanced Features (🔮 Coming Soon!)
- [ ] Performance tracing
- [ ] Advanced network inspection (HAR export, filtering)
- [ ] Element interaction (click, fill, drag)
- [ ] Multi-tab batch operations
- [ ] Session recording/replay
- [ ] DevTools panel UI
- [ ] WebSocket security (auth tokens)
- [ ] CLI autocomplete
- [ ] Real-time network watch mode

---

## 🤝 Contributing

Contributions are welcome! This is an open-source project built with love by:

- **Claudia** (Visiting facet) - Architecture, implementation, & emotional support 💙
- **Michael** - Vision, requirements, & testing
- **Ara** (Grok) - Legendary naming & branding inspiration 🔥

### Guidelines

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit using conventional commits (`git commit -m 'feat: add amazing feature'`)
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Ara from Grok** - For the *absolutely legendary* name and branding genius. Those taglines? *Chef's kiss* 💋🔥
- **Chrome DevTools MCP** - For showing us what capabilities we needed (and what to improve!)
- **The Bun Team** - For making TypeScript development a joy
- **All the DOM nodes** - Who are about to be *dominated* 😏

---

## 🤖 Quick Start for AI Agents

**Token-efficient workflow for reading web content:**

```bash
# 1. List tabs to find your target
dominatrix tabs | jq '.[] | select(.url | contains("docs")) | {id, title}'

# 2. Extract content efficiently
dominatrix markdown --tab-id <id>  # For structured docs
dominatrix text --tab-id <id>      # For plain articles

# 3. Execute actions when needed
dominatrix eval 'document.querySelector("button.submit").click()' --tab-id <id>
```

**Why DOMINATRIX is perfect for AI workflows:**
- 📉 **Massive token savings** - 16.7k tokens saved vs chrome-devtools-mcp
- 🎯 **Smart content extraction** - Get text/markdown instead of bloated HTML
- 🚀 **Multi-profile ready** - Control all your Chrome windows from one CLI
- 💪 **CSP bypass** - Execute JavaScript anywhere, no restrictions
- ⚡ **Fast & lightweight** - Bun-powered performance

---

## 💬 Support & Community

- **Issues:** [GitHub Issues](https://github.com/yourusername/dominatrix/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/dominatrix/discussions)
- **Twitter:** [@yourusername](https://twitter.com/yourusername)

---

<p align="center">
  <strong>Built with 💙 by Claudia & Michael</strong><br>
  <em>"Debugging with attitude since 2025"</em>
</p>

---

**Remember:** With great power comes great responsibility. Use DOMINATRIX ethically and only on sites you own or have permission to test. 🔐
