<script>
	import { onMount } from 'svelte';

	import initMediaHands from './tracking/initMediaHands';
	import initCamera from './tracking/initCamera';

	import { buildVPTree } from './utils/vptree';

	import Intro from './components/Intro.svelte';
	import Experience from './components/Experience.svelte';
	import ExperiencePixi from './components/ExperiencePixi.svelte';
	import About from './components/About.svelte';

	let videoEl = document.createElement('video');
	let mediaHands;
	let dataset;

	let isAboutOpen = false;
	let hasExperienceStarted = false;

	let imageHostURL = '/subwayhands-images/';
	// let imageHostURL = 'https://doppelhand.s3.eu-central-1.amazonaws.com/images';

	const startVideo = async () => {
		// const data = await fetch('/output.json');
		const data = await fetch('/subwayhands.json');
		dataset = await data.json();

		buildVPTree(dataset.map((data) => data.landmarks));

		await initCamera(videoEl);
		videoEl.play();
		mediaHands = initMediaHands();
	};
</script>

<main>
	{#if !isAboutOpen}
		<aside on:click={() => (isAboutOpen = !isAboutOpen)} class="about">ABOUT</aside>
	{:else}
		<aside on:click={() => (isAboutOpen = !isAboutOpen)} class="about">X</aside>
	{/if}

	{#if isAboutOpen}
		<About />
	{/if}

	{#if mediaHands}
		<ExperiencePixi {videoEl} {mediaHands} DATASET={dataset} imageHostURL={imageHostURL} />

		<!-- <Experience {videoEl} {mediaHands} DATASET={dataset} /> -->
	{/if}

	{#if !mediaHands || !hasExperienceStarted}
		<Intro handleStartVideo={startVideo} />
	{/if}
</main>

<style>
	main {
		position: relative;
		width: 100%;
		height: 100%;
		margin: 0;
		background: #bbf2b5;
	}
	.about {
		cursor: pointer;
		position: absolute;
		right: 25px;
		top: 25px;
		padding: 6px;
		border: 2px solid black;
		font-size: 20px;
		font-weight: bolder;
		border-radius: 20px;
		z-index: 10;
	}
</style>
