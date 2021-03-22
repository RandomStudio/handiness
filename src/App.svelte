<script>
	import { onMount } from "svelte";

	import initMediaHands from './tracking/initMediaHands';
	import initCamera from './tracking/initCamera';

	import { buildVPTree } from './utils';
	
	import Intro from "./components/Intro.svelte";
	import Experience from "./components/Experience.svelte";

	let videoEl = document.createElement('video');
	let mediaHands;
	let dataset;

	let hasExperienceStarted = false;

	const startVideo = () => {
		videoEl.play();

		hasExperienceStarted = true;
	}

	onMount(async () => {
		// const data = await fetch('/output.json');
		const data = await fetch('/output-train.json');
		// const data = await fetch('/output_full.json');
		// const data = await fetch('/output_index.json');
		// const data = await fetch('/output_tip.json');
		dataset = await data.json();

		buildVPTree(dataset.map(d => d.landmarks));
		

		initCamera(videoEl).then((res) => {
			mediaHands = initMediaHands();
		});
	});
</script>

<main>
	<!-- svelte-ignore a11y-media-has-caption -->
	{#if !mediaHands || !hasExperienceStarted}
		<Intro handleStartVideo={startVideo} />
	{:else if hasExperienceStarted}
		<Experience videoEl={videoEl} mediaHands={mediaHands} DATASET={dataset} />
	{/if}
	<!-- <div>
		<img bind:this={imageEl} src={activeImage} />

		<canvas bind:this={canvasEl} />
	</div> -->

	<!-- svelte-ignore a11y-media-has-caption -->
	<!-- <video bind:this={videoEl}></video> -->
</main>

<style>
	main {
		position: relative;
		width: 100%;
		height: 100%;
		margin: 0;
		background: #000;
		/* background: rgb(163, 163, 163); */
	}
</style>