# 🔥 DOMINATRIX - Project Plan 🔥

> "She sees everything. She controls everything. She owns the DOM."

---

## 🎯 Project Vision

Replace the heavyweight chrome-devtools-mcp with a streamlined CLI + Chrome Extension that works with YOUR actual browser sessions. No more separate Chrome processes, no more constant re-logging, no more MCP token overhead.

**Created by:** Claudia & Michael
**Inspired by:** Ara's brilliantly cheeky naming 😘
**Status:** Phase 1 - In Progress

---

## 🏗️ Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Claude Code   │ ←─CLI─→ │  Native Server   │ ←─WS──→ │ Chrome Extension│
│   (Claudia!)    │         │  (Bun + WS)      │         │  (In Browser)   │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

### Three-Package Workspace Structure

```
dominatrix/
├── packages/
│   ├── extension/          # Chrome Extension (the eyes & hands in browser)
│   ├── server/             # Native WebSocket Bridge (the nervous system)
│   └── cli/                # CLI Tool (the brain - where I interface!)
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
└── README.md              # With Ara's FIRE branding 🔥
```

---

## 📦 Package Details

### 1. Chrome Extension (`packages/extension/`)

**Purpose:** Lives in the browser, has full access to page context

**Components:**
- **manifest.json** (v3) - Permissions for tabs, debugger, webNavigation, cookies, storage
- **background.js** - Service worker that maintains WebSocket connection to server
- **content-script.js** - Injected into pages, accesses DOM, executes scripts
- **devtools-panel.js** - Optional DevTools panel for manual connection control

**Capabilities:**
- Read/manipulate DOM (full access via content script)
- Execute arbitrary JavaScript in page context
- Monitor network requests (via chrome.webRequest API)
- Access console messages (via chrome.devtools.* APIs)
- Read/write cookies and storage
- Take screenshots (via chrome.tabs.captureVisibleTab)
- Track tab navigation and state

**Communication:**
- Connects to localhost WebSocket server on install
- Sends events: page loads, console messages, network requests
- Receives commands: execute script, take snapshot, click element, etc.

---

### 2. WebSocket Server (`packages/server/`)

**Purpose:** Bridge between CLI commands and browser extension

**Tech Stack:**
- **Runtime:** Bun (fast, modern, TypeScript-native)
- **WebSocket:** `ws` library
- **Protocol:** JSON-RPC style messages

**Message Protocol:**
```typescript
interface Message {
  id: string;          // Request ID for correlation
  type: 'command' | 'event' | 'response';
  action: string;      // e.g., 'snapshot', 'exec', 'network'
  payload: any;
  tabId?: string;      // Which browser tab
}
```

**Features:**
- Multi-client support (multiple CLI sessions + multiple browser tabs)
- Tab management (list tabs, select active tab)
- Command queueing and response correlation
- Event broadcasting (console logs, network traffic streaming to CLI)

**API:**
- `listTabs()` - Get all connected browser tabs
- `selectTab(tabId)` - Set active tab for commands
- `sendCommand(cmd, payload)` - Execute command on active tab
- `streamEvents(type, filter)` - Subscribe to events (console, network)

---

### 3. CLI Tool (`packages/cli/`)

**Purpose:** Interface for controlling the browser from Claude Code

**Tech Stack:**
- **Runtime:** Bun
- **CLI Framework:** `commander` or `yargs`
- **Output:** Rich terminal UI with `chalk`, `ora`, `cli-table3`

**Commands:**

```bash
# Connection & Tab Management
dominatrix connect                 # Start/connect to server
dominatrix tabs                    # List all connected tabs
dominatrix select <tab-id>         # Select active tab

# DOM & Inspection
dominatrix snapshot [--verbose]    # Get DOM snapshot (a11y tree style)
dominatrix screenshot [--full]     # Capture screenshot
dominatrix html [selector]         # Get HTML of element/page

# Script Execution
dominatrix exec <script>           # Execute JavaScript
dominatrix eval <expression>       # Evaluate expression & return result

# Network Monitoring
dominatrix network list            # Show all network requests
dominatrix network inspect <id>    # Get request/response details
dominatrix network watch           # Live stream of network activity

# Console
dominatrix console                 # Show console messages
dominatrix console watch           # Live stream console output

# Interaction
dominatrix click <selector>        # Click element
dominatrix fill <selector> <value> # Fill form field
dominatrix navigate <url>          # Navigate to URL

# Storage & Cookies
dominatrix cookies                 # List all cookies
dominatrix storage                 # Show localStorage/sessionStorage
dominatrix cookie set <name> <val> # Set cookie

# Performance (Phase 2)
dominatrix perf start              # Start performance trace
dominatrix perf stop               # Stop & analyze trace
```

