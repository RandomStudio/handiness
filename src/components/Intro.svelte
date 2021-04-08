<script>
	import { fade } from 'svelte/transition';

	import { hasDetectedFirstHand, hasIntroTransitionEnded, isLoaderFlow } from '../stores';

	export let handleStartVideo;

	let hasExperienceStarted = false;
	let videoPromise;

	hasDetectedFirstHand.subscribe((value) => {
		if (value && !hasExperienceStarted) {
			setTimeout(() => {
				hasIntroTransitionEnded.set(true);
				isLoaderFlow.set(false);
				hasExperienceStarted = true;
			}, 500);
		}
	});

	const startVideo = () => {
		videoPromise = handleStartVideo();
		isLoaderFlow.set(true);
	};
</script>

{#if !hasExperienceStarted}
	<div class="container" out:fade>
		{#if !$isLoaderFlow}
			<div out:fade class="background" />
		{/if}
		<div class="backdrop" />

		<section>
			{#if !$isLoaderFlow}
				<div out:fade class="container-intro">
					<h1>Mirror Hand</h1>
					<p class="description">
						Hand Gesture Image Discovery
						<br />
						We'll need camera access for this though
					</p>

					<button on:click={startVideo}>Let's do this!</button>
				</div>
			{:else}
				<div transition:fade class="container-cta-loader">
					{#await videoPromise}
						<p in:fade={{ delay: 400 }} out:fade={{ delay: 0 }} class="text-offset">Loading...</p>
					{:then result}
						<div in:fade={{ delay: 400 }} class="container-cta">
							<picture>
								<source srcset="high-five.webp" type="image/webp" />
								<source srcset="high-five.jpg" type="image/jpeg" />
								<img src="high-five.jpg" alt="Illustration of two hands in the motion of a high five" />
							</picture>
							<p>Raise Your Hand in Front of the Webcam to Get Started</p>
						</div>
					{:catch error}
						<p transition:fade class="text-offset">Something seems to have went wrong during initialization...</p>
					{/await}
				</div>
			{/if}

			<footer>
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
				// margin-bottom: 2rem;
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
		// picture {
		img,
		source {
			max-height: 50vh;
			margin-bottom: 2rem;

			@media all and (min-width: 480px) {
				max-height: 35vh;
			}
		}
		// }
	}
</style>
