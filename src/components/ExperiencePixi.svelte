<script>
	import { onMount } from 'svelte';
	import anime from 'animejs/lib/anime.es.js';
	import * as PIXI from 'pixi.js';


	import { findMostSimilarMatch } from '../utils/vptree';
	import { hasDetectedFirstHand, hasIntroTransitionEnded } from '../stores';
	import { drawCustomHands, vulgarityDetection } from '../utils/handUtils.js';

	import HandLostPrompt from './HandLostPrompt.svelte';

	export let videoEl;
	export let mediaHands;
	export let imageHostURL;
	export let dataset;
	export let datasetEasterEgg;

	let PixiApp;

	let imageEl;
	let canvasEl;

	let imageContainer;
	let handContainer;
	let mpHand;
	let IMAGES_LIMIT = 10;
	let activeImage = '';
	let prevActiveImage;
	let isAnimating = false;

	let displacementMaps = [
		'/maps/dMap.jpg',
		'/maps/dMap2.jpg',
		'/maps/dSpots.jpg',
		'/maps/dWave.jpg',
		'/maps/dNoise.jpg',
		'/maps/dDistortion.jpg',
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

		// let colorMatrix = new PIXI.filters.ColorMatrixFilter();
		// displacementFilters.push(colorMatrix);
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

		if (closestIndex || hasDetectedVulgarity) {
			let closestHand;

			if (hasDetectedVulgarity) {
				const randomImage = Math.floor(Math.random() * datasetEasterEgg.length) % datasetEasterEgg.length;

				closestHand = datasetEasterEgg[randomImage];
				activeImage = `/easteregg-images/${closestHand.file}`;
			} else {
				closestHand = dataset[closestIndex];
				activeImage = `${imageHostURL}/${closestHand.file}`;
				// activeImage = `/images/${closestHand.file}`;
				// activeImage = `${imageHostURL}/${closestHand.file}`;
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

					if (isMirrorResult && !hasDetectedVulgarity) {
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

							const animDuration = 800;

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

	const drawPIXIHands = (landmarks) => {
		// setTimeout(() => {
		// 	mpHand.clear();
		// }, 5000);
		drawCustomHands(PixiApp.screen, mpHand, landmarks);
	};

	let handPromptSchedule = null;
	let isHandPromptVisible = false;
	const checkShouldScheduleHandPrompt = (areHandsDetected) => {
		if (!areHandsDetected && !handPromptSchedule) {
			handPromptSchedule = setTimeout(() => {
				isHandPromptVisible = true;
			}, 1500);
		} else if (areHandsDetected && handPromptSchedule) {
			clearTimeout(handPromptSchedule);
			handPromptSchedule = null;
			isHandPromptVisible = false;
		}
	};

	const handleHandsResults = (results) => {
		const { multiHandLandmarks, multiHandedness, image } = results;

		if (!$hasDetectedFirstHand && multiHandedness?.length) {
			hasDetectedFirstHand.set(true);

			return;
		}

		if (!$hasIntroTransitionEnded) return;

		// checkShouldScheduleHandPrompt(multiHandedness?.length);

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
		

		let pixiRender = () => {
			PixiApp.renderer.render(PixiApp.stage);
			window.requestAnimationFrame(pixiRender);
		};
		pixiRender();
	};

	onMount(() => {
		initCanvas();
		addFilterLayer();
		addLeakingHand();
		mediaHands.onResults(handleHandsResults);

		render();
	});
</script>

<div class="container">
	<!-- svelte-ignore a11y-missing-attribute -->
	<img bind:this={imageEl} src={activeImage} />

	<canvas class="main-canvas" bind:this={canvasEl} />

	{#if isHandPromptVisible}
		<HandLostPrompt />
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

	.main-canvas {
		position: absolute;
		width: 100%;
		height: initial;
	}
</style>
