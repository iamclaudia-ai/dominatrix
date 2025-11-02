/**
 * DOMINATRIX Background Service Worker
 * Maintains WebSocket connection to server and routes commands
 */

import type {
  Message,
  CommandMessage,
  ResponseMessage,
  EventMessage,
  TabInfo,
  ConsoleLog,
  NetworkRequest,
} from './types.js';

const WS_URL = 'ws://localhost:9222';
const RECONNECT_DELAY = 2000;

class DominatrixBackground {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private consoleLogs: Map<number, ConsoleLog[]> = new Map();
  private networkRequests: Map<number, NetworkRequest[]> = new Map();
  private instanceId: string;
  private extensionId: string;

  constructor() {
    // Generate unique instance ID for this connection
    this.instanceId = crypto.randomUUID();
    this.extensionId = chrome.runtime.id;
    this.init();
  }

  private init() {
    console.log('🔥 DOMINATRIX Background Worker initializing...');

    // Connect to WebSocket server
    this.connect();

    // Listen for tab events
    chrome.tabs.onCreated.addListener(this.onTabCreated.bind(this));
    chrome.tabs.onUpdated.addListener(this.onTabUpdated.bind(this));
    chrome.tabs.onRemoved.addListener(this.onTabRemoved.bind(this));

    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener(this.onContentScriptMessage.bind(this));

    // Listen for web requests (network monitoring)
    chrome.webRequest.onBeforeRequest.addListener(
      this.onNetworkRequest.bind(this),
      { urls: ['<all_urls>'] },
      ['requestBody']
    );

    chrome.webRequest.onCompleted.addListener(
      this.onNetworkComplete.bind(this),
      { urls: ['<all_urls>'] },
      ['responseHeaders']
    );
  }

  /**
   * WebSocket Connection Management
   */
  private connect() {
    try {
      console.log('🔌 Connecting to WebSocket server...');
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = async () => {
        console.log('✅ Connected to DOMINATRIX server');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Announce our presence with profile information
        const profileInfo = await this.getProfileInfo();
        this.sendEvent('connected', {
          connected: true,
          profile: profileInfo
        });
      };

      this.ws.onmessage = (event) => {
        this.handleServerMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('🔌 Disconnected from server. Reconnecting...');
        this.ws = null;
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, RECONNECT_DELAY) as unknown as number;
    }
  }

