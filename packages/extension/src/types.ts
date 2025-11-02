/**
 * DOMINATRIX Message Protocol
 * Communication between Extension, Server, and CLI
 */

export type MessageType = 'command' | 'event' | 'response' | 'error';

export interface BaseMessage {
  id: string;
  type: MessageType;
  timestamp: number;
}

export interface CommandMessage extends BaseMessage {
  type: 'command';
  action: CommandAction;
  payload?: any;
  tabId?: number;
}

export interface ResponseMessage extends BaseMessage {
  type: 'response';
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
}

export interface EventMessage extends BaseMessage {
  type: 'event';
  event: EventType;
  data: any;
  tabId: number;
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  error: string;
  details?: any;
}

export type Message = CommandMessage | ResponseMessage | EventMessage | ErrorMessage;

/**
 * Command Actions - What the CLI can request
 */
export type CommandAction =
  // Tab Management
  | 'listTabs'
  | 'selectTab'
  | 'getActiveTab'

  // DOM & Inspection
  | 'snapshot'
  | 'getHTML'
  | 'screenshot'

  // Script Execution
  | 'executeScript'
  | 'evaluateExpression'

  // Network
  | 'listNetworkRequests'
  | 'getNetworkRequest'
  | 'clearNetworkRequests'

  // Console
  | 'getConsoleLogs'
  | 'clearConsole'

  // Interaction
  | 'click'
  | 'fill'
  | 'navigate'

  // Storage & Cookies
  | 'getCookies'
  | 'setCookie'
  | 'getStorage';

/**
 * Event Types - What the extension can broadcast
 */
export type EventType =
  | 'tabCreated'
  | 'tabUpdated'
  | 'tabClosed'
  | 'pageLoad'
  | 'consoleMessage'
  | 'networkRequest'
  | 'navigationComplete';

/**
 * Tab Information
 */
export interface TabInfo {
  id: number;
  url: string;
  title: string;
  active: boolean;
  windowId: number;
}

/**
 * DOM Snapshot (a11y tree style, similar to chrome-devtools-mcp)
 */
export interface DOMNode {
  uid: string;
  role: string;
  name?: string;
  tagName?: string;
  classList?: string[];
  attributes?: Record<string, string>;
  children?: DOMNode[];
}

/**
 * Console Log Entry
 */
export interface ConsoleLog {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  args?: any[];
  timestamp: number;
  url?: string;
  lineNumber?: number;
}

/**
 * Network Request
 */
export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  type: string;
  initiator?: string;
  timestamp: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
}

/**
 * Cookie
 */
export interface CookieInfo extends chrome.cookies.Cookie {
  // Extends Chrome's Cookie type
}

/**
 * Storage Data
 */
export interface StorageData {
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
}
