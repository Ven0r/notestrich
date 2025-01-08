<script lang="ts">
	export let name: string;
	export let picture: string;
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
	<div class="user-info">
		<img src={picture} alt="{name}'s picture" class="profile-picture" />
		<span class="name">{name}</span>
		<span class="timestamp">({timeAgo(createdAt)})</span>
	</div>
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
</style>
