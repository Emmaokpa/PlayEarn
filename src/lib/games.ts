import type { Game } from './data';

// A static list of games. This removes the dependency on the problematic JSON file.
const allGames: Game[] = [
    {
        id: '110265',
        name: 'Hazmob FPS: Online Shooter',
        category: 'Shooter',
        iframeUrl: 'https://playgama.com/export/game/hazmob-fps-online-shooter?clid=p_8dff5bc5-ea62-4191-84ce-5f9c816cd09c',
        imageUrl: `https://picsum.photos/seed/hazmob/400/533`,
        imageHint: 'online shooter'
    },
    {
        id: '2',
        name: 'Asphalt Racing',
        category: 'Racing',
        iframeUrl: 'https://www.addictinggames.com/embed/html5-games/23668',
        imageUrl: `https://picsum.photos/seed/racing/400/533`,
        imageHint: 'car racing'
    },
    {
        id: '3',
        name: 'Bubble Woods',
        category: 'Puzzle',
        iframeUrl: 'https://www.addictinggames.com/embed/html5-games/23647',
        imageUrl: `https://picsum.photos/seed/puzzle/400/533`,
        imageHint: 'bubble shooter'
    },
    {
        id: '4',
        name: 'Moto X3M',
        category: 'Stunts',
        iframeUrl: 'https://www.addictinggames.com/embed/html5-games/23659',
        imageUrl: `https://picsum.photos/seed/moto/400/533`,
        imageHint: 'motorcycle stunt'
    },
     {
        id: '5',
        name: 'Chess',
        category: 'Strategy',
        iframeUrl: 'https://www.addictinggames.com/embed/html5-games/23650',
        imageUrl: `https://picsum.photos/seed/chess/400/533`,
        imageHint: 'chess game'
    },
     {
        id: '6',
        name: 'Tiny Fishing',
        category: 'Arcade',
        iframeUrl: 'https://www.addictinggames.com/embed/html5-games/24855',
        imageUrl: `https://picsum.photos/seed/fishing/400/533`,
        imageHint: 'fishing arcade'
    }
];


export function getAllGames(): Game[] {
  return allGames;
}

export function getGameById(id: string): Game | undefined {
  return allGames.find((game) => game.id === id);
}