  private send(message: Message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  private sendResponse(requestId: string, success: boolean, data?: any, error?: string) {
    const response: ResponseMessage = {
      id: crypto.randomUUID(),
      type: 'response',
      timestamp: Date.now(),
      requestId,
      success,
      data,
      error,
    };
    this.send(response);
  }

  private async sendEvent(event: EventMessage['event'], data: any, tabId?: number) {
    const profileInfo = await this.getProfileInfo();
    const message: EventMessage = {
      id: crypto.randomUUID(),
      type: 'event',
      timestamp: Date.now(),
      event,
      data,
      tabId,
      profile: profileInfo,
    };
    this.send(message);
  }

  private async getProfileInfo() {
    return {
      extensionId: this.extensionId,
      instanceId: this.instanceId,
      profileName: await this.getProfileName(),
    };
  }

  private async getProfileName(): Promise<string | undefined> {
    // Try to get profile name from chrome.identity if available
    try {
      const profileInfo = await chrome.identity.getProfileUserInfo();
      if (profileInfo.email) {
        return profileInfo.email;
      }
    } catch (e) {
      // chrome.identity might not be available
    }

    // Fallback: Use extension ID as identifier
    return undefined;
  }

  /**
   * Handle incoming messages from server (commands from CLI)
   */
  private async handleServerMessage(data: string) {
    try {
      const message: CommandMessage = JSON.parse(data);

      if (message.type !== 'command') {
        console.warn('Unexpected message type:', message.type);
        return;
      }

      console.log('📥 Received command:', message.action);

      const result = await this.executeCommand(message);
      this.sendResponse(message.id, true, result);
    } catch (error) {
      console.error('Error handling message:', error);
      const message = JSON.parse(data);
      this.sendResponse(
        message.id,
        false,
        undefined,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Execute commands from CLI
   */
  private async executeCommand(message: CommandMessage): Promise<any> {
    switch (message.action) {
      case 'listTabs':
        return this.listTabs();

      case 'getActiveTab':
        return this.getActiveTab();

      case 'snapshot':
        return this.getSnapshot(message.tabId);

      case 'getHTML':
        return this.getHTML(message.tabId, message.payload?.selector);

      case 'screenshot':
        return this.takeScreenshot(message.tabId, message.payload?.fullPage);

      case 'executeScript':
        return this.executeScript(message.tabId, message.payload?.script);

      case 'evaluateExpression':
        return this.evaluateExpression(message.tabId, message.payload?.expression);

      case 'getConsoleLogs':
        return this.getConsoleLogs(message.tabId);

      case 'clearConsole':
        return this.clearConsole(message.tabId);

      case 'listNetworkRequests':
        return this.listNetworkRequests(message.tabId);

      case 'clearNetworkRequests':
        return this.clearNetworkRequests(message.tabId);

      case 'getCookies':
        return this.getCookies(message.tabId);

      case 'setCookie':
        return this.setCookie(message.payload);

      case 'getStorage':
        return this.getStorage(message.tabId);

      case 'click':
        return this.click(message.tabId, message.payload?.selector);

      case 'fill':
        return this.fill(message.tabId, message.payload?.selector, message.payload?.value);

      case 'navigate':
        return this.navigate(message.tabId, message.payload?.url);

      default:
        throw new Error(`Unknown command: ${message.action}`);
    }
  }

  /**
   * Command Implementations
   */
  private async listTabs(): Promise<TabInfo[]> {
    const tabs = await chrome.tabs.query({});
    const profileName = await this.getProfileName();
    return tabs.map(tab => ({
      id: tab.id!,
      url: tab.url || '',
      title: tab.title || '',
      active: tab.active,
      windowId: tab.windowId,
      profileId: this.instanceId,
      profileName,
    }));
  }

  private async getActiveTab(): Promise<TabInfo | null> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) return null;

    const tab = tabs[0];
    const profileName = await this.getProfileName();
    return {
      id: tab.id!,
      url: tab.url || '',
      title: tab.title || '',
      active: tab.active,
      windowId: tab.windowId,
      profileId: this.instanceId,
      profileName,
    };
  }

  private async getSnapshot(tabId?: number): Promise<any> {
    const targetTabId = tabId || (await this.getActiveTab())?.id;
    if (!targetTabId) throw new Error('No active tab');

    // Send message to content script to build snapshot
    return chrome.tabs.sendMessage(targetTabId, {
      action: 'getSnapshot',
    });
  }

  private async getHTML(tabId?: number, selector?: string): Promise<string> {
    const targetTabId = tabId || (await this.getActiveTab())?.id;
    if (!targetTabId) throw new Error('No active tab');

    return chrome.tabs.sendMessage(targetTabId, {
      action: 'getHTML',
      selector,
    });
  }

  private async takeScreenshot(tabId?: number, fullPage = false): Promise<string> {
    const targetTabId = tabId || (await this.getActiveTab())?.id;
    if (!targetTabId) throw new Error('No active tab');

    // Get tab's window ID
    const tab = await chrome.tabs.get(targetTabId);
    if (!tab.windowId) throw new Error('Tab has no window');

    // Switch to tab first
    await chrome.tabs.update(targetTabId, { active: true });

    // Capture screenshot
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
    });

    return dataUrl;
  }

  private async executeScript(tabId?: number, script?: string): Promise<any> {
    const targetTabId = tabId || (await this.getActiveTab())?.id;
    if (!targetTabId) throw new Error('No active tab');
    if (!script) throw new Error('No script provided');

    return chrome.tabs.sendMessage(targetTabId, {
      action: 'executeScript',
      script,
    });
  }

  private async evaluateExpression(tabId?: number, expression?: string): Promise<any> {
    const targetTabId = tabId || (await this.getActiveTab())?.id;
    if (!targetTabId) throw new Error('No active tab');
    if (!expression) throw new Error('No expression provided');

    return chrome.tabs.sendMessage(targetTabId, {
      action: 'evaluateExpression',
      expression,
    });
  }

  private async getConsoleLogs(tabId?: number): Promise<ConsoleLog[]> {
    const targetTabId = tabId || (await this.getActiveTab())?.id;
    if (!targetTabId) return [];

    return this.consoleLogs.get(targetTabId) || [];
  }

  private async clearConsole(tabId?: number): Promise<void> {
    const targetTabId = tabId || (await this.getActiveTab())?.id;
    if (!targetTabId) return;

    this.consoleLogs.set(targetTabId, []);
  }

