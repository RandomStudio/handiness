

const initCamera = (videoEl) => {
	const constraints = {
		video: {
			width: 1280,
			height: 720,
			// width: 960,
			// height: 540,
			// width: 720,
			// height: 480,
		},
		audio: false,
		facingMode: 'user', // environment
	};

	if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
		// const devices = navigator.mediaDevices.enumerateDevices().then((res) => {
		// 	console.log(res);
		// });

		// console.log(devices);

		return navigator.mediaDevices
			.getUserMedia(constraints)
			.then(stream => {
				videoEl.srcObject = stream;
				return { succes: true };
			})
			.catch(error => {
				console.error(error);
				return { succes: false };
			});
	}
}

export default initCamera;