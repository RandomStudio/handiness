<script>
	import { onMount } from 'svelte';

	// import {}

	import initMediaHands from './tracking/initMediaHands';
	import initCamera from './tracking/initCamera';

	import { buildVPTree } from './utils';

	import Intro from './components/Intro.svelte';
	import Experience from './components/Experience.svelte';
	import About from './components/About.svelte';

	let videoEl = document.createElement('video');
	let mediaHands;
	let dataset;

	let hasClickedOnAbout = false;
	let hasExperienceStarted = false;
	// let hasDetectedFirstHand = false;

	let isExperienceReady = false;

	const startVideo = async () => {
		// const data = await fetch('/output.json');
		// const data = await fetch('/output-train.json');
		const data = await fetch('/output-coco-final.json');
		// const data = await fetch('/output-train-mpii.json');
		// const data = await fetch('/output_full.json');
		// const data = await fetch('/output_index.json');
		// const data = await fetch('/output_tip.json');
		dataset = await data.json();

		buildVPTree(dataset.map((data) => data.landmarks));

		await initCamera(videoEl);
		videoEl.play();
		mediaHands = initMediaHands();

		// hasExperienceStarted = true;
	};

	onMount(async () => {
		// // const data = await fetch('/output.json');
		// // const data = await fetch('/output-train.json');
		// const data = await fetch('/output-coco-final.json');
		// // const data = await fetch('/output-train-mpii.json');
		// // const data = await fetch('/output_full.json');
		// // const data = await fetch('/output_index.json');
		// // const data = await fetch('/output_tip.json');
		// dataset = await data.json();
		// buildVPTree(dataset.map((data) => data.landmarks));
	});
</script>

<main>
	{#if !hasClickedOnAbout}
		<aside on:click={() => (hasClickedOnAbout = !hasClickedOnAbout)} class="about">ABOUT</aside>
	{:else}
		<aside on:click={() => (hasClickedOnAbout = !hasClickedOnAbout)} class="about">X</aside>
	{/if}

	{#if mediaHands}
		<Experience {videoEl} {mediaHands} DATASET={dataset} />
	{/if}

	{#if !mediaHands || !hasExperienceStarted}
		<Intro handleStartVideo={startVideo} />
		<!-- {:else if hasExperienceStarted}
		<Experience videoEl={videoEl} mediaHands={mediaHands} DATASET={dataset} /> -->
	{/if}
	{#if hasClickedOnAbout}
		<About />
	{/if}
</main>

<style>
	main {
		position: relative;
		width: 100%;
		height: 100%;
		margin: 0;
		/* background: #000; */
		background: #bbf2b5;
		/* background: rgb(163, 163, 163); */
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
