import charactersJson from './characters.json';
import eventsJson from './events/monitor.json';
import type { CharacterData } from '../types/characters';
import type { GameEvent } from '../types/game';
import { validateEvents } from '../utils/validation';
export const characters = charactersJson as CharacterData[];
validateEvents(eventsJson);
export const events = eventsJson as GameEvent[];
