<script>
	import { onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { findMostSimilarMatch } from '../utils';

	import { hasDetectedFirstHand, hasIntroTransitionEnded } from '../stores';
	// let hasDetectedFirstHand_value;
	// let hasIntroTransitionEnded_value;
	// hasDetectedFirstHand.subscribe((value) => (hasDetectedFirstHand_value = value));
	// hasIntroTransitionEnded.subscribe((value) => (hasIntroTransitionEnded_value = value));

	export let videoEl;
	export let mediaHands;
	export let DATASET;

	let imageEl;
	let canvasEl;
	let canvasContext;
	let handCanvasEl;
	let handCanvasContext;

	let activeImage = '';
	let activeImages = [];
	let prevActiveImage;

	let similarityRate = '-';
	let currentHandLabel = 'None';
	let showAnnotatedImages = false;
	let showAnnotatedToggler = false;
	let showImageBlending = false;
	let showImageBlendedToggler = false;

	const switchImageType = (e) => {
		showAnnotatedToggler = !showAnnotatedToggler;
		showAnnotatedImages = !showAnnotatedImages;
	};

	const switchImageBlending = () => {
		showImageBlendedToggler = !showImageBlendedToggler;
		showImageBlending = !showImageBlending;
		showImageBlending
			? (canvasContext.globalCompositeOperation = 'difference') // COOL BUT MAYBE TOO MUCH
			: (canvasContext.globalCompositeOperation = 'normal');
	};

	const drawImages = (landmarks) => {
		// Float 42
		const landmarksVecFloatArr = landmarks.reduce((accum, current) => [...accum, current.x, current.y], []);

		// Doesn't matter where the origin is when looking for cosine similarities
		//
		const wristAsOrigin = landmarks[0];

		const mirroredLandmarks = landmarks
			.map(({ x, y }) => {
				const differenceX = wristAsOrigin.x - x;
				const differenceY = wristAsOrigin.y - y;

				// get distance between origin and joint x
				const mirrorX = wristAsOrigin.x + differenceX;
				// const mirrorY = wristAsOrigin.y + differenceY;

				return { x: mirrorX, y };
			})
			.reduce((accum, current) => [...accum, current.x, current.y], []);

		const normalSimilarMatch = findMostSimilarMatch(landmarksVecFloatArr);
		const mirrorXSimilarMatch = findMostSimilarMatch(mirroredLandmarks);

		const closestMatch = normalSimilarMatch?.d < mirrorXSimilarMatch?.d ? normalSimilarMatch : mirrorXSimilarMatch;
		const closestIndex = closestMatch.i;

		if (closestIndex) {
			const closestHand = DATASET[closestIndex];

			activeImage = showAnnotatedImages
				? `/images-coco-final-ann/${closestHand.file}`
				: `/images-coco-final/${closestHand.file}`;

			if (imageEl.src.includes(activeImage) && activeImage !== prevActiveImage) {
				similarityRate = (1 - closestMatch.d).toFixed(2) * 100;
				prevActiveImage = activeImage;

				activeImages.push(activeImage);

				if (activeImages.length >= 20) {
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

				canvasContext.globalAlpha = 1;
				canvasContext.shadowOffsetX = 1;
				canvasContext.shadowOffsetY = 2;
				canvasContext.shadowColor = 'white';
				canvasContext.shadowBlur = 10;

				// On Flipping: + for x flipped || - if non flipped image
				// Move the origin to allow the image to always be placed dead centered WHEN drawImage coordiantes are [0, 0]
				// Translate takes into account the inverted scale of X
				canvasContext.translate(canvasEl.width / 2 + scaledMoveX, canvasEl.height / 2 - scaledMoveY);

				canvasContext.scale(-1, 1);

				// canvasContext.globalCompositeOperation = 'multiply'; // NOPE
				// canvasContext.globalCompositeOperation = 'screen'; // NOT REALLY
				// canvasContext.globalCompositeOperation = 'overlay'; // NOPE
				// canvasContext.globalCompositeOperation = 'darken'; // TOO MUDY
				// canvasContext.globalCompositeOperation = 'lighten'; // QUITE NICE
				// canvasContext.globalCompositeOperation = 'color-dodge'; // QUITE GOOD 4/10
				// canvasContext.globalCompositeOperation = 'color-burn'; // TOO DIRRY
				// canvasContext.globalCompositeOperation = 'hard-light'; // NOTHING SPECIAL
				// canvasContext.globalCompositeOperation = 'soft-light'; // HMMM
				// canvasContext.globalCompositeOperation = 'exclusion'; // INVERSE OF THIS WOULD BE NICE
				// canvasContext.globalCompositeOperation = 'hue'; // NOPE CAN SEE ONLY TOP IMAGE
				// canvasContext.globalCompositeOperation = 'saturation'; // NOPE
				// canvasContext.globalCompositeOperation = 'color'; // NOPE CAN SEE ONLY TOP IMAGE
				// canvasContext.globalCompositeOperation = 'luminosity'; // NOPE
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
			}
		}
	};

	const drawHands = (canvasContext, results) => {
		canvasContext.save();

		canvasContext.clearRect(0, 0, handCanvasEl.width, handCanvasEl.height);
		if (results.multiHandLandmarks && results.multiHandedness) {
			for (let index = 0; index < results.multiHandLandmarks.length; index++) {
				const classification = results.multiHandedness[index];
				const isRightHand = classification.label === 'Right';
				const landmarks = results.multiHandLandmarks[index];

				drawConnectors(canvasContext, landmarks, HAND_CONNECTIONS, {
					color: isRightHand ? '#00FF00' : '#FF0000',
					lineWidth: 2,
				});

				drawLandmarks(canvasContext, landmarks, {
					color: isRightHand ? '#00FF00' : '#FF0000',
					fillColor: isRightHand ? '#FF0000' : '#00FF00',
					// lineWidth: 2,
					radius: 1,
				});
			}
		}

		canvasContext.restore();
	};

	const handleHandsResults = (results) => {
		const { multiHandLandmarks, multiHandedness, image } = results;

		if (!$hasDetectedFirstHand && multiHandedness?.length) {
			console.log(results);
			hasDetectedFirstHand.set(true);
			return;
		}

		if (!$hasIntroTransitionEnded) return;

		if (multiHandedness?.length) {
			multiHandedness.forEach(({ label }, index) => {
				const landmarks = multiHandLandmarks[index];

				drawImages(landmarks);

				drawHands(handCanvasContext, results);

				if (label !== currentHandLabel) {
					currentHandLabel = label;
				}
			});
		} else {
			activeImage = '';
			currentHandLabel = 'None';
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
</script>

<div class="container">
	<!-- svelte-ignore a11y-missing-attribute -->
	<img bind:this={imageEl} src={activeImage} />

	<canvas class="main-canvas" bind:this={canvasEl} />

	<aside class="hand-canvas-container">
		<!-- <p>{currentHandLabel === 'None' ? 'Raise Your Hand' : 'Your Hand:'}</p> -->
		<canvas class="hand-canvas" bind:this={handCanvasEl} />
	</aside>

	{#if $hasIntroTransitionEnded}
		<aside transition:fade class="hand-info-container">
			<span class="toggler">
				<span class:active={showAnnotatedToggler} class="toggle-switch" on:click={switchImageType}>
					<span class="toggle-knob" />
				</span>
				Display Annotation
			</span>
			<span class="toggler">
				<span class:active={showImageBlendedToggler} class="toggle-switch" on:click={switchImageBlending}>
					<span class="toggle-knob" />
				</span>
				Blend Images
			</span>
			<p>Detected Hand: {currentHandLabel}</p>
			<!-- <p>Similarity: {similarityRate}%</p> -->
			<div style={`--similarityRate: ${similarityRate / 100}`}>Similiarity: {similarityRate}%</div>
		</aside>
	{/if}
</div>

<style lang="scss">
	.container {
		position: relative;
		width: 100%;
		height: 100%;
	}

	img {
		display: none;
	}

	aside {
		position: absolute;
	}

	.hand-info-container {
		bottom: 16px;
		left: 16px;
		background: #fff;

		div {
			height: 100%;
			width: 100%;
			background: red;
			transform-origin: left;
			// transform: scaleX(.5);
			transform: scaleX(var(--similarityRate));
		}

		.toggler {
			display: block;
		}
		.toggle-switch {
			height: 22px;
			width: 46px;
			display: inline-block;
			background-color: grey;
			margin: 2px;
			vertical-align: sub;
			border-radius: 30px;
			cursor: pointer;
			box-shadow: inset 1px 1px 9px -3px rgba(4, 4, 4, 0.08), 1px 2px 6px -2px rgba(0, 0, 0, 0.01);
			.toggle-knob {
				width: 20px;
				height: 20px;
				display: inline-block;
				background-color: #ffffff;
				border: solid 1px rgba(126, 126, 126, 0.07);
				box-shadow: 0 1px 3px rgba(107, 106, 106, 0.26), 0 5px 1px rgba(107, 106, 106, 0.13);
				border-radius: 26px;
				margin: 1px 1px;
			}
			&.active {
				background-color: #77e189;
				.toggle-knob {
					margin-left: 24px;
				}
			}
		}
	}

	.hand-canvas-container {
		bottom: 16px;
		right: 16px;

		p {
			color: #fff;
		}
	}

	.main-canvas {
		position: absolute;
		width: 100%;
		height: initial;
	}

	.hand-canvas {
		width: 240px;
		height: 160px;

		/* width: 1280,
		height: 720, */
		/* background: rgb(168, 168, 168); */
	}
</style>
