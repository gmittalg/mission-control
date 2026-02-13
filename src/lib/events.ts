/**
 * Server-Sent Events (SSE) broadcaster for real-time updates
 * Manages client connections and broadcasts events to all listeners
 */

import type { SSEEvent } from './types';

// Store active SSE client connections per clientId
const clients = new Map<string, Set<ReadableStreamDefaultController>>();

/**
 * Register a new SSE client connection
 */
export function registerClient(clientId: string, controller: ReadableStreamDefaultController): void {
  if (!clients.has(clientId)) {
    clients.set(clientId, new Set());
  }
  clients.get(clientId)!.add(controller);
}

/**
 * Unregister an SSE client connection
 */
export function unregisterClient(clientId: string, controller: ReadableStreamDefaultController): void {
  const clientSet = clients.get(clientId);
  if (clientSet) {
    clientSet.delete(controller);
    if (clientSet.size === 0) {
      clients.delete(clientId);
    }
  }
}

/**
 * Broadcast an event to all connected SSE clients for a specific client
 */
export function broadcast(clientId: string, event: SSEEvent): void {
  const encoder = new TextEncoder();
  const data = `data: ${JSON.stringify(event)}\n\n`;
  const encoded = encoder.encode(data);

  const clientSet = clients.get(clientId);
  if (!clientSet) {
    console.log(`[SSE] No clients connected for client ${clientId}, skipping broadcast of ${event.type}`);
    return;
  }

  // Send to all connected clients for this clientId
  const clientsArray = Array.from(clientSet);
  for (const client of clientsArray) {
    try {
      client.enqueue(encoded);
    } catch (error) {
      // Client disconnected, remove it
      console.error(`Failed to send SSE event to client for ${clientId}:`, error);
      clientSet.delete(client);
    }
  }

  if (clientSet.size === 0) {
    clients.delete(clientId);
  }

  console.log(`[SSE] Broadcast ${event.type} to ${clientSet.size} client(s) for ${clientId}`);
}

/**
 * Get the number of active SSE connections
 */
export function getActiveConnectionCount(): number {
  return clients.size;
}
