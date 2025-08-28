/**
 * @file p2p-core.ts
 * @description Defines common interfaces and types for P2P communication across web and native platforms.
 * This file serves as a blueprint for abstracting P2P logic.
 */

/**
 * Represents the status of a P2P connection.
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Interface for a P2P peer.
 * This abstracts the underlying PeerJS or native WebRTC peer object.
 */
export interface IP2PPeer {
  id: string; // The unique ID of the peer
  on(event: 'open', callback: (id: string) => void): void;
  on(event: 'connection', callback: (conn: IP2PConnection) => void): void;
  on(event: 'error', callback: (err: Error) => void): void;
  on(event: 'close', callback: () => void): void;
  connect(remotePeerId: string): IP2PConnection;
  destroy(): void;
}

/**
 * Interface for a P2P data connection.
 * This abstracts the underlying PeerJS DataConnection or native data channel.
 */
export interface IP2PConnection {
  peer: string; // The ID of the remote peer connected to
  on(event: 'open', callback: () => void): void;
  on(event: 'data', callback: (data: any) => void): void;
  on(event: 'close', callback: () => void): void;
  on(event: 'error', callback: (err: Error) => void): void;
  send(data: any): void;
  close(): void;
}

/**
 * Defines the structure for file metadata during transfer.
 */
export interface FileMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
}

/**
 * Defines the structure for a data chunk during file transfer.
 * Files can be sent in chunks to handle large files efficiently.
 */
export interface FileChunk {
  metadata: FileMetadata;
  chunk: ArrayBuffer; // The actual binary data chunk
  chunkIndex: number;
  totalChunks: number;
}

/**
 * Utility type for a generic event handler.
 */
export type EventHandler<T> = (payload: T) => void;

/**
 * Abstract class or interface for a P2P service that can be implemented
 * differently for web (using PeerJS/WebRTC for medium-range P2P) and native (using platform-specific APIs like WebRTC, Bluetooth, or LAN sockets).
 * LAN communication can be handled by WebRTC (local discovery) or direct socket communication for native apps.
 */
export interface IP2PService {
  init(config?: any): Promise<string>; // Initializes the P2P service, returns own ID
  connect(remoteId: string): Promise<IP2PConnection>; // Connects to a remote peer
  sendFile(connection: IP2PConnection, file: File): Promise<void>; // Sends a file over a connection
  onConnection(handler: EventHandler<IP2PConnection>): void; // Registers a handler for incoming connections
  onData(connection: IP2PConnection, handler: EventHandler<any>): void; // Registers a handler for incoming data
  onFileReceived(handler: EventHandler<{ metadata: FileMetadata; data: ArrayBuffer }>): void; // Registers a handler for complete file reception
  onStatusChange(handler: EventHandler<ConnectionStatus>): void; // Registers a handler for status changes
  destroy(): void; // Cleans up the P2P service
}
