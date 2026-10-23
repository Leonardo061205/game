import type { Comparison } from '../types/game';

export function compare(left: number, op: Comparison, right: number): boolean {
  switch (op) {
    case 'eq': return left === right;
    case 'neq': return left !== right;
    case 'gte': return left >= right;
    case 'lte': return left <= right;
    case 'gt': return left > right;
    case 'lt': return left < right;
  }
}
