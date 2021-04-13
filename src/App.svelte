<script>
	import initMediaHands from './tracking/initMediaHands';
	import initCamera from './tracking/initCamera';

	import { buildVPTree } from './utils/vptree';

	import { hasExperienceStarted, isLoaderFlow, loadedFilesCount } from './stores';

	import Intro from './components/Intro.svelte';
	import ExperiencePixi from './components/ExperiencePixi.svelte';
	import About from './components/About.svelte';
	import Logo from './components/Logo.svelte';

	let videoEl;
	let mediaHands;
	let dataset;
	let datasetEasterEgg;

	let isAboutOpen = false;

	const params = new URLSearchParams(window.location.search);
	const showSubwayCollection = params.get('subway');

	let imageHostURL = showSubwayCollection ? '/subwayhands-images' : '/images';

	const startVideo = async () => {
		const res = await initCamera(videoEl);

		if (res?.success) {
			videoEl.play().then(async () => {
				mediaHands = initMediaHands();

				const handsData = showSubwayCollection ? '/subwayhands.json' : '/output.json';
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
	<button
		class={`about ${$isLoaderFlow && !isAboutOpen ? '' : 'is-white'}`}
		on:click={() => (isAboutOpen = !isAboutOpen)}
	>
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

	{#if mediaHands}
		<ExperiencePixi {videoEl} {mediaHands} {dataset} {datasetEasterEgg} {imageHostURL} />
	{/if}

	{#if !mediaHands || !$hasExperienceStarted}
		<Intro handleStartVideo={startVideo} />
	{/if}

	<!-- svelte-ignore a11y-media-has-caption -->
	<video bind:this={videoEl} playsinline />

	<Logo shouldBeWhite={!$isLoaderFlow} />
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
		border: 2px solid var(--color-black);
		border-radius: 2rem;
		font-size: var(--font-normal);
		font-weight: bolder;
		color: var(--color-black);
		z-index: 10;
		cursor: pointer;
		user-select: none;

		&.is-white {
			border-color: var(--color-white);
			color: var(--color-white);
		}

		@media all and (min-width: 480px) {
			top: 24px;
			right: 24px;
			height: 2.4rem;
			width: 2.4rem;
			font-size: var(--font-medium);
		}
	}
</style>
