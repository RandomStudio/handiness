<script>
	import { onDestroy, onMount } from 'svelte';
	import { findMostSimilarMatch } from '../utils';

	let imageEl;
	let canvasEl;
	let canvasContext;
	let handCanvasEl;
	let handCanvasContext;

	let activeImage = '';
	let activeImages = [];
	let prevActiveImage;

	export let videoEl;
	export let mediaHands;
	export let DATASET;

	const drawImages = (landmarks) => {
		// Float 42
		const landmarksVecFloatArr = landmarks.reduce((accum, current) => [...accum, current.x, current.y], []);

		const closestIndex = findMostSimilarMatch(landmarksVecFloatArr);

		if (closestIndex) {
			const closestHand = DATASET[closestIndex];
			activeImage = `/images-train/${closestHand.file}`;

			if (imageEl.src.includes(activeImage) && activeImage !== prevActiveImage) {
				activeImages.push(activeImage);
				
				if (activeImages.length > 10) {
					canvasContext.clearRect(0, 0, canvasEl.width, canvasEl.height);
					activeImages.splice(0, activeImages.length - 1);
				}

				canvasContext.save();

				// Check image orientation
				// Scale image relatively in aspect ratio to take the full height or width of the screen at the very least
				// const isPortrait = canvasEl.height > canvasEl.width;
				// const scaled = isPortrait ? canvasEl.height / imageEl.height : canvasEl.width / imageEl.width;

				// Calculate the required scaling to normalize the hand bbox/size of all images
				const landmarkCopies = [...landmarks];
				const { [0]: firstX, [landmarkCopies.length - 1]: lastX } = landmarkCopies.sort((a, b) => a.x - b.x);
				const { [0]: firstY, [landmarkCopies.length - 1]: lastY } = landmarkCopies.sort((a, b) => a.y - b.y);

				const cornerLeftTop = [firstX.x, firstY.y];
				const cornerRightBottom = [lastX.x, lastY.y];

				// Should change depending on resolution :thinking
				const xDiff = 0.25 / (cornerRightBottom[0] - cornerLeftTop[0]);
				const yDiff = 0.5 / (cornerRightBottom[1] - cornerLeftTop[1]);

				// const scaled = (xDiff > yDiff ? xDiff : yDiff) * 1.25;
				const scaled = yDiff;

				// Offset in image resolution space
				const offsetHandToCenterX = (1 - closestHand.center[0] - 0.5) * imageEl.width * scaled;
				const offsetHandToCenterY = (closestHand.center[1] - 0.5) * imageEl.height * scaled;

				const scaledMoveX = (imageEl.width * scaled) / 2;
				const scaledMoveY = (imageEl.height * scaled) / 2;

				canvasContext.globalAlpha = 0.75;

				// On Flipping: + for x flipped || - if non flipped image
				// Move the origin to allow the image to always be placed dead centered WHEN drawImage coordiantes are [0, 0]
				// Translate takes into account the inverted scale of X
				canvasContext.translate(canvasEl.width / 2 + scaledMoveX, canvasEl.height / 2 - scaledMoveY);
				canvasContext.shadowOffsetX = 1;
				canvasContext.shadowOffsetY = 2;
				canvasContext.shadowColor = 'white';
				canvasContext.shadowBlur = 10;

				canvasContext.scale(-1, 1);
				canvasContext.drawImage(
					imageEl,
					-offsetHandToCenterX,
					-offsetHandToCenterY,
					imageEl.width * scaled,
					imageEl.height * scaled,
				);

				canvasContext.strokeRect(
					-offsetHandToCenterX,
					-offsetHandToCenterY,
					imageEl.width * scaled,
					imageEl.height * scaled,
				);

				canvasContext.restore();

				prevActiveImage = activeImage;
			}
		}
	};

	const drawHands = (results) => {
		handCanvasContext.save();

		handCanvasContext.clearRect(0, 0, handCanvasEl.width, handCanvasEl.height);
		if (results.multiHandLandmarks && results.multiHandedness) {
			for (let index = 0; index < results.multiHandLandmarks.length; index++) {
				const classification = results.multiHandedness[index];
				const isRightHand = classification.label === 'Right';
				const landmarks = results.multiHandLandmarks[index];

				drawConnectors(handCanvasContext, landmarks, HAND_CONNECTIONS, {
					color: isRightHand ? '#00FF00' : '#FF0000',
					lineWidth: 2,
				});

				drawLandmarks(handCanvasContext, landmarks, {
					color: isRightHand ? '#00FF00' : '#FF0000',
					fillColor: isRightHand ? '#FF0000' : '#00FF00',
					// lineWidth: 2,
					radius: 1,
				});
			}
		}

		handCanvasContext.restore();
	};

	const handleHandsResults = (results) => {
		const { multiHandLandmarks, multiHandedness, image } = results;

		if (multiHandedness?.length) {
			multiHandedness.forEach(({ label }, index) => {
				const landmarks = multiHandLandmarks[index];

				drawImages(landmarks);

				drawHands(results);
			});
		} else {
			activeImage = '';
		}
	};

	const render = async () => {
		// Stuff to do here
		await mediaHands.send({ image: videoEl });

		// requestAnimationFrame(render);

		// setTimeout(render, 1000 / 36);
		// setTimeout(render, 1000 / 30);
		// setTimeout(render, 1000 / 24);
		// setTimeout(render, 1000 / 20);
		setTimeout(render, 1000 / 12);
	};

	const onResize = () => {
		canvasEl.width = window.innerWidth;
		canvasEl.height = window.innerHeight;
		canvasEl.style.width = '100%';
		canvasEl.style.height = '100%';
	};

	onDestroy(() => {
		window.removeEventListener('resize', onResize);
	});

	onMount(() => {
		canvasContext = canvasEl.getContext('2d');
		handCanvasContext = handCanvasEl.getContext('2d');

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

				drawConnectors(canvasContext, landmarks, HAND_CONNECTIONS, { color: isRightHand ? '#00FF00' : '#FF0000' });

				drawLandmarks(canvasContext, landmarks, {
					color: isRightHand ? '#00FF00' : '#FF0000',
					fillColor: isRightHand ? '#FF0000' : '#00FF00',
				});
			}
		}

		canvasContext.restore();
	};
</script>

<div>
	<!-- svelte-ignore a11y-missing-attribute -->
	<img bind:this={imageEl} src={activeImage} />

	<canvas class="main-canvas" bind:this={canvasEl} />

	<aside>
		<p>Your hand:</p>
		<canvas class="hand-canvas" bind:this={handCanvasEl} />
	</aside>
</div>

<style>
	div {
		position: relative;
		width: 100%;
		height: 100%;
	}

	img {
		display: none;
	}

	aside {
		position: absolute;
		bottom: 16px;
		right: 16px;
	}
	aside p {
		color: #fff;
	}

	.main-canvas {
		position: absolute;
		width: 100%;
		height: initial;
	}

	.hand-canvas {
		width: 320px;
		height: 240px;

		/* width: 1280,
		height: 720, */
		background: rgb(168, 168, 168);
	}
</style>
