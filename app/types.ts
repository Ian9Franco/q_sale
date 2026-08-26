export type AvailabilityType = 'now' | 'scheduled' | 'soon' | 'offline';

export type DiscordStatus = 'in_voice' | 'joining' | 'offline';

export type GameId = 'r6_siege' | 'dota_2' | 'minecraft';

export interface GameInfo {
  id: GameId;
  name: string;
  shortName: string;
  tagline: string;
  coverImage?: string;
  accentColor: string;
  maxSquad: number;
  availableModes: string[];
  statusBadge: 'active' | 'unclassified' | 'coming_soon';
  badgeLabel: string;
  isSelectable: boolean;
}

export interface PlayerStatus {
  id: string;
  name: string;
  avatar: string; // operator icon or avatar ID
  color: string;
  availability: AvailabilityType;
  scheduledTime?: string;
  scheduledDate?: string;
  discordStatus: DiscordStatus;
  discordChannel?: string;
  gameId: GameId;
  gameMode?: string;
  customNote?: string;
  updatedAt: string;
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
    tagline: 'Táctico 5v5 - Destrucción y Operadores (Juego Oficial)',
    coverImage: '/r6-cover.svg',
    accentColor: '#ff9f1c',
    maxSquad: 5,
    availableModes: ['Ranked 🏆', 'Standard 🛡️', 'Quick Match ⚡', 'Arcade 🎯'],
    statusBadge: 'active',
    badgeLabel: 'OFICIAL / ACTIVO 🎯',
    isSelectable: true,
  },
  {
    id: 'dota_2',
    name: 'Dota 2',
    shortName: 'Dota 2',
    tagline: 'MOBA 5v5 - Clasificación no oficial del grupo',
    accentColor: '#e74c3c',
    maxSquad: 5,
    availableModes: ['Ranked 🏆', 'Turbo ⚡', 'All Pick ⚔️'],
    statusBadge: 'unclassified',
    badgeLabel: 'DESCLASIFICADO ⚠️',
    isSelectable: false,
  },
  {
    id: 'minecraft',
    name: 'Minecraft',
    shortName: 'Minecraft',
    tagline: 'Survival / Servidor dedicado del Squad',
    accentColor: '#2ecc71',
    maxSquad: 10,
    availableModes: ['Survival 🌲', 'Hardcore 💀', 'Creativo 🧱'],
    statusBadge: 'coming_soon',
    badgeLabel: 'PRÓXIMAMENTE ⏳',
    isSelectable: false,
  },
];
