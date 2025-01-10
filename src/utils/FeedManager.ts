// src/utils/FeedManager.ts
import { NostrMetadata } from './NostrMetaData';

export class FeedManager {
  private feed: any[] = [];
  private pendingNotes: any[] = [];
  private metadataService: NostrMetadata;

  constructor(metadataService: NostrMetadata) {
    this.metadataService = metadataService;
  }

  addNote(note: any) {
    // If we already have this event ID in our feed, skip adding
    if (this.feed.some((item) => item.id === note.id)) {
      console.log(`Duplicate event (id: ${note.id}) – skipping`);
      return;
    }

    const metadata = this.metadataService.getMetadata(note.pubkey);

    if (metadata) {
      const item = {
        ...note,
        name: metadata.name,
        picture: metadata.picture,
        createdAt: note.created_at, // map snake_case -> camelCase
      };

      // Insert at the front
      this.feed.unshift(item);
    } else {
      // We don't have metadata yet, push to pending
      this.pendingNotes.push(note);
      this.metadataService.fetchMetadata(note.pubkey);
    }
  }

  processPendingNotes(pubkey: string) {
    const metadata = this.metadataService.getMetadata(pubkey);

    this.pendingNotes = this.pendingNotes.filter((note) => {
      if (note.pubkey === pubkey) {
        // Avoid duplicates if note already got added
        if (this.feed.some((item) => item.id === note.id)) {
          console.log(`Duplicate pending event (id: ${note.id}) – skipping`);
          return false; // remove from pending
        }

        const item = {
          ...note,
          name: metadata?.name || 'Unknown',
          picture: metadata?.picture || '/default-profile.jpg',
          createdAt: note.created_at,
        };

        this.feed.unshift(item);
        return false; // remove this note from pending
      }
      return true; // keep any notes with a different pubkey
    });
  }

  // We sort the array just in time, so we only do it once when the UI requests it.
  // This can reduce overhead if we expect a large feed.
  getFeed() {
    // Return a *sorted copy* of `this.feed` in descending order by createdAt
    return this.feed.slice().sort((a, b) => b.createdAt - a.createdAt);
  }
}

