<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { nostrClient } from '../lib/nostrClient';

	let error = '';
	const dispatch = createEventDispatcher();

	async function handleLogin() {
		try {
			const pubkey = await nostrClient.getPublicKey();
			if (pubkey) {
				dispatch('login', { pubkey }); // Notify parent component that login was successful
			}
		} catch (err) {
			error = `Login failed: ${err.message}`;
			console.error(err);
		}
	}

	onMount(() => {
		if (typeof window !== 'undefined') {
			handleLogin();
		}
	});
</script>

<button on:click={handleLogin}>Login with Nostr</button>

{#if error}
	<p class="error">{error}</p>
{/if}

<style>
	.error {
		color: red;
		font-weight: bold;
	}
</style>
