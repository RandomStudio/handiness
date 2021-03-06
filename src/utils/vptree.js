import similarity from 'compute-cosine-similarity';
import VPTreeFactory from 'vptree';

let vptree; // where we’ll store a reference to our vptree


// Source: https://medium.com/tensorflow/move-mirror-an-ai-experiment-with-pose-estimation-in-the-browser-using-tensorflow-js-2f7b769f9b23
// Cosine similarity as a distance function. The lower the number, the closer
// the match
// vec1 and vec2 are a NOT L2 normalized 42-float vectors (21 keypoints each
// with an x and y. 21 * 2 = 42)
export const cosineDistanceMatching = (vec1, vec2) => {
	const cosineSimilarity = similarity(vec1, vec2);
	const distance = 2 * (1 - cosineSimilarity);

	return Math.sqrt(distance);
}

// Looking for closest 1:1 position and orientation on a 1:1 normalized canvas sizing
const findMostDistanceSimilar = (vec1, vec2) => {
	// vec1 is own input [...] - hadn from mp
	// vec2 is from dataset [...]

	if (!vec1.length) {
		return null;
	}

	if (vec1.length === vec2.length) {
		// Get total average distance of the whole
		// Our case being a index finger
		const distanceSimilarity = [];
		let averageDistance = 0;


		for (let index = 0; index < vec1.length; index++) {
			const v1x = vec1[index];
			const v1y = vec1[index] * 2 + 1;
			const v2x = vec2[index];
			const v2y = vec2[index] * 2 + 1;

			const distance = Math.sqrt(Math.pow((v1x - v2x), 2) + Math.pow((v1y - v2y), 2));

			distanceSimilarity.push(distance);
			averageDistance += distance;
		}

		return averageDistance / vec1.length;
	} else {
		// Ambiguous error
		throw new Error('Inputs do not have the same length');
	}
}




export const buildVPTree = (poseData) => {
	// Initialize our vptree with our images’ pose data and a distance function
	vptree = VPTreeFactory.build(poseData, cosineDistanceMatching);
	// vptree = VPTreeFactory.build(poseData, findMostDistanceSimilar);
}


export const findMostSimilarMatch = (userPose) => {
	// search the vp tree for the image pose that is nearest (in cosine distance) to userPose
	let nearestImage = vptree.search(userPose);

	if (nearestImage) {
		return nearestImage[0];
	}

	return false;
}
