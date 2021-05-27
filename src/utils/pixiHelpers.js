import anime from 'animejs/lib/anime.es.js';

export const animateMaskTransition = ({
	displacementFilter,
	duration,
	initialImage,
	targetImage,
	callback,
	scaleTargets = {
		x: 0.1,
		y: 0.1
	}
}) => {
	const animDuration = duration || 800;

	const transitionTimeline = anime.timeline({
		easing: 'easeOutExpo',
		duration: animDuration,
	});


	transitionTimeline.add(
		{
			targets: displacementFilter.scale,
			x: Math.floor(Math.max(100, Math.random() * 800)),
			y: Math.floor(Math.max(100, Math.random() * 800)),
		},
		0,
	);

	transitionTimeline.add(
		{
			targets: initialImage,
			alpha: 0.75,
		},
		animDuration * 0.5,
	);

	transitionTimeline.add(
		{
			targets: targetImage,
			alpha: [0, 1],
		},
		animDuration * 0.5,
	);

	transitionTimeline.add(
		{
			targets: displacementFilter.scale,
			y: scaleTargets.x,
			x: scaleTargets.y,
		},
		animDuration * 0.75,
	);

	transitionTimeline.finished.then(() => {
		callback();
	});
}


export const animateSingleMask = ({
	displacementFilter,
	duration,
	targetImage,
	callback,
	scaleTargets = {
		x: 0.1,
		y: 0.1
	}
}) => {
	const animDuration = duration || 800;

	const transitionTimeline = anime.timeline({
		easing: 'easeOutExpo',
		duration: animDuration,
	});


	transitionTimeline.add(
		{
			targets: displacementFilter.scale,
			x: Math.floor(Math.max(100, Math.random() * 800)),
			y: Math.floor(Math.max(100, Math.random() * 800)),
		},
		0,
	);

	transitionTimeline.add(
		{
			targets: targetImage,
			alpha: [0, 1],
		},
		animDuration * 0.025,
	);

	transitionTimeline.add(
		{
			targets: displacementFilter.scale,
			y: scaleTargets.x,
			x: scaleTargets.y,
		},
		animDuration * 0.5,
		);

		transitionTimeline.add(
		{
			targets: targetImage,
			alpha: [1, 0],
		},
		animDuration * 0.975,
	);

	transitionTimeline.finished.then(() => {
		callback();
	});
}

export const getScaleToBoundaries = (image, canvas) => {
	const isPortrait = image.height >= image.width;

	const scaling = isPortrait ? canvas.height / image.height : canvas.width / image.width;

	return scaling;
}