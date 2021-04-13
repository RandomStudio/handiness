<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	import {
		hasExperienceStarted,
		hasDetectedFirstHand,
		hasIntroTransitionEnded,
		isLoaderFlow,
		loadedFilesCount,
	} from '../stores';

	export let handleStartVideo;

	let isWebGL2Supported;
	let hasLoadingError = false;

	let handImage;
	let hasHandImageLoaded = false;
	let canStartVideo = true;

	$: handImage,
		(() => {
			if (handImage) {
				handImage.onload = () => {
					hasHandImageLoaded = true;
				};
			}
		})();

	hasDetectedFirstHand.subscribe((value) => {
		if (value && !$hasExperienceStarted) {
			// setTimeout(() => {
			hasIntroTransitionEnded.set(true);
			isLoaderFlow.set(false);
			hasExperienceStarted.set(true);
			// }, 300);
		}
	});

	onMount(() => {
		isWebGL2Supported = !!document.createElement('canvas').getContext('webgl2');
	});

	const startVideo = async () => {
		isLoaderFlow.set(true);
		canStartVideo = await handleStartVideo();
	};
</script>

{#if !$hasExperienceStarted}
	<div class="container" out:fade>
		<section>
			{#if !$isLoaderFlow}
				<div out:fade={{ duration: 300 }} class="container-intro">
					<h1>Second Hand</h1>
					<p>
						{#if isWebGL2Supported}
							We'll need camera access for this.
						{/if}
					</p>

					{#if !isWebGL2Supported}
						<p class="unsupported">
							Sorry your browser does not support WebGL2 Please try again with Firefox/Chrome desktop or Android
						</p>
					{:else}
						<button on:click={startVideo}>Start Experience!</button>
					{/if}
				</div>
			{:else}
				<div transition:fade={{ delay: 100 }} class="container-cta-loader">
					{#if $loadedFilesCount !== 7 && canStartVideo}
						<p out:fade class="text-offset">
							Loading...
							<br />
							{$loadedFilesCount}/7
						</p>
					{:else if hasLoadingError || !canStartVideo}
						<p transition:fade class="text-offset">
							Something seems to have went wrong during initialization...<br />Please refresh the page
						</p>
					{:else}
						<div transition:fade class="container-cta">
							<picture class:hasHandImageLoaded>
								<source srcset="/high-five.webp" type="image/webp" />
								<source srcset="/high-five.png" type="image/png" />
								<img
									src="/high-five.png"
									alt="Illustration of two hands in the motion of a high five"
									bind:this={handImage}
								/>
							</picture>
							<p>Raise your hand in front of the webcam to get started</p>
						</div>
					{/if}
				</div>
			{/if}

			<footer>
				<p>
					We respect your data <br />
					None of it gets recorded.
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
		width: 100%;
		color: var(--color-white);
	}

	footer {
		margin: auto 0 12px;
		font-size: var(--font-xsmall);

		@media all and (min-width: 480px) {
			font-size: var(--font-small);
		}
	}

	picture {
		opacity: 0;
		transition: opacity 300ms linear;

		&.hasHandImageLoaded {
			opacity: 1;
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
			margin-bottom: 3.2rem;
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
		}
	}

	.container-cta-loader {
		display: flex;
		flex-flow: column nowrap;
		align-items: center;
		padding: 5.4rem 12px 0;
		color: var(--color-white);
		height: 100%;
		width: 100%;

		@media all and (min-width: 480px) {
			padding: 18vh 24px 0;

			& > * {
				position: absolute;
			}
		}

		.text-offset {
			padding: 7.8rem 0 0;

			@media all and (min-width: 480px) {
				padding: 25vh 0 0;
			}
		}
	}

	.container-cta {
		max-height: 50vh;
		height: 100%;
		padding: 12px;

		@media all and (min-width: 480px) {
			max-height: 35vh;
			padding: 24px;
		}

		img,
		source {
			height: 100%;
			width: 100%;
			margin-bottom: 2rem;
			object-fit: contain;
		}
	}

	.unsupported {
		max-width: 36rem;
		margin-top: 1em;
	}
</style>
