<script>
	import { onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	import anime from 'animejs/lib/anime.es.js';

	import * as PIXI from 'pixi.js';

	import { findMostSimilarMatch } from '../utils/vptree';
	import { hasDetectedFirstHand, hasIntroTransitionEnded } from '../stores';
	import { drawCustomHands, vulgarityDetection } from '../utils/handUtils.js';

	export let videoEl;
	export let mediaHands;
	export let DATASET;

	let PixiApp;

	let imageEl;
	let canvasEl;
	let canvasContext;
	let handCanvasEl;
	let handCanvasContext;

	let imageContainer;
	let handContainer;
	let mpHand;
	let IMAGES_LIMIT = 10;
	let activeImage = '';
	let activeImages = [];
	let prevActiveImage;
	let isAnimating = false;

	// let similarityRate = '-';
	// let currentHandLabel = 'None';

	// let showAnnotatedImages = false;
	// let showAnnotatedToggler = false;
	// let showImageBlending = false;
	// let showImageBlendedToggler = false;
	let displacementMaps = [
		'/maps/dMap.jpg',
		'/maps/dMap2.jpg',
		'/maps/dSpots.jpg',
		'/maps/dWave.jpg',
		'/maps/dNoise.jpg',
		'/maps/dDistortion.jpg',
		// '/maps/Moon_Displace_1014_preview.jpg',
		// '/maps/Earth_Disp_1022_preview.jpg',
	];
	let displacementSprites = [];
	let displacementFilters = [];

	const addFilterLayer = () => {
		displacementMaps.forEach((map) => {
			let dSprite = PIXI.Sprite.from(map);
			dSprite.width = PixiApp.renderer.width * 1.5;
			dSprite.height = PixiApp.renderer.height * 1.5;
			dSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
			dSprite.anchor.set(0.5);

			PixiApp.stage.addChild(dSprite);

			let dFilter = new PIXI.filters.DisplacementFilter(dSprite);
			dFilter.scale.set(0.1);

			displacementSprites.push(dSprite);
			displacementFilters.push(dFilter);
		});

		imageContainer.filters = displacementFilters;
	};

	const drawImages = (landmarks) => {
		// Float 42
		const landmarksVecFloatArr = landmarks.reduce((accum, current) => [...accum, current.x, current.y], []);

		// Doesn't matter where the origin is when looking for cosine similarities
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

		const isMirrorResult = normalSimilarMatch?.d < mirrorXSimilarMatch?.d;

		const closestMatch = isMirrorResult ? normalSimilarMatch : mirrorXSimilarMatch;
		const closestIndex = closestMatch.i;

		const hasDetectedVulgarity = vulgarityDetection(landmarks);

		if (closestIndex) {
			const closestHand = DATASET[closestIndex];

			if (hasDetectedVulgarity) {
				// Attach to a different set of images
				// OR a whole different experience
				activeImage = `/images/${closestHand.file}`;
			} else {
				activeImage = `/images/${closestHand.file}`;
			}

			// if (imageEl.src.includes(activeImage) && activeImage !== prevActiveImage) {
			if (imageEl.src.includes(activeImage) && activeImage !== prevActiveImage && !isAnimating) {
				prevActiveImage = activeImage;

				// similarityRate = (1 - closestMatch.d).toFixed(2) * 100;

				// Calculate the required scaling to normalize the hand bbox/size of all images
				const landmarkCopies = [...landmarks];
				const { [0]: firstX, [landmarkCopies.length - 1]: lastX } = landmarkCopies.sort((a, b) => a.x - b.x);
				const { [0]: firstY, [landmarkCopies.length - 1]: lastY } = landmarkCopies.sort((a, b) => a.y - b.y);

				const cornerLeftTop = [firstX.x, firstY.y];
				const cornerRightBottom = [lastX.x, lastY.y];

				// Should change depending on resolution
				const xDiff = 0.25 / (cornerRightBottom[0] - cornerLeftTop[0]);
				const yDiff = 0.5 / (cornerRightBottom[1] - cornerLeftTop[1]);

				const scaled = yDiff;

				const newTexture = PIXI.Texture.from(activeImage);

				const newImageSprite = new PIXI.Sprite(newTexture);

				// Scaling does not affect coordinate system
				// Continue by assuming moving with the original sizing and not after scale dimensions
				newImageSprite.scale.set(scaled, scaled);
				newImageSprite.anchor.set(0.5);

				// Listener emitted when texture has fully loaded including metadata
				newTexture.on('update', onTextureUpdate);

				function onTextureUpdate() {
					// Offset in image resolution space
					let offsetHandToCenterX = (closestHand.center[0] - 0.5) * newImageSprite.width;
					const offsetHandToCenterY = (closestHand.center[1] - 0.5) * newImageSprite.height;

					if (isMirrorResult) {
						newImageSprite.scale.set(-scaled, scaled);
						newImageSprite.x = PixiApp.screen.width / 2 + -offsetHandToCenterX;
					} else {
						newImageSprite.x = PixiApp.screen.width / 2 + offsetHandToCenterX;
					}

					newImageSprite.y = PixiApp.screen.height / 2 - offsetHandToCenterY;

					// Load object into GPU
					PixiApp.renderer.plugins.prepare.upload(newImageSprite, () => {
						if (imageContainer.children.length > IMAGES_LIMIT) {
							imageContainer.removeChildren(0, 1);
						}

						if (!isAnimating) {
							isAnimating = true;

							imageContainer.children.forEach((image) => (image.alpha -= 0.1));

							const randomFilter =
								displacementFilters[
									Math.floor(Math.random() * displacementFilters.length) % displacementFilters.length
								];

							const currentImageChild = imageContainer.children[imageContainer.children.length - 1];
							const newImageChild = imageContainer.addChild(newImageSprite);

							newImageSprite.alpha = 0;

							const animDuration = 1200;

							const transitionTimeline = anime.timeline({
								easing: 'easeOutExpo',
								duration: animDuration,
							});

							transitionTimeline.add(
								{
									targets: randomFilter.scale,
									x: Math.floor(Math.max(100, Math.random() * 800)),
									y: Math.floor(Math.max(100, Math.random() * 800)),
								},
								0,
							);

							transitionTimeline.add(
								{
									targets: currentImageChild,
									alpha: 0.75,
								},
								animDuration * 0.5,
							);

							transitionTimeline.add(
								{
									targets: newImageSprite,
									alpha: [0, 1],
								},
								animDuration * 0.5,
							);

							transitionTimeline.add(
								{
									targets: randomFilter.scale,
									y: 0.1,
									x: 0.1,
								},
								animDuration * 0.75,
							);

							transitionTimeline.finished.then(() => {
								isAnimating = false;
							});
						}
					});
				}
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
					lineWidth: 5,
				});

				drawLandmarks(canvasContext, landmarks, {
					fillColor: isRightHand ? '#FF0000' : '#00FF00',
					lineWidth: 5,
					radius: 1,
				});
			}
		}

		canvasContext.restore();
	};

	const drawPIXIHands = (landmarks) => {
		mpHand.clear();

		drawCustomHands(PixiApp.screen, mpHand, landmarks);
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

				drawPIXIHands(landmarks);
			});
		} else {
			activeImage = '';
		}
	};

	const render = async () => {
		// Stuff to do here
		await mediaHands.send({ image: videoEl });

		setTimeout(render, 1000 / 12);
	};

	const initCanvas = () => {
		PixiApp = new PIXI.Application({
			view: canvasEl,
			antialias: true, // default: false
			backgroundColor: 0xbbf2b5,
			resizeTo: window,
		});

		imageContainer = new PIXI.Container();
		handContainer = new PIXI.Container();
		PixiApp.stage.addChild(imageContainer);
		PixiApp.stage.addChild(handContainer);

		// Pre-init container to draw hands in
		mpHand = new PIXI.Graphics();
		PixiApp.stage.addChild(mpHand);
		mpHand.filters = [new PIXI.filters.BlurFilter(18)];

		let pixiRender = () => {
			PixiApp.renderer.render(PixiApp.stage);
			window.requestAnimationFrame(pixiRender);
		};
		pixiRender();
	};

	onMount(() => {
		initCanvas();
		addFilterLayer();

		canvasContext = canvasEl.getContext('2d');
		handCanvasContext = handCanvasEl.getContext('2d');

		mediaHands.onResults(handleHandsResults);

		render();
	});
