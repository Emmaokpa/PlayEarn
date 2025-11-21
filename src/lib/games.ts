
import { Game } from './data';
import gamesData from './games-data.json';

// Since the JSON file is now the source of truth, we typecast it directly.
// You can add validation logic here in the future if needed.
const games: Game[] = gamesData as Game[];

export function getAllGames(): Game[] {
  return games;
}

export function getGameById(id: string): Game | undefined {
  return games.find((game) => game.id === id);
}
