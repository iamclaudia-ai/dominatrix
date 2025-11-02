/**
 * DOMINATRIX Content Script
 * Runs in the context of web pages and has access to the DOM
 */

import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import type { DOMNode, StorageData, ConsoleLog } from './types.js';
import { Interpreter, parse } from '@mariozechner/jailjs';

class DominatrixContentScript {
  private uidCounter = 0;
  private uidMap = new Map<string, Element>();
  private interpreter: Interpreter;

  constructor() {
    // Initialize JailJS interpreter with access to safe globals
    this.interpreter = new Interpreter(
      {
        // Provide access to DOM APIs
        document,
        window,
        console,
        // Allow common utility functions
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
        fetch,
        // JSON utilities
        JSON,
        // Math utilities
        Math,
        Date,
      },
      {
        // Timeout protection: max 1 million operations (prevents infinite loops)
        maxOps: 1000000,
      }
    );

    this.init();
  }

  private init() {
    console.log('🔥 DOMINATRIX Content Script loaded');

    // Listen for messages from background worker
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // Intercept console logs
    this.interceptConsole();
  }

  /**
   * Handle messages from background worker
   */
  private handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ): boolean {
    (async () => {
      try {
        let result: any;

        switch (message.action) {
          case 'getSnapshot':
            result = this.getSnapshot();
            break;

          case 'getHTML':
            result = this.getHTML(message.selector);
            break;

          case 'getText':
            result = this.getText();
            break;

          case 'getMarkdown':
            result = this.getMarkdown();
            break;

          case 'executeScript':
            result = this.executeScript(message.script);
            break;

          case 'evaluateExpression':
            result = this.evaluateExpression(message.expression);
            break;

          case 'getStorage':
            result = this.getStorage();
            break;

          case 'click':
            result = this.click(message.selector);
            break;

          case 'fill':
            result = this.fill(message.selector, message.value);
            break;

          default:
            throw new Error(`Unknown action: ${message.action}`);
        }

        sendResponse({ success: true, data: result });
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    })();

    return true; // Keep message channel open for async response
  }

  /**
   * Build DOM snapshot (a11y tree style)
   */
  private getSnapshot(): DOMNode {
    this.uidCounter = 0;
    this.uidMap.clear();

    return this.buildNode(document.documentElement);
  }

  private buildNode(element: Element): DOMNode {
    const uid = `uid-${this.uidCounter++}`;
    this.uidMap.set(uid, element);

    const node: DOMNode = {
      uid,
      role: this.getRole(element),
      tagName: element.tagName.toLowerCase(),
      name: this.getName(element),
    };

    // Add classList
    if (element.classList.length > 0) {
      node.classList = Array.from(element.classList);
    }

    // Add important attributes
    const attrs: Record<string, string> = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (this.isImportantAttribute(attr.name)) {
        attrs[attr.name] = attr.value;
      }
    }
    if (Object.keys(attrs).length > 0) {
      node.attributes = attrs;
    }

    // Build children (but limit depth for performance)
    const children: DOMNode[] = [];
    for (let i = 0; i < element.children.length; i++) {
      children.push(this.buildNode(element.children[i]));
    }
    if (children.length > 0) {
      node.children = children;
    }

    return node;
  }

  private getRole(element: Element): string {
    // Check explicit role
    const explicitRole = element.getAttribute('role');
    if (explicitRole) return explicitRole;

    // Implicit roles based on tag name
    const tagName = element.tagName.toLowerCase();
    const roleMap: Record<string, string> = {
      a: 'link',
      button: 'button',
      input: this.getInputRole(element as HTMLInputElement),
      textarea: 'textbox',
      select: 'combobox',
      nav: 'navigation',
      main: 'main',
      header: 'banner',
      footer: 'contentinfo',
      article: 'article',
      section: 'region',
      aside: 'complementary',
      h1: 'heading',
      h2: 'heading',
      h3: 'heading',
      h4: 'heading',
      h5: 'heading',
      h6: 'heading',
      ul: 'list',
      ol: 'list',
      li: 'listitem',
      table: 'table',
      form: 'form',
    };

    return roleMap[tagName] || 'generic';
  }

  private getInputRole(input: HTMLInputElement): string {
    const type = input.type.toLowerCase();
    const roleMap: Record<string, string> = {
      button: 'button',
      checkbox: 'checkbox',
      radio: 'radio',
      range: 'slider',
      search: 'searchbox',
      email: 'textbox',
      tel: 'textbox',
      url: 'textbox',
      text: 'textbox',
    };
    return roleMap[type] || 'textbox';
  }

  private getName(element: Element): string {
    // Try various ways to get a meaningful name
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) return labelElement.textContent?.trim() || '';
    }

    if (element.tagName.toLowerCase() === 'input') {
      const input = element as HTMLInputElement;
      if (input.placeholder) return input.placeholder;
      if (input.value) return input.value;
      if (input.labels?.[0]) return input.labels[0].textContent?.trim() || '';
    }

    const textContent = this.getDirectTextContent(element);
    if (textContent) return textContent;

    return '';
  }

  private getDirectTextContent(element: Element): string {
    let text = '';
    for (let i = 0; i < element.childNodes.length; i++) {
      const node = element.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || '';
      }
    }
    return text.trim().substring(0, 100); // Limit length
  }

  private isImportantAttribute(name: string): boolean {
    return [
      'id',
      'name',
      'type',
      'href',
      'src',
      'alt',
      'title',
      'placeholder',
      'value',
      'aria-label',
      'data-testid',
    ].includes(name);
  }

  /**
   * Get HTML of element or whole page
   */
  private getHTML(selector?: string): string {
    if (!selector) {
      return document.documentElement.outerHTML;
    }

    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    return element.outerHTML;
  }

  /**
   * Get plain text content of the page body
   * More efficient than parsing full HTML when you only need text
   */
  private getText(): string {
    return document.body.innerText;
  }

  /**
   * Convert page HTML to Markdown
   * Preserves structure (headings, links, lists) without HTML noise
   */
  private getMarkdown(): string {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    // Add GitHub Flavored Markdown support (tables, strikethrough, etc)
    turndownService.use(gfm);

    // Ignore script and style tags - we don't want that in markdown
    turndownService.remove(['script', 'style', 'noscript']);

    return turndownService.turndown(document.body);
  }

  /**
   * Execute arbitrary JavaScript in page context using JailJS
   * This bypasses CSP restrictions by using AST interpretation instead of eval()
   */
  private executeScript(script: string): any {
    try {
      // First try JailJS (works even with strict CSP)
      const ast = parse(script);
      return this.interpreter.evaluate(ast);
    } catch (jailError) {
      // Fallback to native execution for performance (if CSP allows it)
      try {
        const func = new Function(script);
        return func();
      } catch (cspError) {
        // If both fail, report the JailJS error (more informative)
        throw new Error(`Script execution failed: ${jailError instanceof Error ? jailError.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Evaluate expression and return result using JailJS
   * This bypasses CSP restrictions by using AST interpretation instead of eval()
   */
  private evaluateExpression(expression: string): any {
    try {
      // First try JailJS (works even with strict CSP)
      const ast = parse(expression);
      return this.interpreter.evaluate(ast);
    } catch (jailError) {
      // Fallback to eval for performance (if CSP allows it)
      try {
        return eval(expression);
      } catch (cspError) {
        // If both fail, report the JailJS error (more informative)
        throw new Error(`Expression evaluation failed: ${jailError instanceof Error ? jailError.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Get localStorage and sessionStorage
   */
  private getStorage(): StorageData {
    const localStorage: Record<string, string> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        localStorage[key] = window.localStorage.getItem(key) || '';
      }
    }

    const sessionStorage: Record<string, string> = {};
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key) {
        sessionStorage[key] = window.sessionStorage.getItem(key) || '';
      }
    }

    return { localStorage, sessionStorage };
  }

  /**
   * Click element
   */
  private click(selector: string): void {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    if (element instanceof HTMLElement) {
      element.click();
    } else {
      throw new Error('Element is not clickable');
    }
  }

  /**
   * Fill form field
   */
  private fill(selector: string, value: string): void {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (element instanceof HTMLSelectElement) {
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      throw new Error('Element is not fillable');
    }
  }

  /**
   * Intercept console logs and send to background
   */
  private interceptConsole() {
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalDebug = console.debug;

    const sendLog = (type: ConsoleLog['type'], args: any[]) => {
      const log: ConsoleLog = {
        id: crypto.randomUUID(),
        type,
        message: args.map(arg => this.stringifyArg(arg)).join(' '),
        args,
        timestamp: Date.now(),
        url: window.location.href,
      };

      chrome.runtime.sendMessage({
        type: 'consoleLog',
        data: log,
      });
    };

    console.log = (...args: any[]) => {
      sendLog('log', args);
      originalLog.apply(console, args);
    };

    console.info = (...args: any[]) => {
      sendLog('info', args);
      originalInfo.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      sendLog('warn', args);
      originalWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      sendLog('error', args);
      originalError.apply(console, args);
    };

    console.debug = (...args: any[]) => {
      sendLog('debug', args);
      originalDebug.apply(console, args);
    };
  }

  private stringifyArg(arg: any): string {
    if (typeof arg === 'string') return arg;
    if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';

    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }
}

// Initialize the content script
new DominatrixContentScript();
