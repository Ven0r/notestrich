import { SimplePool } from 'nostr-tools';

export class NostrClient {
    private pool = new SimplePool();
    private relays: string[] = [];
    private worker: Worker | null = null;

    async connectToRelays(relayUrls: string[]): Promise<void> {
        this.relays = relayUrls;
        for (const url of relayUrls) {
            this.pool.ensureRelay(url);
            console.log(`Ensured relay connection: ${url}`);
        }
    }

    constructor() {
        if (typeof window !== 'undefined') {
            // Initialize the worker only in a browser environment
            this.worker = new Worker(new URL('./relayWorker.js', import.meta.url));
        }
    }

    connectToRelaysWithWorker(relayUrls: string[]): Promise<any[]> {
        if (!this.worker) {
            return Promise.reject(new Error("Web Worker is not available in this environment."));
        }

        return new Promise((resolve, reject) => {
            this.worker.onmessage = function(event) {
                resolve(event.data); // Return the results from the worker
            };
            this.worker.onerror = function(error) {
                reject(error);
            };
            this.worker.postMessage(relayUrls); // Send relay URLs to the worker
        });
    }

    async connectToRelays(relayUrls: string[]): Promise<void> {
        try {
            const results = await this.connectToRelaysWithWorker(relayUrls);
            results.forEach(result => console.log(result.status));
        } catch (error) {
            console.error("Error connecting to relays:", error);
        }
    }

    subscribeToEvents(filter: any, onEventCallback: (event: any) => void) {
        const subscription = this.pool.subscribeMany(this.relays, [filter], {
            onevent: (event) => {
                onEventCallback(event);
            },
            oneose: () => {
                console.log('End of stored events.');
                subscription.close();
            }
        });
    }

    async getPublicKey(): Promise<string> {
      if (typeof window !== 'undefined' && window.nostr) {
          return await window.nostr.getPublicKey();
      }
      throw new Error('Nostr extension is not available or running in a non-browser environment.');
    }

    async fetchMetadata(pubkeys: string[]): Promise<Map<string, any>> {
        const metadata = new Map<string, any>();
        this.subscribeToEvents({
            kinds: [0], // kind 0 for metadata
            authors: pubkeys,
        }, (event) => {
            metadata.set(event.pubkey, JSON.parse(event.content));
        });

        await new Promise(resolve => setTimeout(resolve, 2000)); // Adjust timeout as needed
        console.log('Fetched metadata:', metadata);
        return metadata;
    }

    async publishEvent(content: string): Promise<void> {
        const sk = await this.getPublicKey(); // Assume a method to retrieve the secret key
        const pk = sk;  // Adjust based on your key management

        const eventTemplate = {
            kind: 1,
            created_at: Math.floor(Date.now() / 1000),
            tags: [],
            content,
        };

        const signedEvent = finalizeEvent(eventTemplate, sk);

        try {
            await Promise.any(this.pool.publish(this.relays, signedEvent));
            console.log('Published to at least one relay!');
        } catch (err) {
            console.error('Failed to publish to any relay:', err);
        }
    }
}

export const nostrClient = new NostrClient();

