export type AvailabilityType = 'now' | 'scheduled' | 'soon' | 'offline';

export type DiscordStatus = 'in_voice' | 'joining' | 'offline';

export type GameId = 'r6_siege' | 'cs2' | 'valorant' | 'rocket_league' | 'other';

export interface GameInfo {
  id: GameId;
  name: string;
  shortName: string;
  tagline: string;
  coverImage: string;
  accentColor: string;
  maxSquad: number;
  availableModes: string[];
}

export interface PlayerStatus {
  id: string;
  name: string;
  avatar: string; // operator icon or avatar ID
  color: string;
  availability: AvailabilityType;
  scheduledTime?: string; // e.g. "22:30" or ISO string or "Hoy 23:00"
  scheduledDate?: string; // e.g. "Hoy", "Mañana", "2026-08-27"
  discordStatus: DiscordStatus;
  discordChannel?: string;
  gameId: GameId;
  gameMode?: string;
  customNote?: string;
  updatedAt: string; // ISO string
}

export interface AppState {
  players: PlayerStatus[];
  discordInviteUrl: string;
  activeGameId: GameId;
  lastUpdated: string;
}

export const GAMES_CATALOG: GameInfo[] = [
  {
    id: 'r6_siege',
    name: "Tom Clancy's Rainbow Six Siege",
    shortName: 'R6 Siege',
    tagline: 'Táctico 5v5 - Destrucción y Operadores',
    coverImage: '/r6-cover.svg',
    accentColor: '#f39c12',
    maxSquad: 5,
    availableModes: ['Ranked 🏆', 'Standard 🛡️', 'Quick Match ⚡', 'Arcade 🎯'],
  },
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    shortName: 'CS2',
    tagline: 'Competitivo 5v5 Premier',
    coverImage: '/cs2-cover.svg',
    accentColor: '#de9b35',
    maxSquad: 5,
    availableModes: ['Premier 🏆', 'Competitivo 🎯', 'Casual 🎮'],
  },
  {
    id: 'valorant',
    name: 'VALORANT',
    shortName: 'Valorant',
    tagline: 'Shooter táctico 5v5 con habilidades',
    coverImage: '/val-cover.svg',
    accentColor: '#ff4655',
    maxSquad: 5,
    availableModes: ['Competitivo 🏆', 'Unrated 🛡️', 'Swiftplay ⚡'],
  },
  {
    id: 'rocket_league',
    name: 'Rocket League',
    shortName: 'Rocket League',
    tagline: 'Fútbol con autos 3v3',
    coverImage: '/rl-cover.svg',
    accentColor: '#0088ff',
    maxSquad: 3,
    availableModes: ['Ranked 3v3 🏆', 'Ranked 2v2 🥈', 'Casual 🎮'],
  },
];
