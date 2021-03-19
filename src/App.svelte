<script>
	import { getContext, onMount, onDestroy } from "svelte";

	import initMediaHands from './tracking/initMediaHands';
	import initCamera from './tracking/initCamera';

	import { buildVPTree, findMostSimilarMatch } from './utils';

	let videoEl;
	let imageEl;
	let canvasEl;
	let canvasContext;

	let mediaHands;

	let DATASET;

	let activeImage = '';

	const handleHandsResults = ({ multiHandLandmarks, multiHandedness, image }) => {
		if (multiHandedness?.length) {
			multiHandedness.forEach(({ label }, index) => {
				const landmarks = multiHandLandmarks[index];

				// const indexTipAsOrigin = multiHandLandmarks[index][8]; 
				// const mirrorLandmarks = landmarks.map(({ x, y }) => {
				// 	const differenceX = indexTipAsOrigin.x - x;
				// 	const differenceY = indexTipAsOrigin.y - y;

				// 	// get distance between origin and joint x
				// 	const mirrorX = indexTipAsOrigin.x + differenceX;
				// 	const mirrorY = indexTipAsOrigin.y + differenceY;

				// 	return { x: mirrorX, y: mirrorY }
				// });

				// Float 42
				const landmarksVecFloatArr = landmarks.reduce((accum, current) => [...accum, current.x, current.y], []);
				// const mirrorVecFloatArr = mirrorLandmarks.reduce((accum, current) => [...accum, current.x, current.y], []);


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

				const closestIndex = findMostSimilarMatch(landmarksVecFloatArr);

				if (closestIndex) {
					const closestHand = DATASET[closestIndex];
					activeImage = `/images-train-ann/${closestHand.file}`;

					if (imageEl) {
						canvasContext.clearRect(0, 0, canvasEl.width, canvasEl.height);

						canvasContext.save();
						// TODO: Change what to scale depending on whether the image is portrait or landscape and size dominance compared to the window size
						const scaled = canvasEl.width / imageEl.width;

						// Offset in image resolution space
						const offsetHandToCenterX = (1 - closestHand.center[0] - 0.5) * imageEl.width * scaled;
						const offsetHandToCenterY = (closestHand.center[1] - 0.5) * imageEl.height * scaled;

						const scaledMoveX = imageEl.width * scaled / 2;
						const scaledMoveY = imageEl.height * scaled / 2;
						
						// On Flipping: + for x flipped || - if non flipped image
						// Move the origin to allow the image to always be placed dead centered WHEN drawImage coordiantes are [0, 0]
						// Translate takes into account the inverted scale of X
						canvasContext.translate(canvasEl.width / 2 + scaledMoveX, canvasEl.height / 2 - scaledMoveY);
						canvasContext.scale(-1, 1);
						canvasContext.drawImage(imageEl, -offsetHandToCenterX, -offsetHandToCenterY, canvasEl.width, imageEl.height * scaled);
						
						canvasContext.restore();


						debugDrawOverlay({ multiHandLandmarks, multiHandedness, image });




						// const copy = [...landmarks];
						// const sortedY = copy.sort((a, b) => a.y - b.y);

						// // 1 - because we flipped X
						// const centerX = copy.reduce((accum, current) => accum + current.x, 0) / copy.length;
						// const centerY = copy.reduce((accum, current) => accum + current.y, 0) / copy.length;

						// console.info(centerX * canvasEl.width, centerY * canvasEl.height);
						// canvasContext.fillStyle = 'yellow';
						// canvasContext.fillRect(centerX * canvasEl.width, centerY * canvasEl.height, 15, 15);
					}
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
		
		<!-- svelte-ignore a11y-missing-attribute -->
		<img bind:this={imageEl} src={activeImage} />

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

	img {
		display: none; 
	}
	
	video, img {
		transform: scaleX(-1);
	}


	video, canvas, img {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	canvas {
		height: initial;
	}
</style>