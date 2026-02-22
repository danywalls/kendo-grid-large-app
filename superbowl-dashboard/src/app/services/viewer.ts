import { Injectable } from "@angular/core";

export interface Viewer {
  id: number;
  username: string;
  watchTimeMin: number;
  isLive: boolean;
}

export interface PagedResult {
  data: Viewer[];
  total: number;
}

const ADJECTIVES = [
  "Swift",
  "Lucky",
  "Bold",
  "Chill",
  "Epic",
  "Happy",
  "Lazy",
  "Wild",
  "Cool",
  "Fast",
];

const NOUNS = [
  "Fan",
  "Eagle",
  "Tiger",
  "Bear",
  "Wolf",
  "Hawk",
  "Fox",
  "Lion",
  "Shark",
  "Bull",
];

@Injectable({ providedIn: "root" })
export class ViewerService {
  private readonly TOTAL_VIEWERS = 1_000_000;

  generateViewers(count: number): Viewer[] {
    const viewers: Viewer[] = [];

    for (let i = 0; i < count; i++) {
      viewers.push({
        id: i + 1,
        username: `${this.randomFrom(ADJECTIVES)}${this.randomFrom(NOUNS)}${this.randomBetween(1, 9999)}`,
        watchTimeMin: this.randomBetween(1, 240),
        isLive: Math.random() > 0.08,
      });
    }

    return viewers;
  }

  /**
   * Simulates a server API call with pagination.
   * Uses a small delay to mimic real network latency.
   */
  async fetchPage(skip: number, take: number): Promise<PagedResult> {
    await new Promise((resolve) => setTimeout(resolve, 80));

    return {
      data: this.generateViewers(take),
      total: this.TOTAL_VIEWERS,
    };
  }

  private randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
