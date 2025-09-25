// utils/websocketClient.ts
class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private isConnecting = false;
  private callbacks: any = {};

  connect(url: string) {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("✅ WebSocket connected");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.callbacks.onConnected?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.callbacks.onMessage?.(data);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      this.ws.onclose = (event) => {
        console.log("❌ WebSocket disconnected:", event.code, event.reason);
        this.isConnecting = false;
        this.callbacks.onDisconnected?.(event);

        // Attempt reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(url);
          }, this.reconnectInterval);
        }
      };

      this.ws.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        this.isConnecting = false;
        this.callbacks.onError?.(error);
      };
    } catch (error) {
      console.error("❌ Error creating WebSocket:", error);
      this.isConnecting = false;
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  disconnect() {
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  setCallbacks(callbacks: any) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  getReadyState() {
    return this.ws?.readyState;
  }
}

export const websocketClient = new WebSocketClient();
