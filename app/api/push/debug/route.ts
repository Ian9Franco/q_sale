import { NextResponse } from 'next/server';
import { getDbSubscriptions, getRedisClient } from '../../../lib/redis';

export async function GET() {
  const subscriptions = await getDbSubscriptions();
  let lastPushLog = null;

  try {
    const client = getRedisClient();
    const raw = await client.get('q_sale:last_push_log');
    if (raw) lastPushLog = JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }

  return NextResponse.json({
    count: subscriptions.length,
    subscriptions: subscriptions.map(s => ({
      endpoint: s.endpoint.substring(0, 60) + '...',
      userId: s.userId,
      createdAt: s.createdAt,
      isApple: s.endpoint.includes('apple.com'),
      isGoogle: s.endpoint.includes('google.com') || s.endpoint.includes('fcm'),
    })),
    lastPushLog,
  });
}
