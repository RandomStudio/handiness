import '@mediapipe/hands/hands';
// import '@mediapipe/drawing_utils/drawing_utils';

import { loadedFilesCount } from '../stores';

const initMediaHands = () => {
	const hands = new Hands({
		locateFile: (file) => {
			// console.log('xc', file);
			loadedFilesCount.increment();

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

	return hands;
}

export default initMediaHands;