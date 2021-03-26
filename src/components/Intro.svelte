<script>
	import { fade, fly } from 'svelte/transition';
	import { tweened } from 'svelte/motion';
	import { cubicOut, elasticOut, sineIn, sineInOut } from 'svelte/easing';

	import { hasDetectedFirstHand, hasIntroTransitionEnded } from '../stores';

	export let handleStartVideo;

	let hasExperienceStarted = false;
	let shouldHideText = false;

	let moveContainerEl;
	let moveContainerBbox;

	let promise;

	hasDetectedFirstHand.subscribe((value) => {
		if (value && !hasExperienceStarted) {
			moveToCornerProgress.set(1).then(() => {
				setTimeout(() => {
					hasIntroTransitionEnded.set(true);
					hasExperienceStarted = true;
				}, 500);
			});
		}
	});

	const startVideo = () => {
		promise = handleStartVideo();

		slideProgress.set(1).then(() => {
			const bbox = moveContainerEl.getBoundingClientRect();

			const { innerWidth, innerHeight } = window;
			const { right, bottom, width } = bbox;

			const xDiff = innerWidth - right - 16;
			const yDiff = innerHeight - bottom - 16;

			moveContainerBbox = { left: xDiff, top: yDiff, xOffset: width / 2 };

			shouldHideText = true;

		});
	};

	const slideProgress = tweened(0, {
		duration: 400,
		easing: cubicOut,
	});

	const moveToCornerProgress = tweened(0, {
		duration: 700,
		easing: sineInOut,
	});
	let moveToCornerProgress_value = 0;

	moveToCornerProgress.subscribe((val) => {
		moveToCornerProgress_value = val;
	});
</script>

{#if !hasExperienceStarted}
	<section transition:fade>
		<h1>Handy Image Search</h1>

		<div
			class="preview-container"
			style={`--slideProgress: ${$slideProgress}`}
		>
			<div />
			<div
				bind:this={moveContainerEl}
				style={moveContainerBbox &&
					`
						transform: translate(${moveContainerBbox.left * moveToCornerProgress_value - moveContainerBbox.xOffset}px,
						${moveContainerBbox.top * moveToCornerProgress_value}px)
						scale(${1 - 0.5 * moveToCornerProgress_value});
						transform-origin: bottom right;
				`}
			/>
		</div>


		{#if !shouldHideText}
			<div transition:fade class="preview-bar">
				<span />
				<p>Similarity: 97%</p>
			</div>

			<p transition:fade class="description">
				Image searching based on your HAND!
				<br />
				We'll need camera access for this though
			</p>

			<button transition:fade on:click={startVideo}>Let's do this!</button>

		{:else}
			<div transition:fade={{ delay: 600 }}>
				{#await promise}
					<p>Loading</p>
				{:then result}
					<p>
						Let's do this! <br/>
						HANDS UP 🙌🏻
					</p>
				{:catch error}
					<p>ERROR</p>
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
{/if}

<style lang="scss">
	section {
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

		padding: 3.2rem 12px 0;

		@media all and (min-width: 480px) {
			padding: 5% 24px 0;
		}
	}

	h1 {
		margin-bottom: 2rem;
	}

	footer {
		margin: auto 0 12px;
		font-size: var(--font-xsmall);

		@media all and (min-width: 480px) {
			font-size: var(--font-small);
		}
	}

	.description {
		margin-bottom: 1.6rem;
	}

	.preview-container {
		--slideProgress: 0;

		position: relative;
		display: flex;
		// flex-wrap: wrap;
		justify-content: center;
		min-width: 20rem;
		width: 100%;
		max-width: 40rem;
		margin-bottom: 0.8rem;

		div {
			min-width: 10rem;
			max-width: 50%;
			width: 100%;
			justify-content: center;
			padding-bottom: 50%;
			background-position: center;

			&:nth-of-type(1) {
				background-image: url('/Tracking result.png');
				opacity: calc(1 - var(--slideProgress));
			}

			&:nth-of-type(2) {
				background-image: url('/Tracking preview.png');
				transform: translateX(calc(var(--slideProgress) * -50%));
			}
		}
	}

	.preview-bar {
		position: relative;
		min-width: 8rem;
		width: 100%;
		max-width: 14rem;
		height: 24px;
		margin-bottom: 1.6rem;
		background: var(--color-gray);
		color: var(--color-white);

		box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);

		span {
			display: block;
			width: 100%;
			height: 100%;
			background: var(--color-black);
			transform: scaleX(0.97);
			transform-origin: left;
		}

		p {
			font-size: var(--font-small);
			position: absolute;
			top: 0;
			left: 0.4em;
		}
	}

	button {
		border: 2px solid var(--color-black);
		background: none;
		font-weight: bold;
		min-width: 8rem;
		max-width: 14rem;
		width: 100%;
	}
</style>
