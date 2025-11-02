/**
 * DOMINATRIX WebSocket Client
 * Connects to server and sends commands
 */

import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

const WS_URL = 'ws://localhost:9222';

export class DominatrixClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private connected = false;
  private pendingRequests = new Map<string, { resolve: (data: any) => void; reject: (error: Error) => void; timeout: NodeJS.Timeout }>();

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(WS_URL);

        this.ws.on('open', () => {
          this.connected = true;
          this.emit('connected');
          resolve();
        });

        this.ws.on('message', (data: Buffer) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('close', () => {
          this.connected = false;
          this.emit('disconnected');
        });

        this.ws.on('error', (error) => {
          this.emit('error', error);
          if (!this.connected) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);

      if (message.type === 'response') {
        this.handleResponse(message);
      } else if (message.type === 'event') {
        this.emit('event', message);
      } else if (message.type === 'error') {
        this.emit('server-error', message);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  private handleResponse(message: any) {
    const pending = this.pendingRequests.get(message.requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(message.requestId);

      if (message.success) {
        pending.resolve(message.data);
      } else {
        pending.reject(new Error(message.error || 'Command failed'));
      }
    }
  }

  async sendCommand(action: string, payload?: any, tabId?: number): Promise<any> {
    if (!this.connected || !this.ws) {
      throw new Error('Not connected to server');
    }

    const id = crypto.randomUUID();
    const message = {
      id,
      type: 'command',
      action,
      payload,
      tabId,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      // Set timeout for command
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Command timeout'));
      }, 30000); // 30 second timeout

      this.pendingRequests.set(id, { resolve, reject, timeout });

      this.ws!.send(JSON.stringify(message));
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
