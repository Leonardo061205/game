import type { CircleId } from './game';
export interface CharacterData {
  id: string;
  name: string;
  circle: CircleId;
  difficulty: number;
  energy: number;
  morale: number;
  suspicion: number;
  money: number;
  description: string;
}
