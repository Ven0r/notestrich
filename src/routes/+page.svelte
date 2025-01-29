<script lang="ts">
	import { onMount } from 'svelte';
	import FeedItem from '../components/FeedItem.svelte';
	import { FeedManager } from '../utils/FeedManager';
	import { NostrMetadata } from '../utils/NostrMetaData';
	import { NostrRelay } from '../utils/NostrRelay';

	let isLoggedIn = false;
	let publicKey: string | null = null;
	let profileLoading = true;

	// Use metadata cache directly
	let userMetadata: { name: string; picture: string } | null = null;

	let feed = [];
	const relayUrl = 'wss://nostr.land/';

	let nostrRelay: NostrRelay;
	let metadataService: NostrMetadata;
	let feedManager: FeedManager;

	function handleEvent(event: any) {
		if (event.kind === 0) {
			const content = JSON.parse(event.content || '{}');
			const metadata = {
				name: content.name || 'Anonymous',
				picture: content.picture || '/default-profile.jpg'
			};

			metadataService.updateMetadata(event.pubkey, metadata);

			// Update local state if it's the current user
			if (event.pubkey === publicKey) {
				userMetadata = metadata;
			}
		} else if (event.kind === 1) {
			feedManager.addNote(event);
			feed = feedManager.getFeed();
		}
	}

	const loginWithNostr = async () => {
		if (!window.nostr) {
			alert('Nostr browser extension not found!');
			return;
		}

		try {
			publicKey = await window.nostr.getPublicKey();
			isLoggedIn = true;
			profileLoading = true;

			// Initialize services
			nostrRelay = new NostrRelay(relayUrl, handleEvent);
			metadataService = new NostrMetadata(nostrRelay);
			feedManager = new FeedManager(metadataService);

			// Connect to relay
			nostrRelay.connect();
			await nostrRelay.waitForConnection();

			// Get user metadata (waits for the metadata to arrive)
			userMetadata = await metadataService.getMetadata(publicKey);

			// Set up feed subscriptions
			nostrRelay.subscribe('feed', {
				kinds: [1],
				since: Math.floor(Date.now() / 1000) - 3600
			});
		} catch (error) {
			console.error('Login failed:', error);
		} finally {
			profileLoading = false;
		}
	};

	onMount(() => {
		return () => nostrRelay?.close();
	});
</script>

<!-- Template Markup -->
<div class="layout">
	{#if !isLoggedIn}
		<div class="text-center w-full">
			<h1 class="text-9xl text-purple-600" style="font-family: 'Ostrich Sans', sans-serif;">
				Notestrich
			</h1>
			<button
				class="mt-5 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
				on:click={loginWithNostr}
			>
				Login with Nostr
			</button>
		</div>
	{:else}
		<div class="left-pane">
			<h1 class="feed-title">N</h1>

			{#if profileLoading}
				<div class="profile-loading">
					<div class="loading-spinner"></div>
					<p>Loading profile...</p>
				</div>
			{:else}
				<div class="profile-section">
					<img
						src={userMetadata?.picture || '/default-profile.jpg'}
						alt={userMetadata?.name || 'User profile picture'}
						class="profile-image"
					/>
					<div class="profile-info">
						<p class="profile-name">{userMetadata?.name || 'Anonymous'}</p>
						<p class="profile-key">@{publicKey?.substring(0, 12)}...</p>
					</div>
				</div>
			{/if}
		</div>

		<div class="middle-pane">
			<h2 class="text-3xl text-purple-600 mb-4" style="font-family: 'Ostrich Sans', sans-serif;">
				Feed
			</h2>

			{#if feed.length > 0}
				<div class="feed-container">
					{#each feed as item}
						<div class="feed-item">
							<FeedItem
								name={item.name}
								picture={item.picture}
								content={item.content}
								createdAt={item.createdAt}
							/>
						</div>
					{/each}
				</div>
			{:else}
				<div class="empty-feed">
					<svg class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p class="empty-text">No notes found in the last hour</p>
				</div>
			{/if}
		</div>

		<div class="right-pane">
			<div class="stats-card">
				<h3 class="stats-title">Network Stats</h3>
				<div class="stat-item">
					<span class="stat-label">Relay:</span>
					<span class="stat-value">{relayUrl.replace('wss://', '')}</span>
				</div>
				<div class="stat-item">
					<span class="stat-label">Notes Loaded:</span>
					<span class="stat-value">{feed.length}</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.layout {
		display: flex;
		height: 100vh;
		background-color: #1e293b;
		color: white;
	}

	/* Left Pane */
	.left-pane {
		width: 15%;
		padding: 1.5rem;
		background-color: #111827;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.profile-loading {
		text-align: center;
		margin-top: 2rem;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: #8b5cf6;
		animation: spin 1s ease-in-out infinite;
		margin: 0 auto;
	}

	.profile-section {
		text-align: center;
		margin-top: 1rem;
	}

	.profile-image {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid #8b5cf6;
	}

	.profile-info {
		margin-top: 1rem;
	}

	.profile-name {
		font-weight: 600;
		font-size: 1.1rem;
	}

	.profile-key {
		font-size: 0.8rem;
		color: #94a3b8;
		margin-top: 0.25rem;
	}

	/* Middle Pane */
	.middle-pane {
		flex-grow: 1;
		padding: 2rem;
		overflow-y: auto;
		background-color: #1e293b;
	}

	.feed-container {
		max-width: 600px;
		margin: 0 auto;
	}

	.feed-item {
		margin-bottom: 1.5rem;
		background: #0f172a;
		border-radius: 0.5rem;
		padding: 1.25rem;
		transition: transform 0.2s;
	}

	.feed-item:hover {
		transform: translateY(-2px);
	}

	.empty-feed {
		text-align: center;
		margin-top: 4rem;
		color: #64748b;
	}

	.empty-icon {
		width: 60px;
		height: 60px;
		margin-bottom: 1rem;
	}

	.empty-text {
		font-size: 1.1rem;
	}

	/* Right Pane */
	.right-pane {
		width: 20%;
		padding: 1.5rem;
		background-color: #111827;
	}

	.stats-card {
		background: #0f172a;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.stats-title {
		font-size: 1.1rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #8b5cf6;
	}

	.stat-item {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.75rem;
		font-size: 0.9rem;
	}

	.stat-label {
		color: #94a3b8;
	}

	.stat-value {
		color: #e2e8f0;
		font-weight: 500;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