  private async listNetworkRequests(tabId?: number): Promise<NetworkRequest[]> {
    const targetTabId = tabId || (await this.getActiveTab())?.id;
    if (!targetTabId) return [];

    return this.networkRequests.get(targetTabId) || [];
  }

  private async clearNetworkRequests(tabId?: number): Promise<void> {
    const targetTabId = tabId || (await this.getActiveTab())?.id;
    if (!targetTabId) return;

    this.networkRequests.set(targetTabId, []);
  }

  private async getCookies(tabId?: number): Promise<chrome.cookies.Cookie[]> {
    const targetTabId = tabId || (await this.getActiveTab())?.id;
    if (!targetTabId) throw new Error('No active tab');

    const tab = await chrome.tabs.get(targetTabId);
    if (!tab.url) throw new Error('Tab has no URL');

    return chrome.cookies.getAll({ url: tab.url });
  }

  private async setCookie(cookie: any): Promise<void> {
    await chrome.cookies.set(cookie);
  }

  private async getStorage(tabId?: number): Promise<any> {
    const targetTabId = tabId || (await this.getActiveTab())?.id;
    if (!targetTabId) throw new Error('No active tab');

    return chrome.tabs.sendMessage(targetTabId, {
      action: 'getStorage',
    });
  }

  private async click(tabId?: number, selector?: string): Promise<void> {
    const targetTabId = tabId || (await this.getActiveTab())?.id;
    if (!targetTabId) throw new Error('No active tab');
    if (!selector) throw new Error('No selector provided');

    return chrome.tabs.sendMessage(targetTabId, {
      action: 'click',
      selector,
    });
  }

  private async fill(tabId?: number, selector?: string, value?: string): Promise<void> {
    const targetTabId = tabId || (await this.getActiveTab())?.id;
    if (!targetTabId) throw new Error('No active tab');
    if (!selector) throw new Error('No selector provided');

    return chrome.tabs.sendMessage(targetTabId, {
      action: 'fill',
      selector,
      value,
    });
  }

  private async navigate(tabId?: number, url?: string): Promise<void> {
    const targetTabId = tabId || (await this.getActiveTab())?.id;
    if (!targetTabId) throw new Error('No active tab');
    if (!url) throw new Error('No URL provided');

    await chrome.tabs.update(targetTabId, { url });
  }

  /**
   * Event Listeners
   */
  private onTabCreated(tab: chrome.tabs.Tab) {
    if (!tab.id) return;
    this.sendEvent('tabCreated', { id: tab.id, url: tab.url, title: tab.title }, tab.id);
  }

  private onTabUpdated(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    if (changeInfo.status === 'complete') {
      this.sendEvent('pageLoad', { url: tab.url, title: tab.title }, tabId);
    }
    this.sendEvent('tabUpdated', { changeInfo, tab }, tabId);
  }

  private onTabRemoved(tabId: number) {
    this.consoleLogs.delete(tabId);
    this.networkRequests.delete(tabId);
    this.sendEvent('tabClosed', { id: tabId }, tabId);
  }

  private onContentScriptMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ): boolean {
    const tabId = sender.tab?.id;
    if (!tabId) return false;

    if (message.type === 'consoleLog') {
      const logs = this.consoleLogs.get(tabId) || [];
      logs.push(message.data);
      this.consoleLogs.set(tabId, logs);
      this.sendEvent('consoleMessage', message.data, tabId);
    }

    return false;
  }

  private onNetworkRequest(details: chrome.webRequest.WebRequestBodyDetails) {
    const tabId = details.tabId;
    if (tabId === -1) return;

    const request: NetworkRequest = {
      id: details.requestId,
      url: details.url,
      method: details.method,
      type: details.type,
      timestamp: details.timeStamp,
      requestBody: details.requestBody,
    };

    const requests = this.networkRequests.get(tabId) || [];
    requests.push(request);
    this.networkRequests.set(tabId, requests);
  }

  private onNetworkComplete(details: chrome.webRequest.WebResponseHeadersDetails) {
    const tabId = details.tabId;
    if (tabId === -1) return;

    const requests = this.networkRequests.get(tabId);
    if (!requests) return;

    const request = requests.find(r => r.id === details.requestId);
    if (request) {
      request.status = details.statusCode;
      request.statusText = details.statusLine;
      request.responseHeaders = details.responseHeaders?.reduce((acc, h) => {
        acc[h.name] = h.value || '';
        return acc;
      }, {} as Record<string, string>);

      this.sendEvent('networkRequest', request, tabId);
    }
  }
}

// Initialize the background worker
new DominatrixBackground();
