<script lang="ts">
	import { onMount } from 'svelte';
	import FeedItem from '../components/FeedItem.svelte';

	let isLoggedIn = false;
	let publicKey: string | null = null;
	let feed = [];
	let pendingNotes = [];
	let metadata: Record<string, { name: string; picture: string }> = {}; // Cache for user metadata
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

	const fetchMetadata = (pubkey: string) => {
		if (metadata[pubkey]) return; // Skip if metadata is already cached

		console.log(`Fetching metadata for pubkey: ${pubkey}`);
		const subscription = [
			'REQ',
			'meta', // Short subscription ID
			{
				kinds: [0], // Metadata events
				authors: [pubkey] // Filter by the public key
			}
		];
		ws.send(JSON.stringify(subscription));
	};

	const connectToRelay = () => {
		ws = new WebSocket(relayUrl);

		ws.onopen = () => {
			console.log(`Connected to relay: ${relayUrl}`);
			const subscription = [
				'REQ',
				'feed', // Short subscription ID
				{ kinds: [1], since: Math.floor(Date.now() / 1000) - 3600 }
			];
			ws.send(JSON.stringify(subscription));
		};

		ws.onmessage = (event) => {
			const message = JSON.parse(event.data);

			if (message[0] === 'EVENT') {
				const event = message[2];

				if (event.kind === 0) {
					// Metadata event
					const profile = JSON.parse(event.content);
					metadata[event.pubkey] = {
						name: profile.name || 'Unknown',
						picture: profile.picture || '/default-profile.jpg'
					};
					console.log(`Metadata updated for pubkey ${event.pubkey}:`, metadata[event.pubkey]);

					// Process pending notes for this pubkey
					pendingNotes = pendingNotes.filter((note) => {
						if (note.pubkey === event.pubkey) {
							feed = [
								{
									...note,
									name: metadata[event.pubkey].name,
									picture: metadata[event.pubkey].picture
								},
								...feed
							];
							return false; // Remove the note from pendingNotes
						}
						return true; // Keep it in the pendingNotes list
					});
				} else if (event.kind === 1) {
					// Note event
					if (metadata[event.pubkey]) {
						// If metadata already exists, add directly to feed
						feed = [
							{
								pubkey: event.pubkey,
								content: event.content,
								createdAt: event.created_at,
								name: metadata[event.pubkey].name,
								picture: metadata[event.pubkey].picture
							},
							...feed
						];
					} else {
						// If no metadata, add to pending notes and fetch metadata
						pendingNotes.push({
							pubkey: event.pubkey,
							content: event.content,
							createdAt: event.created_at
						});
						fetchMetadata(event.pubkey);
					}

					feed.sort((a, b) => b.createdAt - a.createdAt);
				}
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
	<div class="text-center w-full max-w-screen-lg px-4">
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
							<FeedItem
								name={metadata[item.pubkey]?.name || 'Unknown'}
								picture={metadata[item.pubkey]?.picture || '/default-profile.jpg'}
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
</div>
