import '@mediapipe/hands/hands';
import '@mediapipe/drawing_utils/drawing_utils';

const initMediaHands = () => {
	const hands = new Hands({
		locateFile: (file) => {
			// return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
			return `/@mediapipe/hands/${file}`;
		}
	});

	hands.setOptions({
		selfieMode: true,
		maxNumHands: 1,
		minDetectionConfidence: 0.75,
		minTrackingConfidence: 0.75
	});


	// const camera = new Camera(videoElement, {
	// 	onFrame: async () => {
	// 		await hands.send({ image: videoElement })
	// 	},
	// 	width: 1280,
	// 	height: 720,
	// });

	// camera.start();

	return hands;
}

export default initMediaHands;