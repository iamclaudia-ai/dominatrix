#!/usr/bin/env bun
/**
 * DOMINATRIX WebSocket Server
 * Bridges CLI commands with Chrome Extension
 */

import { WebSocketServer, WebSocket } from 'ws';

const PORT = 9222;
const HOST = 'localhost';

interface Client {
  ws: WebSocket;
  type: 'extension' | 'cli';
  id: string;
  tabId?: number;
}

class DominatrixServer {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private pendingRequests: Map<string, { resolve: (data: any) => void; reject: (error: any) => void }> = new Map();

  constructor() {
    console.log('🔥 DOMINATRIX Server starting...');

    this.wss = new WebSocketServer({
      host: HOST,
      port: PORT
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', (error) => {
      console.error('❌ WebSocket Server Error:', error);
    });

    console.log(`✅ DOMINATRIX Server running on ws://${HOST}:${PORT}`);
    console.log('💪 Ready to dominate some DOMs!');
  }

  private handleConnection(ws: WebSocket) {
    const clientId = crypto.randomUUID();

    console.log(`🔌 New connection: ${clientId}`);

    // Determine client type based on first message
    let client: Client | null = null;

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        // Register client on first message
        if (!client) {
          client = {
            ws,
            type: this.detectClientType(message),
            id: clientId,
          };
          this.clients.set(clientId, client);
          console.log(`✨ Client registered as: ${client.type}`);
        }

        // Route message based on type
        if (message.type === 'command' && client.type === 'cli') {
          await this.handleCliCommand(message, client);
        } else if (message.type === 'response') {
          this.handleResponse(message);
        } else if (message.type === 'event' && client.type === 'extension') {
          this.handleEvent(message);
        }
      } catch (error) {
        console.error('Error handling message:', error);
        this.sendError(ws, 'Failed to process message', error);
      }
    });

    ws.on('close', () => {
      if (client) {
        console.log(`🔌 Client disconnected: ${client.type} (${clientId})`);
        this.clients.delete(clientId);
      }
    });

    ws.on('error', (error) => {
      console.error(`❌ Client error (${clientId}):`, error);
    });
  }

  private detectClientType(message: any): 'extension' | 'cli' {
    // Extensions send events, CLI sends commands
    if (message.type === 'event') return 'extension';
    if (message.type === 'command') return 'cli';

    // Default to CLI
    return 'cli';
  }

  private async handleCliCommand(message: any, cliClient: Client) {
    console.log(`📥 CLI Command: ${message.action}`);

    // Find an extension client to handle this command
    const extensionClient = this.findExtensionClient(message.tabId);

    if (!extensionClient) {
      this.sendError(
        cliClient.ws,
        'No browser extension connected',
        { command: message.action }
      );
      return;
    }

    // Forward command to extension
    extensionClient.ws.send(JSON.stringify(message));

    // Wait for response
    // The extension will send back a response with requestId matching message.id
    // This will be handled by handleResponse()
  }

  private handleResponse(message: any) {
    console.log(`📤 Response for request: ${message.requestId}`);

    // Find CLI clients and broadcast response
    for (const client of this.clients.values()) {
      if (client.type === 'cli') {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  private handleEvent(message: any) {
    console.log(`📢 Event: ${message.event}`);

    // Broadcast events to all CLI clients
    for (const client of this.clients.values()) {
      if (client.type === 'cli') {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  private findExtensionClient(tabId?: number): Client | undefined {
    // For now, just return the first extension client
    // TODO: Implement proper tab routing
    for (const client of this.clients.values()) {
      if (client.type === 'extension') {
        return client;
      }
    }
    return undefined;
  }

  private sendError(ws: WebSocket, error: string, details?: any) {
    ws.send(JSON.stringify({
      id: crypto.randomUUID(),
      type: 'error',
      timestamp: Date.now(),
      error,
      details,
    }));
  }

  /**
   * Get server stats
   */
  public getStats() {
    const extensions = Array.from(this.clients.values()).filter(c => c.type === 'extension').length;
    const clis = Array.from(this.clients.values()).filter(c => c.type === 'cli').length;

    return {
      totalClients: this.clients.size,
      extensions,
      clis,
    };
  }
}

// Start the server
const server = new DominatrixServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 DOMINATRIX Server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 DOMINATRIX Server shutting down...');
  process.exit(0);
});
