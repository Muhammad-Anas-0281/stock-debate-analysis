// lib/socket.ts — WebSocket client for real-time debate streaming

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export class DebateSocket {
  private ws: WebSocket | null = null;
  private debateId: string;
  private onMessage: (data: Record<string, unknown>) => void;
  private onError: (error: string) => void;
  private onClose: () => void;
  private reconnectAttempts = 0;
  private maxReconnects = 3;

  constructor(
    debateId: string,
    onMessage: (data: Record<string, unknown>) => void,
    onError: (error: string) => void,
    onClose: () => void
  ) {
    this.debateId = debateId;
    this.onMessage = onMessage;
    this.onError = onError;
    this.onClose = onClose;
  }

  connect(): void {
    const url = `${WS_URL}/api/debate/ws/${this.debateId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log(`[DebateSocket] Connected to debate ${this.debateId}`);
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "ping") return; // Heartbeat
        this.onMessage(data);
      } catch (err) {
        console.error("[DebateSocket] Parse error:", err);
      }
    };

    this.ws.onerror = () => {
      this.onError("WebSocket connection error");
    };

    this.ws.onclose = () => {
      this.onClose();
      if (this.reconnectAttempts < this.maxReconnects) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), 1500 * this.reconnectAttempts);
      }
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect on manual close
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
