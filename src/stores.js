import { writable } from 'svelte/store';

export const hasDetectedFirstHand = writable(false);


export const hasIntroTransitionEnded = writable(false);