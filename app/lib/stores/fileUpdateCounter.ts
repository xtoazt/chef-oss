import { useStore } from "@nanostores/react";
import { atom } from "nanostores";

const fileUpdateCounter = atom(0);

let currentTimer: NodeJS.Timeout | null = null;
let lastUpdated = 0;
const DEBOUNCE_TIME = 1000;

export function useFileUpdateCounter() {
    return useStore(fileUpdateCounter);
}

export function getFileUpdateCounter() {
    return fileUpdateCounter.get();
}

export function incrementFileUpdateCounter(path: string) {
    if (path.startsWith('/home/project/dist/')) {
        return;
    }
    if (currentTimer) {
        return;
    }
    const now = Date.now();
    const nextUpdate = lastUpdated + DEBOUNCE_TIME;
    if (now < nextUpdate) {
        currentTimer = setTimeout(update, nextUpdate - now);
        return;
    }
    update();
}

function update() {
    fileUpdateCounter.set(fileUpdateCounter.get() + 1);
    lastUpdated = Date.now();
    currentTimer = null;
}