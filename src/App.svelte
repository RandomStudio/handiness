<script>
	import { getContext, onMount, onDestroy } from "svelte";

	import initMediaHands from './tracking/initMediaHands';
	import initCamera from './tracking/initCamera';

	import { cosineDistanceMatching, buildVPTree, findMostSimilarMatch, findClosestPointDirectionIntersection } from './utils';
	import { getVec2DirectionEdge } from './vectorHelpers';

	let videoEl;
	let canvasEl;
	let canvasContext;

	let mediaHands;

	let DATASET;
	let customData;


	let activeImage = '';

	const handleHandsResults = ({ multiHandLandmarks, multiHandedness, image }) => {
		if (multiHandedness?.length) {
			multiHandedness.forEach(({ label }, index) => {
				debugDrawOverlay({ multiHandLandmarks, multiHandedness, image });
				
				const landmarks = multiHandLandmarks[index];

				const indexFingerLandmarks = [
					multiHandLandmarks[index][7],
					multiHandLandmarks[index][8], // tip
				];

				// Changes size depending on the json used
				// 
				const indexFingerVecFloatArr = indexFingerLandmarks.reduce((accum, current) => [...accum, current.x, current.y], []);

				
				const pointingDirCanvasEdge = getVec2DirectionEdge([indexFingerVecFloatArr[0], indexFingerVecFloatArr[1]], [indexFingerVecFloatArr[2], indexFingerVecFloatArr[3]]);
				

				const directionArr = [...indexFingerVecFloatArr, ...pointingDirCanvasEdge];

				
				// Requires same length as build in VPTree being 4 - got only 1 relevant vector thwough (length of 2)
				// last two being relevant here for the comparison function
				// const test = findMostSimilarMatch(indexFingerVecFloatArr.slice(indexFingerVecFloatArr.length - 4, indexFingerVecFloatArr.length));



				const t = customData.map((d, i) => {

					return {i, d: findClosestPointDirectionIntersection(directionArr, d)};
				}).filter(e => e.d).sort((a, b) => a.d - b.d);

				// console.log(customData, directionArr);

				// console.info('return val', t, t[0].i, t[t.length - 1]);
				const mostSimilarMatchIndex = t[0]?.i

				if (mostSimilarMatchIndex) {
					activeImage = `/images/${DATASET[mostSimilarMatchIndex].file}`;
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

				const indexFingerLandmarks = landmarks;

				drawConnectors(
					canvasContext, indexFingerLandmarks, HAND_CONNECTIONS,
					{color: isRightHand ? '#00FF00' : '#FF0000'});
					
				drawLandmarks(canvasContext, indexFingerLandmarks, {
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

		// setTimeout(render, 1000 / 24);
		setTimeout(render, 1000 / 12);
	}
	
	onDestroy(() => {
		window.removeEventListener('resize', onResize);
	});

	onMount(async () => {
		canvasEl.width = videoEl.offsetWidth;
		canvasEl.height = videoEl.offsetHeight;
		canvasEl.style.width = '100%';
		canvasEl.style.height = '100%';

		const data = await fetch('/output.json');
		// const data = await fetch('/output_full.json');
		// const data = await fetch('/output_index.json');
		// const data = await fetch('/output_tip.json');
		DATASET = await data.json();

		// buildVPTree(DATASET.map(d => d.landmarks));



		// Test - adding normalized finger pointed direction based on index tip and first connected join
		// To be added through JSON afterwards in the Python script
		// Input does not require two vectors though but need s to be same lenght for search
		DATASET = DATASET.map(d => {
			return ({ ...d, dest: getVec2DirectionEdge([d.landmarks[6], d.landmarks[7]], [d.landmarks[8], d.landmarks[9]])
		})});
		buildVPTree(DATASET.map(d => [...d.landmarks.slice(d.landmarks.length - 4, d.landmarks.length),  ...d.dest]));
		customData = DATASET.map(d => [...d.landmarks.slice(d.landmarks.length - 4, d.landmarks.length),  ...d.dest]);
		
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