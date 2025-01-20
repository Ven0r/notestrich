// src/utils/NostrMetadata.ts
export class NostrMetadata {
  private metadataCache: Record<string, { name: string; picture: string }> = {};
  private relay: NostrRelay;

  constructor(relay: NostrRelay) {
    this.relay = relay;
  }

  fetchMetadata(pubkey: string) {
    if (this.metadataCache[pubkey]) {
      console.log(`Metadata already cached for pubkey: ${pubkey}`);
      return this.metadataCache[pubkey];
    }

    //console.log(`Fetching metadata for pubkey: ${pubkey}`);
    this.relay.subscribe(`metadata-${pubkey}`, {
      kinds: [0],
      authors: [pubkey],
    });
  }

  updateMetadata(pubkey: string, metadata: { name: string; picture: string }) {
    this.metadataCache[pubkey] = metadata;
  }

  getMetadata(pubkey: string) {
    return this.metadataCache[pubkey];
  }
}

