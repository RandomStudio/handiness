<script>
	import { fade } from 'svelte/transition';
</script>

<div transition:fade={{ duration: 150 }}>
	<p>OOOPS! We've lost your hand</p>
</div>

<style>
	div {
		position: absolute;
		display: flex;
		width: 100%;
		height: 100%;
		justify-content: center;
		align-items: center;

		backdrop-filter: blur(32px);
	}

	p {
		font-size: var(--font-medium);
		color: var(--color-white);
	}
</style>