</script>

<div class="container">
	<img bind:this={imageEl} src={activeImage} />

	<canvas class="main-canvas" bind:this={canvasEl} />

	<aside class="hand-canvas-container">
		<!-- <p>{currentHandLabel === 'None' ? 'Raise Your Hand' : 'Your Hand:'}</p> -->
		<canvas class="hand-canvas" bind:this={handCanvasEl} />
	</aside>

	<!-- {#if $hasIntroTransitionEnded}
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

			<div transition:fade class="similarity-container" style={`--similarityRate: ${similarityRate / 100}`}>
				<span />
				<p>Similiarity: {similarityRate}%</p>
			</div>

		</aside>
	{/if} -->
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
		backdrop-filter: blur(32px);
		color: white;

		.similarity-container {
			position: relative;
			min-width: 8rem;
			width: 100%;
			max-width: 14rem;
			height: 24px;
			margin-bottom: 1.6rem;
			background: var(--color-gray);
			color: var(--color-white);
			box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);

			span {
				display: block;
				width: 100%;
				height: 100%;
				background: var(--color-black);
				transform: scaleX(var(--similarityRate));
				transform-origin: left;
			}

			p {
				font-size: var(--font-small);
				position: absolute;
				top: 0;
				left: 0.4em;
			}
		}

		.toggler {
			display: block;
		}
		.toggle-switch {
			height: 22px;
			width: 46px;
			display: inline-block;
			background-color: black;
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
	}

	.main-canvas {
		position: absolute;
		width: 100%;
		height: initial;
	}

	.hand-canvas {
		width: 240px;
		height: 160px;
	}
</style>
