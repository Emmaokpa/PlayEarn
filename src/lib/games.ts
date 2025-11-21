
import { Game } from './data';
import gamesData from './games-data.json';

// Define a type for the raw game 'hit' from the new JSON structure
type GameHit = {
    id: string;
    title: string;
    genres: string[];
    gameURL: string;
    imageSrc: string;
    tags: string[];
};

// Function to transform the raw 'hit' into our app's 'Game' format
function transformGameData(hit: GameHit): Game {
    return {
        id: hit.id,
        name: hit.title,
        category: hit.genres?.[0] || 'Game', // Use the first genre as the category
        iframeUrl: hit.gameURL,
        imageUrl: hit.imageSrc,
        imageHint: hit.tags?.[0] || 'game', // Use the first tag as the AI hint
    };
}

// Now, we parse the new JSON structure and transform the data
const allGames: Game[] = gamesData.segments
  .flatMap(segment => segment.hits)
  .map(transformGameData);


export function getAllGames(): Game[] {
  return allGames;
}

export function getGameById(id: string): Game | undefined {
  return allGames.find((game) => game.id === id);
}
