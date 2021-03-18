<script>
	import { getContext, onMount, onDestroy } from "svelte";

	import initMediaHands from './tracking/initMediaHands';
	import initCamera from './tracking/initCamera';

	import { buildVPTree, findMostSimilarMatch } from './utils';

	let videoEl;
	let canvasEl;
	let canvasContext;

	let mediaHands;

	let DATASET;

	let activeImage = '';

	const handleHandsResults = ({ multiHandLandmarks, multiHandedness, image }) => {
		if (multiHandedness?.length) {
			multiHandedness.forEach(({ label }, index) => {
				debugDrawOverlay({ multiHandLandmarks, multiHandedness, image });
				
				const landmarks = multiHandLandmarks[index];

				// const indexFingerLandmarks = [
				// 	multiHandLandmarks[index][7],
				// 	multiHandLandmarks[index][8], // tip
				// ];

				// Changes size depending on the json used
				// 
				// const indexFingerVecFloatArr = indexFingerLandmarks.reduce((accum, current) => [...accum, current.x, current.y], []);
				


				const indexTipAsOrigin = multiHandLandmarks[index][8]; 
				
				const mirrorLandmarks = landmarks.map(({ x, y }) => {
					// tip as origin -> need reference

					// origin - point = difference

					const differenceX = indexTipAsOrigin.x - x;
					const differenceY = indexTipAsOrigin.y - y;

					// get distance between origin and joint x

					const mirrorX = indexTipAsOrigin.x + differenceX;
					const mirrorY = indexTipAsOrigin.y + differenceY;

					return { x: mirrorX, y: mirrorY }
				});

				// Float 42
				const arr = landmarks.reduce((accum, current) => [...accum, current.x, current.y], []);
				const mirrorVecFloatArr = mirrorLandmarks.reduce((accum, current) => [...accum, current.x, current.y], []);


				// console.info(arr, mirrorVecFloatArr);
				// const classification = multiHandedness[index];
				// const isRightHand = classification.label === 'Right';
				// drawConnectors(
				// 	canvasContext, mirrorLandmarks, HAND_CONNECTIONS,
				// 	{color: isRightHand ? '#00FF00' : '#FF0000'});
					
				// drawLandmarks(canvasContext, mirrorLandmarks, {
				// 	color: isRightHand ? '#00FF00' : '#FF0000',
				// 	fillColor: isRightHand ? '#FF0000' : '#00FF00',
				// });

				const closestIndex = findMostSimilarMatch(arr);

				if (closestIndex) {
					activeImage = `/images-train-ann/${DATASET[closestIndex].file}`;
				}
			});
		} else {
			activeImage = '';
		}
	}

	const onResize = () => {
		canvasEl.width = videoEl.offsetWidth;
		canvasEl.height = videoEl.offsetHeight;
		canvasEl.style.width = '100%';
		canvasEl.style.height = '100%';
	}

	const debugDrawOverlay = (results) => {
		canvasContext.save();
		canvasContext.clearRect(0, 0, canvasEl.width, canvasEl.height);
		// canvasContext.drawImage(results.image, 0, 0, canvasEl.width, canvasEl.height);

		if (results.multiHandLandmarks && results.multiHandedness) {
			for (let index = 0; index < results.multiHandLandmarks.length; index++) {
				const classification = results.multiHandedness[index];
				const isRightHand = classification.label === 'Right';
				const landmarks = results.multiHandLandmarks[index];


				drawConnectors(
					canvasContext, landmarks, HAND_CONNECTIONS,
					{color: isRightHand ? '#00FF00' : '#FF0000'});
					
				drawLandmarks(canvasContext, landmarks, {
					color: isRightHand ? '#00FF00' : '#FF0000',
					fillColor: isRightHand ? '#FF0000' : '#00FF00',
				});
			}
		}

		canvasContext.restore();
	}

	const render = async () => {
		// Stuff to do here
		await mediaHands.send({ image: videoEl });

		// requestAnimationFrame(render);

		setTimeout(render, 1000 / 24);
		// setTimeout(render, 1000 / 12);
	}
	
	onDestroy(() => {
		window.removeEventListener('resize', onResize);
	});

	onMount(async () => {
		canvasEl.width = videoEl.offsetWidth;
		canvasEl.height = videoEl.offsetHeight;
		canvasEl.style.width = '100%';
		canvasEl.style.height = '100%';

		// const data = await fetch('/output.json');
		const data = await fetch('/output-train.json');
		// const data = await fetch('/output_full.json');
		// const data = await fetch('/output_index.json');
		// const data = await fetch('/output_tip.json');
		DATASET = await data.json();

		buildVPTree(DATASET.map(d => d.landmarks));
		
		canvasContext = canvasEl.getContext('2d');

		initCamera(videoEl).then((res) => {
			videoEl.play();

			mediaHands = initMediaHands();

			mediaHands.onResults(handleHandsResults);

			render();

			window.addEventListener('resize', onResize);
		});
	});
</script>

<main>
	<!-- svelte-ignore a11y-media-has-caption -->
	<div>
		<video bind:this={videoEl} />
		
		{#if activeImage}
			<!-- svelte-ignore a11y-missing-attribute -->
			<img src={activeImage} />
		{/if}

		<canvas bind:this={canvasEl} />
		
	</div>
</main>

<style>
	main {
		width: 100%;
		height: 100%;
		margin: 0;
	}

	div {
		position: relative;
		width: 100%;
		height: 100%;
	}
	
	video, img {
		transform: scaleX(-1);
	}

	video, canvas, img {
		position: absolute;
		/* left: 0; */
		/* bottom: 0; */
		width: 100%;
		height: 100%;
	}

	canvas {
		/* transform: scaleX(1); */
		height: initial;
	}
</style>