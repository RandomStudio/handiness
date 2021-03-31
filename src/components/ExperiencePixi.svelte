<script>
	import { onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	import anime from 'animejs/lib/anime.es.js';

	import * as PIXI from 'pixi.js';

	import { findMostSimilarMatch } from '../utils';
	import { hasDetectedFirstHand, hasIntroTransitionEnded } from '../stores';

	export let videoEl;
	export let mediaHands;
	export let DATASET;

	let PixiApp;

	let imageEl;
	let canvasEl;
	let canvasContext;
	let handCanvasEl;
	let handCanvasContext;

	let activeImage = '';
	let activeImages = [];
	let imageContainer;
	let prevActiveImage;
	let IMAGES_LIMIT = 7;
	let isAnimating = false;

	// let similarityRate = '-';
	// let currentHandLabel = 'None';

	// let showAnnotatedImages = false;
	// let showAnnotatedToggler = false;
	// let showImageBlending = false;
	// let showImageBlendedToggler = false;
	let displacementMaps = ['/maps/dPerlin.jpg', '/maps/dMap.jpg', '/maps/dNoise.jpg', '/maps/dMap2.jpg'];
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

		const isMirrorResult = normalSimilarMatch?.d < mirrorXSimilarMatch?.d;

		const closestMatch = isMirrorResult ? normalSimilarMatch : mirrorXSimilarMatch;
		const closestIndex = closestMatch.i;

		if (closestIndex) {
			const closestHand = DATASET[closestIndex];

			// activeImage = showAnnotatedImages
			// 	? `/images-coco-final-ann/${closestHand.file}`
			// 	: `/images-coco-final/${closestHand.file}`;
			// activeImage = `/images/${closestHand.file}`;
			activeImage = `/images_compressed/${closestHand.file}`;

			// if (imageEl.src.includes(activeImage) && activeImage !== prevActiveImage) {
			if (imageEl.src.includes(activeImage) && activeImage !== prevActiveImage && !isAnimating) {
				prevActiveImage = activeImage;

				// similarityRate = (1 - closestMatch.d).toFixed(2) * 100;

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

				// // Should change depending on resolution :thinking
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

				// On Flipping: + for x flipped || - if non flipped image
				// Move the origin to allow the image to always be placed dead centered WHEN drawImage coordiantes are [0, 0]
				// Translate takes into account the inverted scale of X
				function onTextureUpdate() {
					// Offset in image resolution space
					let offsetHandToCenterX = (closestHand.center[0] - 0.5) * newImageSprite.width;
					const offsetHandToCenterY = (closestHand.center[1] - 0.5) * newImageSprite.height;

					if (isMirrorResult) {
						// offsetHandToCenterX = (closestHand.center[0] - 0.5) * newImageSprite.width;
						// 	newImageSprite.x = PixiApp.screen.width / 2 + offsetHandToCenterX;
						// newImageSprite.x = PixiApp.screen.width / 2 - offsetHandToCenterX;
						// newImageSprite.scale.set(-newImageSprite.scale.x, newImageSprite.scale.y);
					} else {
						// newImageSprite.x = PixiApp.screen.width / 2 + offsetHandToCenterX;
					}

					newImageSprite.x = PixiApp.screen.width / 2 + offsetHandToCenterX;
					newImageSprite.y = PixiApp.screen.height / 2 - offsetHandToCenterY;

					// Load object into GPU
					PixiApp.renderer.plugins.prepare.upload(newImageSprite, () => {
						if (imageContainer.children.length > IMAGES_LIMIT) {
							imageContainer.removeChildren(0, 1);
						}

						if (!isAnimating) {
							const randomFilter =
								displacementFilters[
									Math.floor(Math.random() * displacementFilters.length) % displacementFilters.length
								];

							const currentImageChild = imageContainer.children[imageContainer.children.length - 1];
							const newImageChild = imageContainer.addChild(newImageSprite);

							isAnimating = true;

							newImageSprite.alpha = 0;

							const animDuration = 1200;

							const transitionTimeline = anime.timeline({
								easing: 'easeOutExpo',
								duration: animDuration,
							});

							transitionTimeline.add(
								{
									targets: randomFilter.scale,
									x: Math.floor(Math.max(100, Math.random() * 1200)),
									y: Math.floor(Math.max(100, Math.random() * 1200)),
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
									targets: randomFilter.scale,
									y: 0.1,
									x: 0.1,
								},
								animDuration * 0.75,
							);

							transitionTimeline.add(
								{
									targets: newImageSprite,
									alpha: 1,
								},
								animDuration * 0.75,
							);

							transitionTimeline.finished.then(() => {
								isAnimating = false;
							});
						}
					});
				}

				// The anchor is the attachment point for a texture (normalized to the size of the sprite),
				// the pivot point is the point around which an object rotates (in pixel values).

				// const offsetHandToCenterX = (1 - closestHand.center[0] - 0.5) * imageEl.width * scaled;
				// const offsetHandToCenterY = (closestHand.center[1] - 0.5) * imageEl.height * scaled;

				// const scaledMoveX = (imageEl.width * scaled) / 2;
				// const scaledMoveY = (imageEl.height * scaled) / 2;

				// // On Flipping: + for x flipped || - if non flipped image
				// // Move the origin to allow the image to always be placed dead centered WHEN drawImage coordiantes are [0, 0]
				// // Translate takes into account the inverted scale of X
				// if (isMirrorResult) {
				// 	canvasContext.translate(canvasEl.width / 2 + scaledMoveX, canvasEl.height / 2 - scaledMoveY);
				// 	canvasContext.scale(-1, 1);
				// } else {
				// 	canvasContext.translate(canvasEl.width / 2 - scaledMoveX, canvasEl.height / 2 - scaledMoveY);
				// }

				// canvasContext.drawImage(
				// 	imageEl,
				// 	-offsetHandToCenterX,
				// 	-offsetHandToCenterY,
				// 	imageEl.width * scaled,
				// 	imageEl.height * scaled,
				// );

				// canvasContext.strokeRect(
				// 	-offsetHandToCenterX,
				// 	-offsetHandToCenterY,
				// 	imageEl.width * scaled,
				// 	imageEl.height * scaled,
				// );

				// canvasContext.restore();
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
					color: isRightHand ? '#00FF00' : '#FF0000',
					fillColor: isRightHand ? '#FF0000' : '#00FF00',
					lineWidth: 5,
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

				// if (label !== currentHandLabel) {
				// 	currentHandLabel = label;
				// }
			});
		} else {
			activeImage = '';
			// currentHandLabel = 'None';
		}
	};

	const render = async () => {
		// Stuff to do here
		await mediaHands.send({ image: videoEl });

		setTimeout(render, 1000 / 12);
	};

	const initCanvas = () => {
		// let type = 'WebGL';

		// if (!PIXI.utils.isWebGLSupported()) {
		// 	type = 'canvas';
		// }

		PixiApp = new PIXI.Application({
			view: canvasEl,
			width: 800, // default: 800
			height: 600, // default: 600
			antialias: true, // default: false
			backgroundColor: 0xbbf2b5,
			// resolution: window.devicePixelRatio || 1,
			// backgroundColor: 0x090f15,
			resizeTo: window,
		});

		imageContainer = new PIXI.Container();
		PixiApp.stage.addChild(imageContainer);

		// PixiApp.renderer.view.style.position = 'absolute';
		// PixiApp.renderer.view.style.display = 'block';
		// PixiApp.renderer.autoResize = true;
		// PixiApp.renderer.resize(window.innerWidth, window.innerHeight);

		let draw = () => {
			PixiApp.renderer.render(PixiApp.stage);
			window.requestAnimationFrame(draw);
		};
		draw();
	};

	onMount(() => {
		initCanvas();
		addFilterLayer();

		canvasContext = canvasEl.getContext('2d');
		handCanvasContext = handCanvasEl.getContext('2d');

		mediaHands.onResults(handleHandsResults);

		render();

		// let img1 = PIXI.Sprite.from('/images_compressed/10.jpg');
		// img1.height = 800;
		// img1.width = 600;
		// img1.position.x = 75;
		// img1.position.y = 50;
		// imageContainer.addChild(img1);

		// let img2 = PIXI.Sprite.from('/images_compressed/12.jpg');
		// img2.height = 800;
		// img2.width = 600;
		// img2.position.x = 125;
		// img2.position.y = 50;
		// img2.alpha = 0;
		// imageContainer.addChild(img2);
		// console.log('img2:', img2);

		// tl = anime.timeline({
		// 	easing: 'easeOutExpo',
		// 	duration: 1750,
		// });

		// tl.add({
		// 	targets: displacementFilter.scale,
		// 	y: 0.1,
		// 	x: 0.1,
		// });

		// tl.add({
		// 	targets: displacementFilter.scale,
		// 	y: 600,
		// 	x: 0.1,
		// });

		// //add filters
		// let displacementSprite = PIXI.Sprite.from('/displacementMap.jpg');
		// displacementSprite.width = app.renderer.width * 1.5;
		// displacementSprite.height = app.renderer.height * 1.5;
		// let displacementFilter = new PIXI.filters.DisplacementFilter(displacementSprite);
		// displacementFilter.scale.set(0.1);
		// displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

		// app.stage.addChild(displacementSprite);
		// container.filters = [displacementFilter];
		// app.stage.addChild(container);
	});
</script>

<div class="container">
	<img bind:this={imageEl} src={activeImage} />

	<canvas class="main-canvas" bind:this={canvasEl} />

	<aside class="hand-canvas-container">
		<!-- <p>{currentHandLabel === 'None' ? 'Raise Your Hand' : 'Your Hand:'}</p> -->
		<canvas class="hand-canvas" bind:this={handCanvasEl} />
	</aside>

	<!-- <img src="/images-coco-final/10.jpg" alt=""> -->
	<!-- <img src="/images-coco-final/11.jpg" alt=""> -->
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
