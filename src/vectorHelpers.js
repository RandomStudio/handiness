export const getVec2Distance = (vec1, vec2) => Math.sqrt(Math.pow((vec1[0] - vec2[0]), 2) + Math.pow((vec1[1] - vec2[1]), 2));

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

	// Starting from the tip - walk to closest edge (either 0 or 1)
	const closestDirectionEdge = vec1.slice(0, vec1.length);

	// If both x and y are still iwthin [0, 1] range
	while (closestDirectionEdge[0] > 0 && closestDirectionEdge[0] < 1 && closestDirectionEdge[1] > 0 && closestDirectionEdge[1] < 1) {
		closestDirectionEdge[0] += diffSteps[0];
		closestDirectionEdge[1] += diffSteps[1];
	}

	return closestDirectionEdge;
}


// Source: https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#comment-19248344
// Check and return the intersection vec if any
// Of 2 lines consisting of 2 vectors
export const getIntersectionPoint = (p0, p1, p2, p3) => {
	// console.info('Line 1', p0, p1);
	// console.info('line 2', p2,p3)
    // Diff between start and end of line

	const s10_x = p1[0] - p0[0];
    const s10_y = p1[1] - p0[1];
    const s32_x = p3[0] - p2[0];
    const s32_y = p3[1] - p2[1];
	
    const denom = s10_x * s32_y - s32_x * s10_y;
	
    if(denom === 0) {
        return false;
    }
	
    const denom_positive = denom > 0;
    const s02_x = p0[0] - p2[0];
    const s02_y = p0[1] - p2[1];
    const s_numer = s10_x * s02_y - s10_y * s02_x;
	

	
    if((s_numer < 0) == denom_positive) {
        return false;
    }
	
    const t_numer = s32_x * s02_y - s32_y * s02_x;
	
	
    if((t_numer < 0) == denom_positive) {
        return false;
    }
	
    if((s_numer > denom) == denom_positive || (t_numer > denom) == denom_positive) {
        return false;
    }
	
    const t = t_numer / denom;
    // const p = {x: p0[0] + (t * s10_x), y: p0[1] + (t * s10_y)};
    const p = [p0[0] + (t * s10_x), p0[1] + (t * s10_y)];
	
    return p;
}