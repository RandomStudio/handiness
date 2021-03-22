<script>
	import { onDestroy, onMount } from "svelte";
	import { findMostSimilarMatch } from "../utils";


	let imageEl;
	let canvasEl;
	let canvasContext;

	let activeImage = '';
	let prevActiveImage;

	export let videoEl;
	export let mediaHands;
	export let DATASET;

	const handleHandsResults = ({
		multiHandLandmarks,
		multiHandedness,
		image,
	}) => {
		if (multiHandedness?.length) {
			multiHandedness.forEach(({ label }, index) => {
				const landmarks = multiHandLandmarks[index];

				// Float 42
				const landmarksVecFloatArr = landmarks.reduce(
					(accum, current) => [...accum, current.x, current.y],
					[]
				);

				const closestIndex = findMostSimilarMatch(landmarksVecFloatArr);

				if (closestIndex) {
					const closestHand = DATASET[closestIndex]
					activeImage = `/images-train/${closestHand.file}`;


					if (
						imageEl.src.includes(activeImage) &&
						activeImage !== prevActiveImage
					) {
						// activeImages.push(activeImage)
						// if (activeImages.length > 10) {
						// 	canvasContext.clearRect(0, 0, canvasEl.width, canvasEl.height)
						// 	activeImages.splice(0, activeImages.length)
						// }
						canvasContext.save();

						// Check image orientation
						// const isPortrait = canvasEl.height > canvasEl.width;
						// const scaled = isPortrait ? canvasEl.height / imageEl.height : canvasEl.width / imageEl.width;

						const scaled = 1;

						// Offset in image resolution space
						const offsetHandToCenterX =
							(1 - closestHand.center[0] - 0.5) * imageEl.width * scaled;
						const offsetHandToCenterY =
							(closestHand.center[1] - 0.5) * imageEl.height * scaled;

						const scaledMoveX = (imageEl.width * scaled) / 2;
						const scaledMoveY = (imageEl.height * scaled) / 2;

						canvasContext.globalAlpha = 0.75;

						// On Flipping: + for x flipped || - if non flipped image
						// Move the origin to allow the image to always be placed dead centered WHEN drawImage coordiantes are [0, 0]
						// Translate takes into account the inverted scale of X
						canvasContext.translate(
							canvasEl.width / 2 + scaledMoveX,
							canvasEl.height / 2 - scaledMoveY
						);
						canvasContext.scale(-1, 1);
						canvasContext.drawImage(
							imageEl,
							-offsetHandToCenterX,
							-offsetHandToCenterY,
							imageEl.width * scaled,
							imageEl.height * scaled
						);

						canvasContext.restore();

						prevActiveImage = activeImage;
					}
				}
			})
		} else {
			activeImage = '';
		}
	}

	
	const render = async () => {
		// Stuff to do here
		await mediaHands.send({ image: videoEl });

		// requestAnimationFrame(render);

		// setTimeout(render, 1000 / 36);
		// setTimeout(render, 1000 / 30);
		setTimeout(render, 1000 / 24);
		// setTimeout(render, 1000 / 12);
	}
	

	const onResize = () => {
		canvasEl.width = window.innerWidth;
		canvasEl.height = window.innerHeight;
		canvasEl.style.width = '100%';
		canvasEl.style.height = '100%';
	}

	onDestroy(() => {
		window.removeEventListener('resize', onResize);
	});
	
	
	onMount(() => {
		canvasEl.width = window.innerHeight;
		canvasEl.height = window.innerHeight;
		canvasEl.style.width = '100%';
		canvasEl.style.height = '100%';

		canvasContext = canvasEl.getContext('2d');

		
		mediaHands.onResults(handleHandsResults);

		render();
		onResize();

		window.addEventListener('resize', onResize);
	});




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
</script>


<div>
	<!-- <video bind:this={videoEl} /> -->
	
	<!-- svelte-ignore a11y-missing-attribute -->
	<img bind:this={imageEl} src={activeImage} />

	<canvas bind:this={canvasEl} />
</div>


<style>
	div {
		position: relative;
		width: 100%;
		height: 100%;
	}

	img {
		/* position: absolute; */
		display: none; 
	}
	
	canvas {
		position: absolute;
		width: 100%;
		height: initial;
	}
</style>