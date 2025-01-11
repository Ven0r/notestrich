<script lang="ts">
	import { onMount } from 'svelte';
	import FeedItem from '../components/FeedItem.svelte';
	import { FeedManager } from '../utils/FeedManager';
	import { NostrMetadata } from '../utils/NostrMetaData';
	import { NostrRelay } from '../utils/NostrRelay';

	let isLoggedIn = false;
	let publicKey: string | null = null;
	let displayName: string = 'Unknown'; // Default to "Unknown"
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

			nostrRelay = new NostrRelay(relayUrl, handleEvent);
			metadataService = new NostrMetadata(nostrRelay);
			feedManager = new FeedManager(metadataService);

			nostrRelay.connect();
			await nostrRelay.waitForConnection();

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

<div class="layout">
	{#if !isLoggedIn}
		<div class="text-center w-full">
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
		<div class="left-pane">
			<h1 class="feed-title">N</h1>
			<p>Logged in as: {publicKey}</p>
		</div>
		<div class="middle-pane">
			<h2 class="text-3xl text-purple-600" style="font-family: 'Ostrich Sans', sans-serif;">
				Feed
			</h2>
			{#if feed.length > 0}
				{#each feed as item}
					<FeedItem
						class="text-6xl"
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
		<div class="right-pane"></div>
	{/if}
</div>

<style>
	.layout {
		display: flex;
		height: 100vh;
		background-color: #1e293b; /* Slate 800 */
		color: white;
	}
	.left-pane {
		width: 15%;
		padding: 1rem;
		text-align: center;
		background-color: #111827; /* Slightly darker */
	}
	.middle-pane {
		flex-grow: 1;
		padding: 1rem;
		overflow-y: auto;
	}
	.right-pane {
		width: 20%;
		padding: 1rem;
		background-color: #111827; /* Slightly darker */
	}
	.feed-title {
		font-family: 'Ostrich Sans', sans-serif;
		font-size: 3rem;
		color: #8b5cf6; /* Purple 600 */
		margin-bottom: 1rem;
	}
</style>
