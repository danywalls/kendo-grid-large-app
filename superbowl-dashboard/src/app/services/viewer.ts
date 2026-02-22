import { Injectable } from "@angular/core";

export interface Viewer {
    id: number;
    username: string;
    watchTimeMin: number;
    isLive: boolean;
}

const ADJECTIVES = ["Swift", "Lucky", "Bold", "Chill", "Epic", "Wild", "Cool", "Fast"];
const NOUNS = ["Fan", "Eagle", "Tiger", "Bear", "Wolf", "Hawk", "Fox", "Shark"];

@Injectable({ providedIn: "root" })
export class ViewerService {
    /**
     * Generates a list of viewers locally.
     * Useful for basic virtualization examples.
     */
    getViewers(count: number, startId = 0): Viewer[] {
        return Array.from({ length: count }, (_, i) => ({
            id: startId + i + 1,
            username: `${this.random(ADJECTIVES)}${this.random(NOUNS)}${Math.floor(Math.random() * 9999)}`,
            watchTimeMin: Math.floor(Math.random() * 240) + 1,
            isLive: Math.random() > 0.08,
        }));
    }

    /**
     * Simulates an API call with a network delay.
     * Perfect for server-side virtual scrolling.
     */
    async fetchPage(skip: number, take: number, abortSignal?: AbortSignal): Promise<Viewer[]> {
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, 80);
            abortSignal?.addEventListener("abort", () => {
                clearTimeout(timeout);
                reject(new DOMException("Aborted", "AbortError"));
            });
        });

        return this.getViewers(take, skip);
    }

    private random(arr: string[]): string {
        return arr[Math.floor(Math.random() * arr.length)];
    }
}
