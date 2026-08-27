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
    accentColor: '#FF1D25',
    maxSquad: 5,
    availableModes: ['Ranked 🏆', 'Turbo ⚡', 'All Pick ⚔️'],
    statusBadge: 'unclassified',
    badgeLabel: 'JAMÁS 🚫',
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

export type RewardType = 'title' | 'skin' | 'sound' | 'operator' | 'frame' | 'badge' | 'effect';
export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface BattlePassReward {
  id: string;
  name: string;
  type: RewardType;
  icon: string;
  rarity: RewardRarity;
  description: string;
  value?: string;
  previewImage?: string;
}

export interface BattlePassTier {
  tier: number;
  requiredXP: number;
  reward: BattlePassReward;
}

export interface BattlePassMission {
  id: string;
  title: string;
  description: string;
  xp: number;
  category: 'daily' | 'weekly' | 'squad';
  icon: string;
  target: number;
  currentProgress?: number;
}

export interface BattlePassState {
  currentXP: number;
  level: number;
  claimedTiers: number[];
  claimedMissions: string[];
  equippedTitle: string;
  equippedFrame: string;
  lastDailyDate?: string;
}

export const BATTLE_PASS_TIERS: BattlePassTier[] = [
  {
    tier: 1,
    requiredXP: 200,
    reward: {
      id: 'reward_t1',
      name: 'Título: [PUNTUAL]',
      type: 'title',
      icon: '🏅',
      rarity: 'common',
      description: 'Demuestra que nunca llegas tarde al squad cuando dicen YA.',
      value: 'PUNTUAL',
    },
  },
  {
    tier: 2,
    requiredXP: 500,
    reward: {
      id: 'reward_t2',
      name: 'Marco: Neón Cyber',
      type: 'frame',
      icon: '⚡',
      rarity: 'rare',
      description: 'Borde de tarjeta con destellos de cian láser de alta velocidad.',
      value: 'frame-neon-cyan',
    },
  },
  {
    tier: 3,
    requiredXP: 900,
    reward: {
      id: 'reward_t3',
      name: 'Efecto: Láser Lime',
      type: 'effect',
      icon: '✨',
      rarity: 'rare',
      description: 'Resplandor verde táctico activo en tus acciones y confirmaciones.',
      value: 'effect-laser-lime',
    },
  },
  {
    tier: 4,
    requiredXP: 1400,
    reward: {
      id: 'reward_t4',
      name: 'Título: [CARREADOR NATO]',
      type: 'title',
      icon: '🎯',
      rarity: 'epic',
      description: 'Para los que cargan al equipo en los momentos decisivos.',
      value: 'CARREADOR NATO',
    },
  },
  {
    tier: 5,
    requiredXP: 2000,
    reward: {
      id: 'reward_t5',
      name: 'Operador Mítico: AEGIS',
      type: 'operator',
      icon: '🛡️',
      rarity: 'mythic',
      description: 'The Last Wall. "The more you hurt him, the harder he hits back."',
      value: 'AEGIS',
      previewImage: '/Uandi.webp',
    },
  },
  {
    tier: 6,
    requiredXP: 2700,
    reward: {
      id: 'reward_t6',
      name: 'Marco: Furia Carmesí',
      type: 'frame',
      icon: '🔥',
      rarity: 'epic',
      description: 'Aura ardiente inspirada en el poder destructivo de Aegis.',
      value: 'frame-crimson-fury',
    },
  },
  {
    tier: 7,
    requiredXP: 3500,
    reward: {
      id: 'reward_t7',
      name: 'Título: [THE LAST WALL]',
      type: 'title',
      icon: '🧱',
      rarity: 'legendary',
      description: 'El escudo impenetrable del escuadrón.',
      value: 'THE LAST WALL',
    },
  },
  {
    tier: 8,
    requiredXP: 4400,
    reward: {
      id: 'reward_t8',
      name: 'Sonido: Protocolo Asalto',
      type: 'sound',
      icon: '🔊',
      rarity: 'epic',
      description: 'Efecto de audio militar al marcar disponibilidad inmediata.',
      value: 'sound-assault-protocol',
    },
  },
  {
    tier: 9,
    requiredXP: 5400,
    reward: {
      id: 'reward_t9',
      name: 'Título: [CAPITÁN DEL DESCONTROL]',
      type: 'title',
      icon: '👑',
      rarity: 'legendary',
      description: 'Iniciador oficial de las trasnochadas de ranked.',
      value: 'CAPITÁN DEL DESCONTROL',
    },
  },
  {
    tier: 10,
    requiredXP: 6500,
    reward: {
      id: 'reward_t10',
      name: 'Corona Mítica: Golden Vanguard',
      type: 'frame',
      icon: '🏆',
      rarity: 'mythic',
      description: 'Insignia y marco dorado definitivo de la Temporada 1.',
      value: 'frame-golden-vanguard',
    },
  },
];

export const BATTLE_PASS_MISSIONS: BattlePassMission[] = [
  {
    id: 'mission_daily_login',
    title: 'Pase de Lista Diario',
    description: 'Abre la app e interactúa con el radar del squad hoy.',
    xp: 200,
    category: 'daily',
    icon: '📅',
    target: 1,
  },
  {
    id: 'mission_ready_now',
    title: '¡Entrando YA!',
    description: 'Presiona el botón de estado YA para avisar a tus compañeros.',
    xp: 150,
    category: 'daily',
    icon: '⚡',
    target: 1,
  },
  {
    id: 'mission_select_character',
    title: 'Identificación Táctica',
    description: 'Selecciona tu operador en el selector ¿Q-SOS?.',
    xp: 100,
    category: 'daily',
    icon: '👤',
    target: 1,
  },
  {
    id: 'mission_scheduled_entry',
    title: 'Coordinación Horaria',
    description: 'Programa una hora de juego o aviso de 30 minutos.',
    xp: 150,
    category: 'daily',
    icon: '🕒',
    target: 1,
  },
  {
    id: 'mission_custom_note',
    title: 'Comms de Escuadrón',
    description: 'Deja una nota o mensaje táctico en tu estado.',
    xp: 120,
    category: 'weekly',
    icon: '💬',
    target: 1,
  },
  {
    id: 'mission_full_squad',
    title: 'Squad Completo (5/5)',
    description: 'Consigue que el escuadrón alcance 5 jugadores listos.',
    xp: 500,
    category: 'squad',
    icon: '🛡️',
    target: 1,
  },
  {
    id: 'mission_ace_clutch',
    title: 'Clutch de Fin de Semana',
    description: 'Participa en la sesión de Rankeds de fin de semana con el squad.',
    xp: 350,
    category: 'weekly',
    icon: '🎯',
    target: 1,
  },
  {
    id: 'mission_aegis_tribute',
    title: 'Protocolo The Last Wall',
    description: 'Juega o selecciona al nuevo operador Aegis en tu perfil.',
    xp: 300,
    category: 'squad',
    icon: '🔥',
    target: 1,
  },
];

