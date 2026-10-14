import { Peer, DataConnection } from 'peerjs';
import { MultiplayerStatus, PeerMessage } from '../../types/multiplayer.types';

export class PeerService {
  private static instance: PeerService | null = null;
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;

  public onStatusChange: ((status: MultiplayerStatus, errorMsg?: string) => void) | null = null;
  public onMessage: ((message: PeerMessage) => void) | null = null;

  private constructor() {}

  public static getInstance(): PeerService {
    if (!PeerService.instance) {
      PeerService.instance = new PeerService();
    }
    return PeerService.instance;
  }

  /**
   * Generates a clean, human-friendly 4-character room code (e.g. KLRNG-7842)
   */
  public generateRoomId(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `KLRNG-${code}`;
  }

  /**
   * Initializes host peer and listens for guest connection
   */
  public async initHost(roomId?: string): Promise<string> {
    this.disconnect();
    const finalRoomId = roomId || this.generateRoomId();
    this.updateStatus('CREATING_ROOM');

    return new Promise((resolve, reject) => {
      try {
        const peer = new Peer(finalRoomId, {
          debug: 1,
        });

        this.peer = peer;

        peer.on('open', (id) => {
          this.updateStatus('WAITING_FOR_OPPONENT');
          resolve(id);
        });

        peer.on('connection', (conn) => {
          this.connection = conn;
          this.setupConnectionListeners(conn);
          this.updateStatus('CONNECTED');
        });

        peer.on('error', (err) => {
          const errMsg = err.message || 'Koneksi PeerJS error';
          this.updateStatus('DISCONNECTED', errMsg);
          reject(err);
        });

        peer.on('disconnected', () => {
          this.updateStatus('DISCONNECTED', 'Koneksi terputus dari signaling server');
        });
      } catch (err) {
        this.updateStatus('DISCONNECTED', 'Gagal menginisialisasi Host');
        reject(err);
      }
    });
  }

  /**
   * Connects to an existing host room code as Guest
   */
  public async connectToHost(hostRoomId: string): Promise<void> {
    this.disconnect();
    this.updateStatus('CONNECTING');

    return new Promise((resolve, reject) => {
      try {
        const peer = new Peer({
          debug: 1,
        });
        this.peer = peer;

        peer.on('open', () => {
          const conn = peer.connect(hostRoomId.trim().toUpperCase(), {
            reliable: true,
          });
          this.connection = conn;
          this.setupConnectionListeners(conn);

          conn.on('open', () => {
            this.updateStatus('CONNECTED');
            resolve();
          });
        });

        peer.on('error', (err) => {
          const errMsg = err.type === 'peer-unavailable'
            ? 'Kamar tidak ditemukan atau host sudah keluar.'
            : err.message || 'Gagal terhubung ke host';
          this.updateStatus('DISCONNECTED', errMsg);
          reject(err);
        });
      } catch (err) {
        this.updateStatus('DISCONNECTED', 'Gagal membuat koneksi Guest');
        reject(err);
      }
    });
  }

  /**
   * Set up message listeners on WebRTC DataConnection
   */
  private setupConnectionListeners(conn: DataConnection): void {
    conn.on('data', (data) => {
      if (this.onMessage && typeof data === 'object' && data !== null && 'type' in data) {
        this.onMessage(data as PeerMessage);
      }
    });

    conn.on('close', () => {
      this.updateStatus('DISCONNECTED', 'Lawan telah meninggalkan pertandingan');
    });

    conn.on('error', (err) => {
      this.updateStatus('DISCONNECTED', `Koneksi data error: ${err.message || 'Unknown'}`);
    });
  }

  /**
   * Send a strongly-typed PeerMessage to the connected peer
   */
  public send(message: PeerMessage): boolean {
    if (this.connection && this.connection.open) {
      this.connection.send(message);
      return true;
    }
    return false;
  }

  public isConnected(): boolean {
    return !!(this.connection && this.connection.open);
  }

  private updateStatus(status: MultiplayerStatus, errorMsg?: string): void {
    if (this.onStatusChange) {
      this.onStatusChange(status, errorMsg);
    }
  }

  public disconnect(): void {
    if (this.connection) {
      try {
        this.connection.close();
      } catch {
        // ignore
      }
      this.connection = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // ignore
      }
      this.peer = null;
    }

    this.updateStatus('IDLE');
  }
}

export const peerService = PeerService.getInstance();

