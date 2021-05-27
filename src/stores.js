import { writable } from 'svelte/store';

export const hasDetectedFirstHand = writable(false);


export const hasIntroTransitionEnded = writable(false);
export const hasExperienceStarted = writable(false);
export const isLoaderFlow = writable(false);

function createLoadedFilesCount() {
	const { subscribe, set, update } = writable(0);

	return {
		subscribe,
		increment: () => update(n => n + 1),
	};
}

export const loadedFilesCount = createLoadedFilesCount();