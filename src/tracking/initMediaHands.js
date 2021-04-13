import '@mediapipe/hands/hands';

import { loadedFilesCount } from '../stores';

const initMediaHands = () => {
	const hands = new Hands({
		locateFile: (file) => {
			loadedFilesCount.increment();
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