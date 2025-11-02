# 🧪 DOMINATRIX Testing Guide

> **Get ready to dominate some DOMs!**

This guide will help you test the full DOMINATRIX system: Extension → Server → CLI

---

## ✅ Pre-Testing Checklist

Make sure you've completed these steps:

- [x] Installed dependencies (`pnpm install`)
- [x] Built all packages (`pnpm build`)
- [x] Have Chrome/Chromium installed
- [x] Have Bun installed

---

## 📦 Step 1: Load the Chrome Extension

1. **Open Chrome** and navigate to:
   ```
   chrome://extensions/
   ```

2. **Enable "Developer mode"** (toggle in top-right corner)

3. **Click "Load unpacked"**

4. **Select the extension dist directory:**
   ```
   /Users/michael/Projects/oss/dominatrix/packages/extension/dist/
   ```

5. **Verify the extension loaded:**
   - You should see "DOMINATRIX 🔥" in your extensions list
   - Status should be "Errors (0)"
   - Click the extension icon - you should see the popup with connection status

---

## 🚀 Step 2: Start the WebSocket Server

In a terminal window:

```bash
cd /Users/michael/Projects/oss/dominatrix/packages/server
pnpm start
```

**Expected output:**
```
🔥 DOMINATRIX Server starting...
✅ DOMINATRIX Server running on ws://localhost:9222
💪 Ready to dominate some DOMs!
```

**Leave this running!** The server needs to stay active to bridge the extension and CLI.

---

## 🎮 Step 3: Test the CLI

In a **new terminal window**:

```bash
cd /Users/michael/Projects/oss/dominatrix/packages/cli
```

### Test 1: Help Command

```bash
bun run src/index.ts --help
```

**Expected:** Should show the DOMINATRIX ASCII banner and list of commands

### Test 2: List Tabs

First, make sure you have some Chrome tabs open, then:

```bash
bun run src/index.ts tabs
```

**Expected:** Should show a list of all your open Chrome tabs with their titles and URLs

### Test 3: DOM Snapshot

Navigate to any webpage in Chrome, then:

```bash
bun run src/index.ts snapshot
```

**Expected:** Should show a tree structure of the DOM (a11y tree style)

### Test 4: Execute JavaScript

```bash
bun run src/index.ts exec "console.log('DOMINATRIX is working!')"
```

Then check the browser console - you should see the log message!

### Test 5: Evaluate Expression

```bash
bun run src/index.ts eval "document.title"
```

**Expected:** Should return the current page's title

### Test 6: Take Screenshot

```bash
bun run src/index.ts screenshot --save /tmp/test-screenshot.png
```

**Expected:** Should save a PNG screenshot of the current tab

### Test 7: View Console Logs

After running Test 4 (which logged to console), run:

```bash
bun run src/index.ts console
```

**Expected:** Should show console messages including the one we logged

### Test 8: Network Requests

Navigate to a page that makes network requests, then:

```bash
bun run src/index.ts network
```

**Expected:** Should show a list of network requests made by the page

### Test 9: Storage

On a page that uses localStorage:

```bash
bun run src/index.ts storage
```

**Expected:** Should show localStorage and sessionStorage contents

### Test 10: Cookies

```bash
bun run src/index.ts cookies
```

**Expected:** Should show all cookies for the current page

### Test 11: Get HTML

```bash
bun run src/index.ts html
```

**Expected:** Should dump the full HTML of the page

Get HTML of a specific element:

```bash
bun run src/index.ts html "body > header"
```

### Test 12: Navigate

```bash
bun run src/index.ts navigate https://example.com
```

**Expected:** The current Chrome tab should navigate to example.com

---

## 🔍 Troubleshooting

### Extension not connecting to server?

1. **Check the extension popup** - Does it show "Connected to server" or "Server not running"?
2. **Make sure the server is running** on port 9222
3. **Check the browser console** (DevTools) - Look for WebSocket connection errors
4. **Check the extension service worker console:**
   - Go to `chrome://extensions/`
   - Find DOMINATRIX
   - Click "service worker" link
   - Look for connection logs

### CLI can't connect to server?

1. **Verify server is running:**
   ```bash
   lsof -i :9222
   ```
   Should show a process listening on port 9222

2. **Check for port conflicts:**
   ```bash
   netstat -an | grep 9222
   ```

3. **Try restarting the server**

### Commands timing out?

1. **Make sure you have an active Chrome tab open**
2. **The extension needs to be loaded in the tab** - refresh the page if needed
3. **Check that content script is injected** - Look in DevTools → Sources → Content scripts

### TypeScript/Build errors?

```bash
# Clean everything and rebuild
pnpm clean
pnpm install
pnpm build
```

---

## 📊 Server Connection Flow

When everything is working correctly, you should see these logs:

**Server logs:**
```
🔥 DOMINATRIX Server starting...
✅ DOMINATRIX Server running on ws://localhost:9222
💪 Ready to dominate some DOMs!
🔌 New connection: <uuid>
✨ Client registered as: extension
🔌 New connection: <uuid>
✨ Client registered as: cli
📥 CLI Command: <command-name>
📤 Response for request: <request-id>
```

**Extension service worker logs:**
```
🔥 DOMINATRIX Background Worker initializing...
🔌 Connecting to WebSocket server...
✅ Connected to DOMINATRIX server
📥 Received command: <command-name>
```

---

## 🎯 Integration Test Checklist

- [ ] Extension loads without errors
- [ ] Extension connects to server
- [ ] Server receives extension connection
- [ ] CLI connects to server
- [ ] `dominatrix tabs` lists tabs
- [ ] `dominatrix snapshot` returns DOM structure
- [ ] `dominatrix exec` executes JavaScript
- [ ] `dominatrix eval` evaluates expressions
- [ ] `dominatrix screenshot` captures screenshot
- [ ] `dominatrix console` shows console logs
- [ ] `dominatrix network` shows network requests
- [ ] `dominatrix storage` shows storage data
- [ ] `dominatrix cookies` shows cookies
- [ ] `dominatrix html` returns HTML
- [ ] `dominatrix navigate` navigates to URL

---

## 🐛 Known Issues

1. **Icon placeholders** - Extension icons are placeholder text files, not actual PNGs (TODO)
2. **Multi-tab routing** - Server currently sends commands to first extension client, not tab-specific (TODO)
3. **Network request bodies** - Response bodies not captured yet (TODO)
4. **Full-page screenshots** - Only captures visible viewport for now (TODO)

---

## 💡 Tips

- **Use `--json` flag** for programmatic output: `dominatrix tabs --json`
- **Keep server running** between CLI calls for faster execution
- **Check service worker logs** if commands aren't working
- **Reload extension** after making changes: `chrome://extensions/` → Click reload button

---

## 🎉 Success Criteria

If you can complete all the tests above without errors, **DOMINATRIX is working perfectly!** 🔥

You now have complete control over your browser from the CLI. DevTools wishes it could kneel. 😏

---

*Last updated: November 1, 2025*
*Built with 💙 by Claudia & Michael*
