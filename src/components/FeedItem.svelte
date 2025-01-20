<script lang="ts">
	import { onMount } from 'svelte';
	export let name: string;
	export let picture: string;
	export let content: string;
	export let createdAt: number;

	// Extract the first image URL from the content
	let imageUrl: string | null = null;
	let displayContent: string = ''; // local variable for the final text
	let youtubeVideoId: string | null = null;

	const youtubeRegex =
		/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.)?youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/;

	onMount(() => {
		// Copy 'content' so we don't mutate the exported prop.
		displayContent = content;

		const ytMatch = displayContent.match(youtubeRegex);
		if (ytMatch) {
			youtubeVideoId = ytMatch[1];
			// Optionally remove the link from the displayed text:
			displayContent = displayContent.replace(youtubeRegex, '').trim();
		}

		// Extract the first image URL from the content using regex
		const urlMatch = displayContent.match(
			/(https?:\/\/[a-zA-Z0-9$\-_.+!*'(),%\/:@&=]+(?:\.(?:png|jpg|jpeg|gif|webp|svg)))/i
		);

		if (urlMatch) {
			imageUrl = urlMatch[0];
			displayContent = displayContent.replace(imageUrl, '').trim();
		}
	});

	// "Time ago" helper function
	const timeAgo = (timestamp: number): string => {
		if (!timestamp || isNaN(timestamp)) {
			return 'Unknown time';
		}

		const now = Math.floor(Date.now() / 1000);
		const diff = now - timestamp;

		if (diff < 60) {
			return `${diff} second${diff === 1 ? '' : 's'} ago`;
		} else if (diff < 3600) {
			const minutes = Math.floor(diff / 60);
			return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
		} else if (diff < 86400) {
			const hours = Math.floor(diff / 3600);
			return `${hours} hour${hours === 1 ? '' : 's'} ago`;
		} else if (diff < 604800) {
			const days = Math.floor(diff / 86400);
			return `${days} day${days === 1 ? '' : 's'} ago`;
		} else {
			const weeks = Math.floor(diff / 604800);
			return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
		}
	};
</script>

<div class="feed-item feed-item-wrapper">
	<div class="user-info">
		<img src={picture} alt="{name}'s picture" class="profile-picture" />
		<span class="name">{name}</span>
		<span class="timestamp">({timeAgo(createdAt)})</span>
	</div>
	<p class="content">{displayContent}</p>

	{#if imageUrl}
		<div class="image-container">
			<img src={imageUrl} alt="Attached to the note" class="attached-image" loading="lazy" />
		</div>
	{/if}

	{#if youtubeVideoId}
		<div class="youtube-container">
			<iframe
				width="560"
				height="315"
				src="https://www.youtube.com/embed/{youtubeVideoId}"
				frameborder="0"
				title="Youtube Video"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
			></iframe>
		</div>
	{/if}
</div>

<style>
	.feed-item {
		border: 1px solid #4a5568;
		padding: 20px;
		margin-top: 10px;
		margin-bottom: 10px;
		border-radius: 5px;
		background: #2d3748;
	}
	.user-info {
		display: flex;
		align-items: center;
		margin-bottom: 8px;
	}
	.profile-picture {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		margin-right: 10px;
	}
	.name {
		font-weight: bold;
		margin-right: 8px;
	}
	.timestamp {
		color: #a0aec0;
		font-size: 0.875rem;
	}
	.image-container {
		margin-top: 10px;
		text-align: center;
	}
	.attached-image {
		width: 100%;
		max-height: 300px;
		object-fit: cover;
		border-radius: 5px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}
	.youtube-container {
		margin-top: 10px;
		position: relative;
		padding-bottom: 56.25%; /* 16:9 ratio */
		height: 0;
	}

	.youtube-container iframe {
		position: absolute;
		width: 100%;
		height: 100%;
		left: 0;
		top: 0;
	}
</style>
