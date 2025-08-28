/**
 * @file session-manager.ts
 * @description Manages temporary P2P sessions and their states.
 */

import { ConnectionStatus } from './p2p-core';

/**
 * Represents a single P2P session.
 */
export interface Session {
  id: string; // Unique ID for the session (e.g., remote peer ID)
  remotePeerId: string;
  status: ConnectionStatus;
  dataConnection: any; // The PeerJS DataConnection object or equivalent
  fileTransferProgress: number; // 0-100
  receivedFiles: { name: string; url: string }[];
  lastActivity: number; // Timestamp of last activity for cleanup
}

/**
 * Manages multiple P2P sessions.
 */
export class SessionManager {
  private sessions: Map<string, Session>;

  constructor() {
    this.sessions = new Map<string, Session>();
  }

  /**
   * Creates and adds a new session.
   * @param remotePeerId The ID of the remote peer.
   * @param dataConnection The PeerJS DataConnection object.
   * @returns The newly created session.
   */
  createSession(remotePeerId: string, dataConnection: any): Session {
    const newSession: Session = {
      id: remotePeerId,
      remotePeerId,
      status: 'connecting',
      dataConnection,
      fileTransferProgress: 0,
      receivedFiles: [],
      lastActivity: Date.now(),
    };
    this.sessions.set(remotePeerId, newSession);
    return newSession;
  }

  /**
   * Updates the status of a session.
   * @param sessionId The ID of the session to update.
   * @param status The new connection status.
   */
  updateSessionStatus(sessionId: string, status: ConnectionStatus): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = status;
      session.lastActivity = Date.now();
    }
  }

  /**
   * Updates the file transfer progress for a session.
   * @param sessionId The ID of the session.
   * @param progress The new progress (0-100).
   */
  updateFileTransferProgress(sessionId: string, progress: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.fileTransferProgress = progress;
      session.lastActivity = Date.now();
    }
  }

  /**
   * Adds a received file to a session.
   * @param sessionId The ID of the session.
   * @param file The received file object.
   */
  addReceivedFile(sessionId: string, file: { name: string; url: string }): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.receivedFiles.push(file);
      session.lastActivity = Date.now();
    }
  }

  /**
   * Retrieves a session by its ID.
   * @param sessionId The ID of the session.
   * @returns The session object, or undefined if not found.
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Removes a session by its ID.
   * @param sessionId The ID of the session to remove.
   */
  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Cleans up inactive sessions based on a timeout.
   * @param timeoutMs The timeout in milliseconds. Sessions older than this will be removed.
   */
  cleanupInactiveSessions(timeoutMs: number): void {
    const now = Date.now();
    this.sessions.forEach((session, sessionId) => {
      if (now - session.lastActivity > timeoutMs) {
        console.log(`Cleaning up inactive session: ${sessionId}`);
        session.dataConnection.close(); // Close the underlying connection
        this.removeSession(sessionId);
      }
    });
  }

  /**
   * Returns all active sessions.
   * @returns An array of all active sessions.
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }
}
