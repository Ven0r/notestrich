<script lang="ts">
	export let pubkey: string;
	export let content: string;
	export let createdAt: number;

	// Helper function to calculate "time ago"
	const timeAgo = (timestamp: number): string => {
		const now = Math.floor(Date.now() / 1000);
		const diff = now - timestamp;

		if (diff < 60) {
			return `${diff} seconds ago`;
		} else if (diff < 3600) {
			return `${Math.floor(diff / 60)} minutes ago`;
		} else if (diff < 86400) {
			return `${Math.floor(diff / 3600)} hours ago`;
		} else if (diff < 604800) {
			return `${Math.floor(diff / 86400)} days ago`;
		} else {
			return `${Math.floor(diff / 604800)} weeks ago`;
		}
	};
</script>

<div class="feed-item">
	<p>
		<span class="pubkey">{pubkey}</span>
		<span class="timestamp">({timeAgo(createdAt)})</span>
	</p>
	<p>{content}</p>
</div>

<style>
	.feed-item {
		border: 1px solid #4a5568;
		padding: 10px;
		margin-bottom: 10px;
		border-radius: 5px;
		background: #2d3748;
	}
	.pubkey {
		font-weight: bold;
	}
	.timestamp {
		color: #a0aec0;
		font-size: 0.875rem;
		margin-left: 8px;
	}
</style>
