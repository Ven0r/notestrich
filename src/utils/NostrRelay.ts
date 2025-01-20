export class NostrRelay {
  private ws: WebSocket | null = null;
  private relayUrl: string;
  private onEventCallback: (event: any) => void;
  private isConnected: boolean = false;

  constructor(relayUrl: string, onEventCallback: (event: any) => void) {
    this.relayUrl = relayUrl;
    this.onEventCallback = onEventCallback;
  }

  connect() {
    if (this.ws) {
      console.log('WebSocket already connected.');
      return;
    }

    this.ws = new WebSocket(this.relayUrl);

    this.ws.onopen = () => {
      console.log(`Connected to relay: ${this.relayUrl}`);
      this.isConnected = true;
    };

    this.ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data[0] === 'EVENT') {
        this.onEventCallback(data[2]);
      }
    };

    this.ws.onclose = () => {
      console.log('Relay connection closed');
      this.ws = null;
      this.isConnected = false;
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  async waitForConnection(): Promise<void> {
    if (this.isConnected) return;

    console.log('Waiting for WebSocket to connect...');
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (this.isConnected) {
          clearInterval(interval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        if (!this.isConnected) {
          clearInterval(interval);
          reject(new Error('WebSocket connection timeout.'));
        }
      }, 5000); // Timeout after 5 seconds
    });
  }

  async subscribe(subscriptionId: string, filter: any) {
    const shortId = subscriptionId.substring(0, 16); // Truncate to 16 characters
    await this.waitForConnection();

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log(`Subscribing with ID: ${shortId}`);
      this.ws.send(JSON.stringify(['REQ', shortId, filter]));
    } else {
      console.error('WebSocket not connected. Cannot subscribe.');
    }
  }

  unsubscribe(subscriptionId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log(`Unsubscribing from ID: ${subscriptionId}`);
      this.ws.send(JSON.stringify(['CLOSE', subscriptionId]));
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }

  /**
     * One-time metadata fetch
     */
  async fetchMetadataOnce(pubkey: string): Promise<{ name: string; picture: string } | null> {
    await this.waitForConnection();

    return new Promise((resolve) => {
      const subscriptionId = `metadata-once-${Date.now()}`;
      let finished = false;

      // Subscribe for kind:0 events for this pubkey
      this.subscribe(subscriptionId, {
        kinds: [0],
        authors: [pubkey],
        limit: 1,
      });

      const handleSingleEvent = (event: any) => {
        // Only handle if it matches our subscription ID from the relay
        // Some relays put subscriptionId in data[1], so you might see that above in onmessage
        // For simplicity, we assume we can filter by event kind/pubkey here
        if (event.kind === 0 && event.pubkey === pubkey && !finished) {
          finished = true;
          const content = JSON.parse(event.content);
          const metadata = {
            name: content.name || 'Unknown',
            picture: content.picture || '/default-profile.jpg',
          };

          // Unsubscribe immediately
          this.unsubscribe(subscriptionId);
          resolve(metadata);
        }
      };

      // Temporary callback wrapper
      const originalCallback = this.onEventCallback;
      this.onEventCallback = (event: any) => {
        handleSingleEvent(event);
        // Also call the original
        originalCallback(event);
      };

      // Fallback in case no metadata event is found
      setTimeout(() => {
        if (!finished) {
          console.log('No metadata found within 10s, unsubscribing...');
          this.unsubscribe(subscriptionId);
          resolve(null);
        }
      }, 10000);
    });
  }
}
