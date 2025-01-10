<script lang="ts">
	import { onMount } from 'svelte';
	import FeedItem from '../components/FeedItem.svelte';
	import { FeedManager } from '../utils/FeedManager';
	import { NostrMetadata } from '../utils/NostrMetaData';
	import { NostrRelay } from '../utils/NostrRelay';

	let isLoggedIn = false;
	let publicKey: string | null = null;
	let feed = [];
	const relayUrl = 'wss://eden.nostr.land/';

	let nostrRelay: NostrRelay;
	let metadataService: NostrMetadata;
	let feedManager: FeedManager;

	const loginWithNostr = async () => {
		if (!window.nostr) {
			alert('Nostr browser extension not found!');
			return;
		}

		try {
			publicKey = await window.nostr.getPublicKey();
			isLoggedIn = true;
			console.log('Logged in with public key:', publicKey);

			// Initialize services
			nostrRelay = new NostrRelay(relayUrl, handleEvent);
			metadataService = new NostrMetadata(nostrRelay);
			feedManager = new FeedManager(metadataService);

			nostrRelay.connect();
			await nostrRelay.waitForConnection(); // Wait for WebSocket to connect
			nostrRelay.subscribe('feed', { kinds: [1], since: Math.floor(Date.now() / 1000) - 3600 });
		} catch (error) {
			console.error('NIP-07 Login failed:', error);
		}
	};

	const handleEvent = (event: any) => {
		if (event.kind === 0) {
			metadataService.updateMetadata(event.pubkey, {
				name: JSON.parse(event.content).name || 'Unknown',
				picture: JSON.parse(event.content).picture || '/default-profile.jpg'
			});
			feedManager.processPendingNotes(event.pubkey);
		} else if (event.kind === 1) {
			feedManager.addNote(event);
		}

		feed = feedManager.getFeed();
	};

	onMount(() => {
		return () => {
			nostrRelay?.close();
		};
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-slate-800 text-white">
	{#if !isLoggedIn}
		<div class="text-center">
			<h1 class="text-9xl text-purple-600" style="font-family: 'Ostrich Sans', sans-serif;">
				Notestrich
			</h1>
			<button
				class="mt-5 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
				on:click={loginWithNostr}
			>
				Login with Nostr
			</button>
		</div>
	{:else}
		<div class="text-center w-full max-w-screen-lg px-4">
			<h1 class="text-5xl text-purple-600" style="font-family: 'Ostrich Sans', sans-serif;">N</h1>
			<p class="text-xl mt-4">Logged in as: {publicKey}</p>
			<div class="mt-8">
				<h2 class="text-3xl">Feed</h2>
				{#if feed.length > 0}
					{#each feed as item}
						<FeedItem
							name={item.name}
							picture={item.picture}
							content={item.content}
							createdAt={item.createdAt}
						/>
					{/each}
				{:else}
					<p class="text-gray-400">No events yet...</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
