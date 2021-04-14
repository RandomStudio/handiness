const initCamera = (videoEl) => {
	const constraints = {
		video: {
			width: 1280,
			height: 720,
		},
		audio: false,
		facingMode: 'user', // environment
	};

	if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
		return navigator.mediaDevices
			.getUserMedia(constraints)
			.then(stream => {
				videoEl.srcObject = stream;
				return { success: true };
			})
			.catch(error => {
				console.error(error);
				return { success: false };
			});
	}
}

export default initCamera;