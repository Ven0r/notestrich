// src/utils/NostrMetadata.ts
export class NostrMetadata {
  private metadataCache: Record<string, { name: string; picture: string }> = {};
  private relay: NostrRelay;
  private pendingRequests: Map<string, Function[]> = new Map();

  constructor(relay: NostrRelay) {
    this.relay = relay;
  }

  // Modified: Return a promise that resolves when metadata is available
  async getMetadata(pubkey: string): Promise<{ name: string; picture: string }> {
    if (this.metadataCache[pubkey]) {
      return this.metadataCache[pubkey];
    }

    return new Promise((resolve) => {
      // Store resolve callbacks to call when metadata arrives
      if (!this.pendingRequests.has(pubkey)) {
        this.pendingRequests.set(pubkey, []);
        this.relay.subscribe(`metadata-${pubkey}`, {
          kinds: [0],
          authors: [pubkey],
          limit: 1
        });
      }
      this.pendingRequests.get(pubkey)?.push(resolve);
    });
  }

  // Modified: Handle pending promises when metadata updates
  updateMetadata(pubkey: string, metadata: { name: string; picture: string }) {
    this.metadataCache[pubkey] = metadata;

    // Resolve all pending promises for this pubkey
    const resolvers = this.pendingRequests.get(pubkey) || [];
    while (resolvers.length) {
      const resolve = resolvers.pop();
      resolve?.(metadata);
    }
    this.pendingRequests.delete(pubkey);
  }
}
