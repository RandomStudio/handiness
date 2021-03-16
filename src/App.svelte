<script>
	import { getContext, onMount, onDestroy } from "svelte";

	import initMediaHands from './tracking/initMediaHands';
	import initCamera from './tracking/initCamera';

	import { cosineDistanceMatching, buildVPTree, findMostSimilarMatch } from './utils';
	import { getVec2Distance, getVec2DirectionEdge } from './vectorHelpers';

	let videoEl;
	let canvasEl;
	let canvasContext;

	let mediaHands;

	let DATASET;

	let activeImage = '';

	// Get closest fingertip
	const getClosestFingerTip = (finger) => {
		const imageDistances = DATASET.map((data, index) => ({
			index,
			src: data.file,
			distance: getVec2Distance(finger.x, data.x, finger.y, data.y)
		})); 

		const closestFinger = imageDistances.sort((a, b) => a.distance - b.distance)[0];

		return closestFinger;
	}

	// Get average closest finger
	// Not direction as of yet
	const getClosestFinger = (finger) => {
		const imageDistances = DATASET.map((data, index) => {
			const distance = finger.map((f, i) => {
				const l = data.landmarks;
				return getVec2Distance(f.x, l[i * 2], f.y, l[i * 2 + 1]);
			}).reduce((acc, current) => acc + current, 0) / finger.length;

			
			return ({
				index,
				src: data.file,
				distance
			})
		});

		// const allDistances = finger.map(f => getVec2Distance(f.x, data.x, f.y, data.y))

		const closestFinger = imageDistances.sort((a, b) => a.distance - b.distance)[0];

		return closestFinger;
	}

	// const getClosestHand

	const handleHandsResults = ({ multiHandLandmarks, multiHandedness, image }) => {
		if (multiHandedness?.length) {
			multiHandedness.forEach(({ label }, index) => {
				debugDrawOverlay({ multiHandLandmarks, multiHandedness, image });
				
				// const indexTip = multiHandLandmarks[index][8];
				const landmarks = multiHandLandmarks[index];

				// const closest = getClosestFingerTip(indexTip);
				// activeImage = `/images/${closest.src}`;

				// Next up

				// - canvas to be same size as video - or window without weird aspect ratio

				// - render hand skeleton only without the extra video feed on the canvas

				// - try rendering the image same size as the canvas

				// - responsive

				// - UI

				// - other stuff


				const indexFingerLandmarks = [
					multiHandLandmarks[index][0], // wrist
					multiHandLandmarks[index][5], // root
					multiHandLandmarks[index][6],
					multiHandLandmarks[index][7],
					multiHandLandmarks[index][8], // tip
				];
				
				// Changes size depending on the json used
				// 
				const indexFingerVecFloatArr = indexFingerLandmarks.reduce((accum, current) => [...accum, current.x, current.y], []);



				// const pointingDirCanvasEdge = getVec2DirectionEdge([indexFingerVecFloatArr[0], indexFingerVecFloatArr[1]], [indexFingerVecFloatArr[2], indexFingerVecFloatArr[3]]);
				
				
				
				
				
				
				// return;



				// const indexFingerVecFloatArr = [multiHandLandmarks[index][8]].reduce((accum, current) => [...accum, current.x, current.y], []);
				const mostSimilarMatchIndex = findMostSimilarMatch(indexFingerVecFloatArr);
				// console.log(mostSimilarMatchIndex);
				activeImage = `/images/${DATASET[mostSimilarMatchIndex].file}`;

				// console.log(findMostDistanceSimilar());

				// console.info(indexFingerVecFloatArr, DATASET[mostSimilarMatchIndex].landmarks)
				


				// const closestAverageIndex = getClosestFinger(indexFingerLandmarks);
				// activeImage = `/images/${closestAverageIndex.src}`;


				// const closestFingerTip = getClosestFinger([multiHandLandmarks[index][8]]);
				// console.info(closestFingerTip)
				// activeImage = `/images/${closestFingerTip.src}`;

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

				// const indexFingerLandmarks = [
				// 	landmarks[5],
				// 	landmarks[6],
				// 	landmarks[7],
				// 	landmarks[8],
				// ];
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

		requestAnimationFrame(render);
	}
	
	onDestroy(() => {
		window.removeEventListener('resize', onResize);
	});

	onMount(async () => {
		// canvasEl.width = canvasEl.offsetWidth;
		// canvasEl.height = canvasEl.offsetHeight;
		canvasEl.width = videoEl.offsetWidth;
		canvasEl.height = videoEl.offsetHeight;
		canvasEl.style.width = '100%';
		canvasEl.style.height = '100%';

		const data = await fetch('/output.json');
		// const data = await fetch('/output_full.json');
		// const data = await fetch('/output_index.json');
		// const data = await fetch('/output_tip.json');
		DATASET = await data.json();

		// Test - adding normalized finger pointed direction based on index tip and first connected join
		// To be added through JSON afterwards in the Python script
		DATASET = DATASET.map(d => ({ ...d, dest: getVec2DirectionEdge([d[6], d[7]], [d[8], d[9]])}))

		buildVPTree(DATASET.map(d => d.landmarks));
		
		console.log('Before camera --- ');
		
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