<script lang="ts">
	import { onMount } from 'svelte';
	import FeedItem from '../components/FeedItem.svelte';
	let isLoggedIn = false;
	let publicKey: string | null = null;
	let feed = [];
	const relayUrl = 'wss://eden.nostr.land/';
	let ws: WebSocket;

	const loginWithNostr = async () => {
		if (window.nostr) {
			try {
				publicKey = await window.nostr.getPublicKey();
				isLoggedIn = true;
				console.log('Logged in with public key:', publicKey);

				connectToRelay();
			} catch (error) {
				console.error('NIP-07 Login failed:', error);
			}
		} else {
			alert('Nostr browser extension not found!');
		}
	};

	const connectToRelay = () => {
		ws = new WebSocket(relayUrl);

		ws.onopen = () => {
			console.log(`Connected to relay: ${relayUrl}`);
			const subscription = [
				'REQ',
				'feed-subscription',
				{ kinds: [1], since: Math.floor(Date.now() / 1000) - 3600 }
			];
			ws.send(JSON.stringify(subscription));
		};

		ws.onmessage = (event) => {
			const message = JSON.parse(event.data);

			if (message[0] === 'EVENT') {
				const event = message[2];
				console.log('Event:', message[2]);
				feed = [
					{ pubkey: event.pubkey, content: event.content, createdAt: event.created_at },
					...feed
				];
				// Ensure the feed is sorted by `createdAt` in descending order (newest first)
				feed.sort((a, b) => b.createdAt - a.createdAt);
			}
		};

		ws.onclose = () => {
			console.log('Relay connection closed');
		};

		ws.onerror = (error) => {
			console.error('WebSocket error:', error);
		};
	};

	onMount(() => {
		return () => {
			if (ws) ws.close();
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
		<div class="text-center">
			<h1 class="text-5xl text-purple-600">Welcome to Notestrich</h1>
			<p class="text-xl mt-4">Logged in as: {publicKey}</p>
			<div class="mt-8">
				<h2 class="text-3xl">Feed</h2>
				{#if feed.length > 0}
					{#each feed as item}
						<FeedItem pubkey={item.pubkey} content={item.content} createdAt={item.createdAt} />
					{/each}
				{:else}
					<p class="text-gray-400">No events yet...</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
