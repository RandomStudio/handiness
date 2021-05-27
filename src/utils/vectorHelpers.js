export const getVec2Distance = (vec1, vec2) => Math.sqrt(Math.pow((vec1[0] - vec2[0]), 2) + Math.pow((vec1[1] - vec2[1]), 2));

export const getVec2Dot = (vec1, vec2) => {
	const x = vec1[0] * vec2[0];
	const y = vec1[1] * vec2[1];

	return x + y; // Radians
}

export const getVec2Difference = (vec1, vec2) => {
	const diffX = vec2[0] - vec1[0];
	const diffY = vec2[1] - vec1[1];

	const diff = [diffX, diffY];

	return diff;
}

export const getVec2DirectionEdge = (vec1, vec2) => {
	// get difference of first joint and tip
	const diffSteps = getVec2Difference(vec1, vec2);

	// Starting from the tip - walk to closest edge (either 0 or 1)
	const closestDirectionEdge = vec1.slice(0, vec1.length);

	// If both x and y are still iwthin [0, 1] range
	while (closestDirectionEdge[0] > 0 && closestDirectionEdge[0] < 1 && closestDirectionEdge[1] > 0 && closestDirectionEdge[1] < 1) {
		closestDirectionEdge[0] += diffSteps[0];
		closestDirectionEdge[1] += diffSteps[1];
	}

	return closestDirectionEdge;
}
