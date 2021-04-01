const hand_landmarks = {
	root: 0,
	thumb: [1, 2, 3, 4],
	index: [5, 6, 7, 8],
	middle: [9, 10, 11, 12],
	ring: [13, 14, 15, 16],
	pinky: [17, 18, 19, 20]
}

// Expecting a Pixi.js Graphics object & Landmarks (single side)
export const drawCustomHands = (canvasDimensions, drawCanvas, landmarks) => {
	const { width: cWidth, height: cHeight } = canvasDimensions;

	drawCanvas.lineStyle(40, 0xffffff, 1);

	// Draw fingers starting from wrist point
	drawCanvas.moveTo(landmarks[hand_landmarks.root].x * cWidth, landmarks[hand_landmarks.root].y * cHeight);
	hand_landmarks.thumb.forEach(mark => {
		drawCanvas.lineTo(landmarks[mark].x * cWidth, landmarks[mark].y * cHeight)
	});


	drawCanvas.moveTo(landmarks[hand_landmarks.root].x * cWidth, landmarks[hand_landmarks.root].y * cHeight);
	hand_landmarks.index.forEach(mark => {
		drawCanvas.lineTo(landmarks[mark].x * cWidth, landmarks[mark].y * cHeight)
	});


	drawCanvas.moveTo(landmarks[hand_landmarks.root].x * cWidth, landmarks[hand_landmarks.root].y * cHeight);
	hand_landmarks.middle.forEach(mark => {
		drawCanvas.lineTo(landmarks[mark].x * cWidth, landmarks[mark].y * cHeight)
	});
	

	drawCanvas.moveTo(landmarks[hand_landmarks.root].x * cWidth, landmarks[hand_landmarks.root].y * cHeight);
	hand_landmarks.ring.forEach(mark => {
		drawCanvas.lineTo(landmarks[mark].x * cWidth, landmarks[mark].y * cHeight)
	});


	drawCanvas.moveTo(landmarks[hand_landmarks.root].x * cWidth, landmarks[hand_landmarks.root].y * cHeight);
	hand_landmarks.pinky.forEach(mark => {
		drawCanvas.lineTo(landmarks[mark].x * cWidth, landmarks[mark].y * cHeight)
	});
	
	// Finger connectors on palm
	drawCanvas.moveTo(landmarks[hand_landmarks.index[0]].x * cWidth, landmarks[hand_landmarks.index[0]].y * cHeight);
	drawCanvas.lineTo(landmarks[hand_landmarks.middle[0]].x * cWidth, landmarks[hand_landmarks.middle[0]].y * cHeight)
	drawCanvas.lineTo(landmarks[hand_landmarks.ring[0]].x * cWidth, landmarks[hand_landmarks.ring[0]].y * cHeight)
	drawCanvas.lineTo(landmarks[hand_landmarks.pinky[0]].x * cWidth, landmarks[hand_landmarks.pinky[0]].y * cHeight)
}

export const vulgarityDetection = (landmarks) => {
	// state: -1 = unknown, 0 = close, 1 = open

	// Naive implementation using the wrist as reference
	// To infer whether the hand is pointing up or downwards
	const wrist = landmarks[0];
	const handIsPointingUp = wrist.y > landmarks[6].y; // Can be any connecting joint on the hand
	const r = {};

	if (handIsPointingUp) {
		if (landmarks[6].y > landmarks[7].y && landmarks[7].y > landmarks[8].y) {
			r.index_state = 1;
		} else if (landmarks[6].y < landmarks[8].y) {
			r.index_state = 0;
		} else {
			r.index_state = -1;
		}

		if (landmarks[10].y > landmarks[11].y && landmarks[11].y > landmarks[12].y) {
			r.middle_state = 1;
		} else if (landmarks[10].y < landmarks[12].y) {
			r.middle_state = 0;
		} else {
			r.middle_state = -1;
		}

		if (landmarks[14].y > landmarks[15].y && landmarks[15].y > landmarks[16].y) {
			r.ring_state = 1;
		} else if (landmarks[14].y < landmarks[16].y) {
			r.ring_state = 0;
		} else {
			r.ring_state = -1;
		}

		if (landmarks[18].y > landmarks[19].y && landmarks[19].y > landmarks[20].y) {
			r.pinky_state = 1;
		} else if (landmarks[18].y < landmarks[20].y) {
			r.pinky_state = 0;
		} else {
			r.pinky_state = -1;
		}
	} else {
		if (landmarks[6].y < landmarks[7].y && landmarks[7].y < landmarks[8].y) {
			r.index_state = 1;
		} else if (landmarks[6].y > landmarks[8].y) {
			r.index_state = 0;
		} else {
			r.index_state = -1;
		}

		if (landmarks[10].y < landmarks[11].y && landmarks[11].y < landmarks[12].y) {
			r.middle_state = 1;
		} else if (landmarks[10].y > landmarks[12].y) {
			r.middle_state = 0;
		} else {
			r.middle_state = -1;
		}

		if (landmarks[14].y < landmarks[15].y && landmarks[15].y < landmarks[16].y) {
			r.ring_state = 1;
		} else if (landmarks[14].y > landmarks[16].y) {
			r.ring_state = 0;
		} else {
			r.ring_state = -1;
		}

		if (landmarks[18].y < landmarks[19].y && landmarks[19].y < landmarks[20].y) {
			r.pinky_state = 1;
		} else if (landmarks[18].y > landmarks[20].y) {
			r.pinky_state = 0;
		} else {
			r.pinky_state = -1;
		}
	}

	if (r.index_state === 0 && r.middle_state === 1 && r.ring_state === 0 && r.pinky_state === 0) {
		return true;
	}

	return false;
};