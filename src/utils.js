import similarity from 'compute-cosine-similarity';
import VPTreeFactory from 'vptree';
// Source: https://medium.com/tensorflow/move-mirror-an-ai-experiment-with-pose-estimation-in-the-browser-using-tensorflow-js-2f7b769f9b23
// Cosine similarity as a distance function. The lower the number, the closer
// the match
// vec1 and vec2 are a NOT L2 normalized 42-float vectors (21 keypoints each  
// with an x and y. 21 * 2 = 42)
export const cosineDistanceMatching = (vec1, vec2) => {
	const cosineSimilarity = similarity(vec1, vec2);
	const distance = 2 * (1 - cosineSimilarity);

	// console.log(vec1, vec2, distance, cosineSimilarity);

	return Math.sqrt(distance);
}

export const getVec2Distance = (x1, x2, y1, y2) => Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));


let vptree; // where we’ll store a reference to our vptree

export function buildVPTree(poseData) {
	// Initialize our vptree with our images’ pose data and a distance function
	// vptree = VPTreeFactory.build(poseData, cosineDistanceMatching);
	vptree = VPTreeFactory.build(poseData, findMostDistanceSimilar);
}

const findMostDistanceSimilar = (vec1, vec2) => {
	// vec1 is own input [...] - hadn from mp
	// vec2 is from dataset [...]


	// console.log(vec1, vec2);

	if (!vec1.length) {
		return null;
	}

	if (vec1.length === vec2.length) {
		// Get total average distance of the whole
		// Our case being a index finger
		const distanceSimilarity = [];
		let t = 0;
		let y = 0;


		for (let index = 0; index < 4; index++) {
			const v1x = vec1[index];
			const v1y = vec1[index] * 2 + 1;
			const v2x = vec2[index];
			const v2y = vec2[index] * 2 + 1;


			// vec1.map((v1, index) => Math.pow(v1 - vec2[index], 2));


			const distance = Math.sqrt(Math.pow((v1x - v2x), 2) + Math.pow((v1y - v2y), 2));

			distanceSimilarity.push(distance);
			t += distance;
			y += Math.pow((v1x - v2x), 2) + Math.pow((v1y - v2y), 2);
		}

		// console.info(distanceSimilarity, t, t / 4, y, y / 4)
		// console.info(y, y / 4, Math.sqrt(y));
		// console.info(t, t / 4);

		return t / 4;


	} else {
		// Ambiguous error 
		throw new Error('Inputs do not have the same length');
	}



}

export const findMostSimilarMatch = (userPose) => {
	// search the vp tree for the image pose that is nearest (in cosine distance) to userPose
	let nearestImage = vptree.search(userPose);

	console.info(nearestImage[0]) // cosine distance value of the nearest match

	// return index (in relation to poseData) of nearest match. 
	return nearestImage[0].i;
}

// Build the tree once
// buildVPTree();

// Then for each input user pose
// let currentUserPose = [...] // an L2 normalized vector representing a user pose. 34-float array (17 keypoints x 2).  
// let closestMatchIndex = findMostSimilarMatch(currentUserPose);
// let closestMatch = poseData[closestMatchIndex];