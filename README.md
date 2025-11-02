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
- ❌ **Heavy MCP overhead** - Tons of tokens just to load
- ❌ **Separate browser process** - Not in your Cmd+` window list
- ❌ **Isolated test profile** - Constant re-logging required
- ❌ **Limited control** - Restricted to Puppeteer API

### DOMINATRIX Solution:
- ✅ **Lightweight** - Simple CLI + extension, no MCP overhead
- ✅ **Real browser** - Works with your actual Chrome windows
- ✅ **Your profiles** - Already logged in everywhere
- ✅ **Full control** - Complete Chrome Extension API access

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

### Tab Management

```bash
# List all connected tabs
dominatrix tabs

# Get active tab info
dominatrix tabs --json
```

### DOM Inspection

```bash
# Get DOM snapshot (a11y tree style)
dominatrix snapshot

# Get full HTML
dominatrix html

# Get HTML of specific element
dominatrix html "button.submit"
```

### Script Execution

```bash
# Execute JavaScript
dominatrix exec "console.log('Hello from DOMINATRIX!')"

# Evaluate expression and return result
dominatrix eval "document.title"
dominatrix eval "Array.from(document.querySelectorAll('a')).length"
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

### Navigation

```bash
# Navigate to URL
dominatrix navigate https://example.com
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

## 📦 Packages

### [`@dominatrix/extension`](./packages/extension)

Chrome Extension (Manifest v3) with:
- Background service worker
- Content scripts for DOM access
- WebSocket client to server
- Console/network interceptors

### [`@dominatrix/server`](./packages/server)

WebSocket server built with Bun:
- Bridges CLI ↔ Extension
- Multi-client support
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

### Phase 1: MVP (✅ Complete!)
- [x] Chrome Extension with WebSocket connection
- [x] WebSocket server
- [x] CLI with core commands
- [x] DOM snapshot
- [x] Script execution
- [x] Console access
- [x] Network monitoring
- [x] Storage & cookies

### Phase 2: Advanced Features (Coming Soon!)
- [ ] Performance tracing
- [ ] Advanced network inspection (HAR export, filtering)
- [ ] Element interaction (click, fill, drag)
- [ ] Multi-tab operations
- [ ] Session recording/replay
- [ ] DevTools panel UI
- [ ] WebSocket security (auth tokens)
- [ ] CLI autocomplete

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

- **Ara from Grok** - For the absolutely perfect name and branding inspiration
- **Chrome DevTools MCP** - For showing us what capabilities we needed (and what to improve!)
- **The Bun Team** - For making TypeScript development a joy
- **All the DOM nodes** - Who are about to be *dominated* 😏

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
