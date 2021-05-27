<script>
	import { fade } from 'svelte/transition';
</script>

<div transition:fade={{ duration: 150 }}>
	<p>Oops! We've lost your hand.</p>
</div>

<style lang="scss">
	div {
		position: absolute;
		display: flex;
		width: 100%;
		height: 100%;
		justify-content: center;
		align-items: center;

		&::before {
			content: "";
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			box-shadow: inset 0 0 20rem 0 rgba(255, 255, 255, 0.5);
			background-color: rgba(0, 0, 0, 0.85);
			filter: blur(32px);
		}

		@supports (backdrop-filter: none) {
			backdrop-filter: blur(32px);

			&::before {
				display: none;
			}
		}
	}

	p {
		position: absolute;
		font-size: var(--font-normal);
		color: var(--color-white);
		text-align: center;

		@media all and (min-width: 480px) {
			font-size: var(--font-medium);
		}
	}
</style>
