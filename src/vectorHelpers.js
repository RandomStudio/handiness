export const getVec2Distance = (x1, x2, y1, y2) => Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));

export const getVec2Dot = (vec1, vec2) => {
	const x = vec1[0] * vec2[0];
	const y = vec1[1] * vec2[1];

	// cos angle - already in radians?
	return x + y; // Radians returned if im right
}

export const getVec2Difference = (vec1, vec2) => {
	const diffX = vec2[0] - vec1[0];
	const diffY = vec2[1] - vec1[1];

	const diff = [diffX, diffY];

	return diff;
	// technically always 90degrees
}

export const getVec2DirectionEdge = (vec1, vec2) => {
	// get difference of first joint and tip
	const diffSteps = getVec2Difference(vec1, vec2);


	// Actually already got the direction due to the diffSteps order of params

	// if diff x is -negative (-)
	// meaning left
	// if positive (+)
	// meaning pointingRight
	const isGoingLeft = diffSteps[0] < 0;
	// if diff y is negative
	// going down
	// if positive
	// going up
	const isGoingDown = diffSteps[1] < 0;

	// Starting from the tip - walk to closest edge (either 0 or 1)
	const closestDirectionEdge = vec1.slice(0, vec1.length);



	// if either x or y is lesser than 0 or greater than 1
	

	

	// if x is not greater than 1 or smaller than 0 - add diffSteps to it
	// if y is not greater than 1 or smaller than 0 - add diffSteps to it
	while (closestDirectionEdge[0] > 0 && closestDirectionEdge[0] < 1 && closestDirectionEdge[1] > 0 && closestDirectionEdge[1] < 1) {
		closestDirectionEdge[0] += diffSteps[0];
		closestDirectionEdge[1] += diffSteps[1];
	}

	// console.info(closestDirectionEdge, vec1, vec2, diffSteps);

	
	return closestDirectionEdge;





	// const originIsLeft = vec1[0] > vec2[0];
	// const originIsHigher = vec1[1] > vec2[1];

	// // if origin is more to left add up - else subtract diff from origin
	// // same for origin beign higher than vec2
	// const pointCX = originIsLeft ? vec1[0] + diffX : vec1[0] - diffX; 
	// const pointCY = originIsHigher ? vec1[1] - diffY : vec1[1] + diffY;

}