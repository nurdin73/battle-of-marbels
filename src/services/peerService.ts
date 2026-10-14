import Peer, { DataConnection } from 'peerjs';
import { NetworkMessage } from '../types/multiplayer.types';

const PEER_PREFIX = 'kelereng-clash-';

export class PeerService {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private messageHandlers: Set<(msg: NetworkMessage) => void> = new Set();
  private connectionHandlers: Set<(connected: boolean) => void> = new Set();
  private errorHandlers: Set<(err: Error) => void> = new Set();
  private pingInterval: number | null = null;
  private currentPing: number = 0;

  /**
   * Helper to format human-readable 6-character room code into Peer ID
   */
  public static formatPeerId(roomCode: string): string {
    const clean = roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `${PEER_PREFIX}${clean}`;
  }

  /**
   * Generate random 6-character room code (e.g., KL79B2)
   */
  public static generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'KL';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Initialize PeerJS instance as Host
   */
  public createHost(roomCode: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.destroy();
      const peerId = PeerService.formatPeerId(roomCode);

      try {
        this.peer = new Peer(peerId, {
          debug: 1,
        });

        this.peer.on('open', (id) => {
          this.setupHostListeners();
          resolve(id);
        });

        this.peer.on('error', (err) => {
          this.notifyErrors(err);
          reject(err);
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  /**
   * Connect to an existing room as Guest
   */
  public joinRoom(roomCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.destroy();

      try {
        // Random guest peer ID
        this.peer = new Peer({ debug: 1 });

        this.peer.on('open', () => {
          const targetPeerId = PeerService.formatPeerId(roomCode);
          const conn = this.peer!.connect(targetPeerId, {
            reliable: true,
          });

          this.setupConnection(conn);

          conn.on('open', () => {
            resolve();
          });

          conn.on('error', (err) => {
            this.notifyErrors(err);
            reject(err);
          });
        });

        this.peer.on('error', (err) => {
          this.notifyErrors(err);
          reject(err);
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  private setupHostListeners(): void {
    if (!this.peer) return;

    this.peer.on('connection', (conn) => {
      // If already connected to another player, close old connection
      if (this.connection) {
        this.connection.close();
      }
      this.setupConnection(conn);
    });
  }

  private setupConnection(conn: DataConnection): void {
    this.connection = conn;

    conn.on('open', () => {
      this.notifyConnection(true);
      this.startPingMeasurement();
    });

    conn.on('data', (data: unknown) => {
      if (typeof data === 'object' && data !== null && 'type' in data) {
        const msg = data as NetworkMessage;
        if (msg.type === 'PING') {
          this.sendMessage({ type: 'PONG', timestamp: msg.timestamp });
          return;
        }
        if (msg.type === 'PONG') {
          const now = Date.now();
          this.currentPing = Math.max(1, now - msg.timestamp);
          return;
        }
        this.notifyMessages(msg);
      }
    });

    conn.on('close', () => {
      this.stopPingMeasurement();
      this.notifyConnection(false);
    });

    conn.on('error', (err) => {
      this.notifyErrors(err);
    });
  }

  public sendMessage(message: NetworkMessage): boolean {
    if (!this.connection || !this.connection.open) {
      return false;
    }
    this.connection.send(message);
    return true;
  }

  public getPing(): number {
    return this.currentPing;
  }

  public isConnected(): boolean {
    return Boolean(this.connection && this.connection.open);
  }

  public onMessage(handler: (msg: NetworkMessage) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  public onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  public onError(handler: (err: Error) => void): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  private notifyMessages(msg: NetworkMessage): void {
    for (const h of this.messageHandlers) {
      try {
        h(msg);
      } catch (err) {
        console.error('Error in message handler:', err);
      }
    }
  }

  private notifyConnection(connected: boolean): void {
    for (const h of this.connectionHandlers) {
      try {
        h(connected);
      } catch (err) {
        console.error('Error in connection handler:', err);
      }
    }
  }

  private notifyErrors(err: Error): void {
    for (const h of this.errorHandlers) {
      try {
        h(err);
      } catch (e) {
        console.error('Error in error handler:', e);
      }
    }
  }

  private startPingMeasurement(): void {
    this.stopPingMeasurement();
    this.pingInterval = window.setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({ type: 'PING', timestamp: Date.now() });
      }
    }, 3000);
  }

  private stopPingMeasurement(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public destroy(): void {
    this.stopPingMeasurement();
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

export const peerService = new PeerService();
