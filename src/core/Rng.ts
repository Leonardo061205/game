export interface RandomSource {
  next(): number;
  pickWeighted<T extends { weight: number }>(items: T[]): T | undefined;
}

export class SeededRng implements RandomSource {
  private state: number;

  public constructor(seed = 123456789) {
    this.state = seed >>> 0;
  }

  public next(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  public pickWeighted<T extends { weight: number }>(items: T[]): T | undefined {
    if (items.length === 0) return undefined;
    const total = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
    if (total <= 0) return items[0];
    let cursor = this.next() * total;
    return items.find((item) => {
      cursor -= Math.max(0, item.weight);
      return cursor < 0;
    }) ?? items[items.length - 1];
  }
}
