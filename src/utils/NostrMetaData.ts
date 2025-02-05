// src/utils/NostrMetadata.ts
export class NostrMetadata {
  private relays: NostrRelay[];
  private metadataCache: Record<string, { name: string; picture: string }> = {};
  private pendingRequests: Map<string, Function[]> = new Map();

  constructor(relays: NostrRelay[]) {
    this.relays = relays;
  }

  async getMetadata(pubkey: string): Promise<{ name: string; picture: string }> {
    if (this.metadataCache[pubkey]) {
      return this.metadataCache[pubkey];
    }

    const storedMetadata = localStorage.getItem(pubkey);
    if (storedMetadata) {
      return JSON.parse(storedMetadata);
    }

    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null;
      const subscriptionIds: string[] = [];
      let hasReceivedMetadata = false;

      const handleMetadata = (metadata: { name: string; picture: string }) => {
        if (!hasReceivedMetadata) {
          hasReceivedMetadata = true;

          // Cancel other subscriptions
          subscriptionIds.forEach(subId => {
            this.relays.forEach(relay => relay.unsubscribe(subId));
          });

          // Clear timeout if it was set
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          this.updateMetadata(pubkey, metadata);
          resolve(metadata);
        }
      };

      this.pendingRequests.set(pubkey, [resolve]);

      this.relays.forEach(relay => {
        const subId = `metadata-${pubkey}-${Math.random().toString(36).slice(2, 11)}`;
        subscriptionIds.push(subId);
        relay.subscribe(subId, {
          kinds: [0],
          authors: [pubkey],
          limit: 1
        }, handleMetadata);
      });

      // Set up timeout for no response scenario
      timeoutId = setTimeout(() => {
        if (!hasReceivedMetadata) {
          subscriptionIds.forEach(subId => {
            this.relays.forEach(relay => relay.unsubscribe(subId));
          });
          this.pendingRequests.delete(pubkey);
          reject(new Error('Timeout: No metadata received from any relay.'));
        }
      }, 5000); // 5 seconds timeout, adjust as needed
    });
  }

  updateMetadata(pubkey: string, metadata: { name: string; picture: string }) {
    this.metadataCache[pubkey] = metadata;
    // Here, when the metadata is updated, it will be reflected in local storage
    // through the handleEvent function when the pubkey matches the logged-in user's
    localStorage.setItem(pubkey, JSON.stringify(metadata));
    const resolvers = this.pendingRequests.get(pubkey) || [];
    while (resolvers.length) {
      const resolve = resolvers.pop();
      resolve?.(metadata);
    }
    this.pendingRequests.delete(pubkey);
  }
}
