<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	import { hasDetectedFirstHand, hasIntroTransitionEnded, isLoaderFlow, loadedFilesCount } from '../stores';

	export let handleStartVideo;

	let hasExperienceStarted = false;
	let isWebGL2Supported;

	let hasLoadingError = false;

	hasDetectedFirstHand.subscribe((value) => {
		if (value && !hasExperienceStarted) {
			setTimeout(() => {
				hasIntroTransitionEnded.set(true);
				isLoaderFlow.set(false);
				hasExperienceStarted = true;
			}, 300);
		}
	});

	onMount(() => {
		isWebGL2Supported = !!document.createElement('canvas').getContext('webgl2');
	});

	const startVideo = () => {
		handleStartVideo();

		isLoaderFlow.set(true);
	};
</script>

{#if !hasExperienceStarted}
	<div class="container" out:fade>
		{#if !$isLoaderFlow}
			<div out:fade={{ duration: 300 }} class="background" />
		{/if}
		<div class="backdrop" />

		<section>
			{#if !$isLoaderFlow}
				<div out:fade={{ duration: 300 }} class="container-intro">
					<h1>Mirror Hand</h1>
					<p>
						Hand Gesture Image Discovery

						{#if isWebGL2Supported}
							<br />
							We'll need camera access for this though
						{/if}
					</p>

					{#if !isWebGL2Supported}
						<p class="unsupported">
							“Sorry your browser does not support WebGL2. If you are on a iPhone, then... I am so sorry, lets try to
							meet on Firefox/Chrome”
						</p>
					{:else}
						<button on:click={startVideo}>Let's do this!</button>
					{/if}
				</div>
			{:else}
				<div transition:fade={{ delay: 100 }} class="container-cta-loader">
					{#if $loadedFilesCount !== 7}
						<p out:fade class="text-offset">
							Loading...
							<br />
							{$loadedFilesCount}/7
						</p>
					{:else if hasLoadingError}
						<p transition:fade class="text-offset">
							Something seems to have went wrong during initialization...<br />Please refresh the page
						</p>
					{:else}
						<div transition:fade class="container-cta">
							<picture>
								<source srcset="/high-five.webp" type="image/webp" />
								<source srcset="/high-five.jpg" type="image/jpeg" />
								<img src="/high-five.jpg" alt="Illustration of two hands in the motion of a high five" />
							</picture>
							<p>Raise Your Hand in Front of the Webcam to Get Started</p>
						</div>
					{/if}
				</div>
			{/if}

			<footer style="color: {$isLoaderFlow ? 'var(--color-black)' : 'var(--color-white)'}">
				<p>
					We respect your data <br />
					meaning <br />
					None of it gets recorded, our lovely <u><i>anonymous</i></u> visitor
				</p>
			</footer>
		</section>
	</div>
{/if}

<style lang="scss">
	section {
		display: flex;
		flex-flow: column;
		align-items: center;
		height: 100%;
	}

	footer {
		margin: auto 0 12px;
		font-size: var(--font-xsmall);

		@media all and (min-width: 480px) {
			font-size: var(--font-small);
		}
	}

	.container {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);

		display: flex;
		flex-flow: column nowrap;
		align-items: center;
		height: 100%;
		width: 100%;
		text-align: center;
	}

	.backdrop {
		position: absolute;
		top: 0;
		left: 0;
		z-index: -1;
		height: 100%;
		width: 100%;
		background: var(--color-black);
		opacity: 0.25;
	}

	.background {
		position: absolute;
		top: 0;
		left: 0;
		z-index: -1;
		height: 100%;
		width: 100%;
		background-image: url('/background.jpg');
		background-size: cover;
		background-position: center;
	}

	.container-intro {
		color: var(--color-white);

		padding: 13.2rem 12px 0;

		@media all and (min-width: 480px) {
			padding: 30vh 24px 0;
		}

		h1 {
			margin-bottom: 0.4rem;
			font-size: var(--font-medium);

			@media all and (min-width: 480px) {
				font-size: var(--font-large);
			}
		}
		p {
			margin-bottom: 1.6rem;
		}

		button {
			border: 2px solid var(--color-white);
			border-radius: 2rem;
			background: none;
			font-weight: bold;
			min-width: 8rem;
			max-width: 14rem;
			width: 100%;
			color: var(--color-black);
			background: var(--color-white);

			&:focus {
				outline: none;
			}
		}
	}

	.container-cta-loader {
		display: flex;
		flex-flow: column nowrap;
		align-items: center;
		padding: 13.2rem 12px 0;
		color: var(--color-black);
		height: 100%;

		& > * {
			position: absolute;
		}

		@media all and (min-width: 480px) {
			padding: 18vh 24px 0;
		}

		.text-offset {
			@media all and (min-width: 480px) {
				padding: 25vh 0 0;
			}
		}
	}

	.container-cta {
		max-height: 50vh;
		height: 100%;

		@media all and (min-width: 480px) {
			max-height: 35vh;
		}

		img,
		source {
			height: 100%;
			margin-bottom: 2rem;
		}
	}

	.unsupported {
		max-width: 36rem;
		margin-top: 1em;
	}
</style>
