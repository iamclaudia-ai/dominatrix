#!/usr/bin/env bun
/**
 * DOMINATRIX WebSocket Server
 * Bridges CLI commands with Chrome Extension
 */

import { WebSocketServer, WebSocket } from 'ws';

const PORT = 9222;
const HOST = 'localhost';

interface ProfileInfo {
  extensionId: string;
  instanceId: string;
  profileName?: string;
}

interface Client {
  ws: WebSocket;
  type: 'extension' | 'cli';
  id: string;
  profile?: ProfileInfo;  // Profile info for extension clients
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
          this.handleEvent(message, client);
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
    console.log(`📥 CLI Command: ${message.action}${message.profileId ? ` (profile: ${message.profileId})` : ''}`);

    // Find an extension client to handle this command
    const extensionClient = this.findExtensionClient(message.tabId, message.profileId);

    if (!extensionClient) {
      this.sendError(
        cliClient.ws,
        'No browser extension connected' + (message.profileId ? ` for profile ${message.profileId}` : ''),
        { command: message.action, profileId: message.profileId }
      );
      return;
    }

    // Log which profile is handling this
    if (extensionClient.profile) {
      console.log(`   → Routing to: ${extensionClient.profile.profileName || extensionClient.profile.instanceId}`);
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

  private handleEvent(message: any, extensionClient: Client) {
    console.log(`📢 Event: ${message.event}`);

    // If this is a 'connected' event, store the profile info
    if (message.event === 'connected' && message.data?.profile) {
      extensionClient.profile = message.data.profile;
      console.log(`✨ Extension profile: ${extensionClient.profile.profileName || extensionClient.profile.instanceId}`);
    }

    // Broadcast events to all CLI clients
    for (const client of this.clients.values()) {
      if (client.type === 'cli') {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  private findExtensionClient(tabId?: number, profileId?: string): Client | undefined {
    const extensionClients = Array.from(this.clients.values()).filter(c => c.type === 'extension');

    // If no extension clients, return undefined
    if (extensionClients.length === 0) return undefined;

    // If only one extension client, use it
    if (extensionClients.length === 1) return extensionClients[0];

    // If profileId specified, find that specific profile
    if (profileId) {
      const client = extensionClients.find(c => c.profile?.instanceId === profileId);
      if (client) return client;
    }

    // If tabId specified, we need to query all extensions for that tab
    // For now, just return the first extension
    // TODO: Implement tab ownership tracking
    return extensionClients[0];
  }

  /**
   * List all tabs across all connected extension instances
   */
  private async listAllTabs(): Promise<any[]> {
    const allTabs: any[] = [];
    const extensionClients = Array.from(this.clients.values()).filter(c => c.type === 'extension');

    // Query each extension for its tabs
    for (const client of extensionClients) {
      try {
        // Send listTabs command to this extension
        const requestId = crypto.randomUUID();
        const message = {
          id: requestId,
          type: 'command',
          action: 'listTabs',
          timestamp: Date.now(),
        };

        client.ws.send(JSON.stringify(message));

        // Wait for response (handled by handleResponse)
        // For now, we'll collect tabs synchronously
      } catch (error) {
        console.error(`Failed to get tabs from profile ${client.profile?.profileName}:`, error);
      }
    }

    return allTabs;
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
