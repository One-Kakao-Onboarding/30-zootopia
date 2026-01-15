import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// SockJS endpoint (HTTP, not WS)
const WS_URL = 'https://zootopia-be.onrender.com/api/ws';

export interface WebSocketMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  type: string;
  eventType: string | null;
  eventDetected: boolean;
  aiInsight: string | null;
  isAutoReply: boolean;
  createdAt: string;
}

type MessageCallback = (message: WebSocketMessage) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map();
  private messageCallbacks: Map<number, MessageCallback[]> = new Map();
  private userId: number | null = null;
  private connectionPromise: Promise<void> | null = null;

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  async connect(userId: number): Promise<void> {
    // If already connected, return
    if (this.isConnected()) {
      console.log('[WS] Already connected');
      return;
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.userId = userId;

    this.connectionPromise = new Promise<void>((resolve, reject) => {
      console.log('[WS] Connecting to:', WS_URL, 'for user:', userId);

      this.client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: {
          userId: userId.toString(),
        },
        debug: (msg) => {
          // Only log important messages
          if (msg.includes('CONNECT') || msg.includes('SUBSCRIBE') || msg.includes('MESSAGE')) {
            console.log('[STOMP]', msg);
          }
        },
        reconnectDelay: 3000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          console.log('[WS] Connected successfully!');
          this.connectionPromise = null;
          resolve();
        },
        onStompError: (frame) => {
          console.error('[WS] STOMP Error:', frame.headers['message']);
          this.connectionPromise = null;
          reject(new Error(frame.headers['message'] || 'STOMP error'));
        },
        onWebSocketError: (event) => {
          console.error('[WS] WebSocket Error:', event);
          this.connectionPromise = null;
          reject(new Error('WebSocket connection failed'));
        },
        onWebSocketClose: () => {
          console.log('[WS] Connection closed');
        },
        onDisconnect: () => {
          console.log('[WS] Disconnected');
        },
      });

      this.client.activate();

      // Timeout after 15 seconds
      setTimeout(() => {
        if (!this.isConnected()) {
          console.error('[WS] Connection timeout');
          this.connectionPromise = null;
          this.client?.deactivate();
          reject(new Error('Connection timeout'));
        }
      }, 15000);
    });

    return this.connectionPromise;
  }

  disconnect(): void {
    console.log('[WS] Disconnecting...');
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
    this.messageCallbacks.clear();
    this.client?.deactivate();
    this.client = null;
    this.connectionPromise = null;
  }

  subscribe(chatRoomId: number, callback: MessageCallback): () => void {
    const destination = `/topic/chat/${chatRoomId}`;

    if (!this.client || !this.isConnected()) {
      console.error('[WS] Cannot subscribe - not connected');
      return () => {};
    }

    // Add callback
    const callbacks = this.messageCallbacks.get(chatRoomId) || [];
    callbacks.push(callback);
    this.messageCallbacks.set(chatRoomId, callbacks);

    // Subscribe if not already subscribed
    if (!this.subscriptions.has(destination)) {
      console.log('[WS] Subscribing to:', destination);

      const subscription = this.client.subscribe(destination, (message: IMessage) => {
        try {
          const data: WebSocketMessage = JSON.parse(message.body);
          console.log('[WS] Message received:', data.content?.substring(0, 50));

          const cbs = this.messageCallbacks.get(chatRoomId);
          cbs?.forEach((cb) => cb(data));
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      });

      this.subscriptions.set(destination, subscription);
      console.log('[WS] Subscribed to:', destination);
    }

    // Return unsubscribe function
    return () => {
      const cbs = this.messageCallbacks.get(chatRoomId);
      if (cbs) {
        const idx = cbs.indexOf(callback);
        if (idx > -1) cbs.splice(idx, 1);

        if (cbs.length === 0) {
          this.messageCallbacks.delete(chatRoomId);
          const sub = this.subscriptions.get(destination);
          if (sub) {
            sub.unsubscribe();
            this.subscriptions.delete(destination);
            console.log('[WS] Unsubscribed from:', destination);
          }
        }
      }
    };
  }
}

export const wsService = new WebSocketService();
