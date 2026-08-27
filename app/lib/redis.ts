import Redis from 'ioredis';
import { AppState } from '../types';
import { PushSubscriptionData } from './push';

const REDIS_URL = process.env.REDIS_URL || 'redis://default:IGIBMOOqmXfAd5LggNtNh17iOcemW2Hh@imperishable-ultramodern-microprecise-38428.db.redis.io:19953';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      connectTimeout: 5000,
    });
  }
  return redisClient;
}

const APP_STATE_KEY = 'q_sale:app_state';
const SUBSCRIPTIONS_KEY = 'q_sale:subscriptions';

export const INITIAL_STATE: AppState = {
  activeGameId: 'r6_siege',
  discordInviteUrl: 'https://discord.com',
  lastUpdated: new Date().toISOString(),
  players: [
    {
      id: 'ian',
      name: 'VESPERWING',
      avatar: '/vesperwing1.webp',
      color: '#ff4757',
      availability: 'now',
      discordStatus: 'in_voice',
      gameId: 'r6_siege',
      gameMode: 'Ranked 🏆',
      customNote: '¡Listo para rankeds!',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'chango',
      name: 'BANDIT',
      avatar: '/Bandit.webp',
      color: '#2ed573',
      availability: 'offline',
      discordStatus: 'offline',
      gameId: 'r6_siege',
      gameMode: 'Ranked 🏆',
      customNote: '',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'el_mati',
      name: 'FARSIGHT',
      avatar: '/Farsight.webp',
      color: '#1e90ff',
      availability: 'offline',
      discordStatus: 'offline',
      gameId: 'r6_siege',
      gameMode: 'Ranked 🏆',
      customNote: '',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'volvo_milei',
      name: 'OUTRIDER',
      avatar: '/Outrider.webp',
      color: '#ffa502',
      availability: 'offline',
      discordStatus: 'offline',
      gameId: 'r6_siege',
      gameMode: 'Ranked 🏆',
      customNote: '',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'aegis',
      name: 'AEGIS',
      avatar: '/Uandi.webp',
      color: '#ff3838',
      availability: 'offline',
      discordStatus: 'offline',
      gameId: 'r6_siege',
      gameMode: 'Ranked 🏆',
      customNote: '',
      updatedAt: new Date().toISOString(),
    },
  ],
};

const ARTWORK_MAP: Record<string, { name: string; avatar: string }> = {
  ian: { name: 'VESPERWING', avatar: '/vesperwing1.webp' },
  chango: { name: 'BANDIT', avatar: '/Bandit.webp' },
  el_mati: { name: 'FARSIGHT', avatar: '/Farsight.webp' },
  volvo_milei: { name: 'OUTRIDER', avatar: '/Outrider.webp' },
  aegis: { name: 'AEGIS', avatar: '/Uandi.webp' },
  uandi: { name: 'AEGIS', avatar: '/Uandi.webp' },
};

export async function getDbAppState(): Promise<AppState> {
  try {
    const client = getRedisClient();
    const data = await client.get(APP_STATE_KEY);
    if (data) {
      const parsed: AppState = JSON.parse(data);
      if (parsed.players && parsed.players.length > 0) {
        parsed.players = parsed.players.map((p) => {
          const map = ARTWORK_MAP[p.id];
          if (map) {
            return {
              ...p,
              name: map.name,
              avatar: map.avatar,
            };
          }
          return p;
        });

        // Ensure Aegis is present in existing Redis database
        const hasAegis = parsed.players.some((p) => p.id === 'aegis' || p.id === 'uandi');
        if (!hasAegis) {
          parsed.players.push({
            id: 'aegis',
            name: 'AEGIS',
            avatar: '/Uandi.webp',
            color: '#ff3838',
            availability: 'offline',
            discordStatus: 'offline',
            gameId: 'r6_siege',
            gameMode: 'Ranked 🏆',
            customNote: '',
            updatedAt: new Date().toISOString(),
          });
          // Save updated state with Aegis
          await saveDbAppState(parsed);
        }

        return parsed;
      }
    }
  } catch (err) {
    console.error('Error fetching state from Redis:', err);
  }

  // Fallback / Initial
  await saveDbAppState(INITIAL_STATE);
  return INITIAL_STATE;
}

export async function saveDbAppState(state: AppState): Promise<void> {
  try {
    const client = getRedisClient();
    await client.set(APP_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving state to Redis:', err);
  }
}

export async function getDbSubscriptions(): Promise<PushSubscriptionData[]> {
  try {
    const client = getRedisClient();
    const data = await client.get(SUBSCRIPTIONS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error getting subscriptions from Redis:', err);
  }
  return [];
}

export async function saveDbSubscription(sub: PushSubscriptionData): Promise<void> {
  try {
    const current = await getDbSubscriptions();
    const filtered = current.filter(s => s.endpoint !== sub.endpoint);
    filtered.push({
      ...sub,
      createdAt: new Date().toISOString(),
    });
    const client = getRedisClient();
    await client.set(SUBSCRIPTIONS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error saving subscription to Redis:', err);
  }
}

export async function removeDbSubscription(endpoint: string): Promise<void> {
  try {
    const current = await getDbSubscriptions();
    const filtered = current.filter(s => s.endpoint !== endpoint);
    const client = getRedisClient();
    await client.set(SUBSCRIPTIONS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error removing subscription from Redis:', err);
  }
}