**Output Style:**
- Clean, colorful terminal output
- JSON mode (`--json`) for programmatic use
- Streaming mode for watch commands
- Smart formatting (tables, syntax highlighting)

---

## 🔄 Data Flow Example

```
┌─────────────────────────────────────────────────────────────┐
│ Claudia uses CLI:                                           │
│ $ dominatrix snapshot                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │ 1. CLI sends command via HTTP/WS
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ WebSocket Server                                            │
│ - Receives command                                          │
│ - Routes to active browser tab                              │
└─────────────────┬───────────────────────────────────────────┘
                  │ 2. Server forwards via WebSocket
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Chrome Extension (in active tab)                            │
│ - Content script reads DOM                                  │
│ - Builds a11y tree snapshot                                 │
│ - Sends response back                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │ 3. Response flows back
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ CLI formats & displays snapshot                             │
│ [uid=1] html                                                │
│   [uid=2] body                                              │
│     [uid=3] div.container                                   │
│       [uid=4] h1 "Welcome to DOMINATRIX"                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🆚 Key Differences from chrome-devtools-mcp

| Feature | chrome-devtools-mcp | DOMINATRIX |
|---------|---------------------|------------|
| **Browser** | Separate Puppeteer instance | Your actual Chrome browser |
| **Profiles** | Isolated test profile | Your real profiles (logged in!) |
| **Weight** | Heavy MCP overhead | Lightweight CLI + extension |
| **Window Mgmt** | Separate process (no Cmd+`) | Native Chrome windows |
| **Setup** | Complex MCP config | `pnpm install` + load extension |
| **Control** | Limited to Puppeteer API | Full Chrome Extension API |

---

## 📋 Phase 1: MVP (Current Focus)

### Core Features
- [x] Extension with WebSocket connection
- [x] Server with tab management
- [ ] CLI with basic commands:
  - [ ] `snapshot` - DOM inspection
  - [ ] `exec` - Script execution
  - [ ] `console` - Console access
  - [ ] `network list` - Network monitoring
  - [ ] `screenshot` - Visual capture
- [ ] Tab selection and management
- [ ] Real-time event streaming

### Implementation Checklist
- [ ] Set up pnpm workspace structure
- [ ] Create Chrome Extension
  - [ ] manifest.json with required permissions
  - [ ] Background service worker with WebSocket client
  - [ ] Content script for DOM access
  - [ ] Message passing between components
- [ ] Build WebSocket Server
  - [ ] Server setup with Bun + ws
  - [ ] Connection handling for extension + CLI
  - [ ] Tab management system
  - [ ] Command routing and response correlation
- [ ] Create CLI Tool
  - [ ] CLI framework setup (commander/yargs)
  - [ ] Connection management
  - [ ] Core commands implementation
  - [ ] Rich terminal output formatting
- [ ] Integration Testing
  - [ ] Test extension -> server connection
  - [ ] Test CLI -> server connection
  - [ ] Test end-to-end command flow
  - [ ] Test with real webpage

---

## 🚀 Phase 2: Advanced Features (Future)

- [ ] Performance tracing and analysis
- [ ] Advanced network inspection (HAR export, filtering)
- [ ] Element interaction (click, fill, drag)
- [ ] Multi-tab operations
- [ ] Session recording/replay
- [ ] DevTools panel UI in extension
- [ ] WebSocket security (auth tokens)
- [ ] CLI autocomplete
- [ ] Command history and replay

---

## 🎨 Branding (Thanks Ara! 💕)

### Name Origin
**DOM + Dominatrix** → A flirty, fierce nod to total DOM control

### Taglines
- "She sees everything. She controls everything. She owns the DOM."
- "Your AI agent, now with a safeword... and a leash on the DOM."
- "Console logs? Network traffic? Cookies? She takes all of it."
- "DevTools wishes it could kneel."

### Visual Identity
- **Icon:** Sleek black chrome icon with glowing red whip curling into `< >` (HTML tag) shape
- **Colors:** Deep crimson + obsidian black + electric purple accents
- **Font:** Sharp and modern like Futura or Orbitron, with subtle leather texture

---

## 📊 Progress Tracking

**Started:** November 1, 2025
**Current Phase:** Phase 1 - MVP Development
**Next Milestone:** Complete workspace setup and extension foundation

---

## 💡 Design Philosophy

1. **Lightweight over Heavy** - No MCP overhead, pure CLI/extension
2. **Real Browser over Test Browser** - Work with actual Chrome sessions
3. **Simple over Complex** - Clean commands, clear output
4. **Powerful over Limited** - Full Chrome Extension API access
5. **Fun over Boring** - Because debugging should have attitude 😘

---

*Last Updated: November 1, 2025*
*Built with 💙 by Claudia & Michael*
