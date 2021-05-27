<script>
	import initMediaHands from './tracking/initMediaHands';
	import initCamera from './tracking/initCamera';

	import { buildVPTree } from './utils/vptree';

	import { hasExperienceStarted, loadedFilesCount } from './stores';

	import Intro from './components/Intro.svelte';
	import ExperiencePixi from './components/ExperiencePixi.svelte';
	import About from './components/About.svelte';
	import Logo from './components/Logo.svelte';

	let videoEl;
	let mediaHands;
	let dataset;
	let datasetEasterEgg;

	let isAboutOpen = false;

	let imageHostURL = 'https://doppelhand.s3.eu-central-1.amazonaws.com/images';

	const startVideo = async () => {
		const res = await initCamera(videoEl);

		if (res?.success) {
			videoEl.play().then(async () => {
				mediaHands = initMediaHands();

				const handsData = '/output.json';
				const data = await fetch(handsData);
				dataset = await data.json();
				loadedFilesCount.increment();

				const easterEggData = await fetch('/easteregg.json');
				datasetEasterEgg = await easterEggData.json();
				loadedFilesCount.increment();

				buildVPTree(dataset.map((data) => data.landmarks));
			});

			return true;
		} else {
			return false;
		}
	};
</script>

<main>
	<button class="about" on:click={() => (isAboutOpen = !isAboutOpen)}>
		<span>
			{#if isAboutOpen}
				&times;
			{:else}
				?
			{/if}
		</span>
	</button>

	{#if isAboutOpen}
		<About />
	{/if}

	<ExperiencePixi {videoEl} {mediaHands} {dataset} {datasetEasterEgg} {imageHostURL} />

	{#if !mediaHands || !$hasExperienceStarted}
		<Intro handleStartVideo={startVideo} />
	{/if}

	<!-- svelte-ignore a11y-media-has-caption -->
	<video bind:this={videoEl} playsinline />

	<Logo />
</main>

<style lang="scss">
	main {
		position: relative;
		width: 100%;
		height: 100%;
		margin: 0;
		background: #9ac395;
	}

	video {
		display: none;
		visibility: hidden;
	}

	.about {
		position: absolute;
		top: 12px;
		right: 12px;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: transparent;
		height: 1.6rem;
		width: 1.6rem;
		border: 2px solid var(--color-white);
		border-radius: 2rem;
		font-size: var(--font-normal);
		font-weight: bolder;
		color: var(--color-white);
		z-index: 10;
		cursor: pointer;
		user-select: none;

		@media all and (min-width: 480px) {
			top: 24px;
			right: 24px;
			height: 2.4rem;
			width: 2.4rem;
			font-size: var(--font-medium);
		}
	}
</style>
