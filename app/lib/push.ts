import webpush from 'web-push';
import { getDbSubscriptions, removeDbSubscription, getRedisClient } from './redis';

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BA5J0HjyMmHL-cg6U3dNV62YoZCUXizp0Gix0Iv-4Fa4smprOdmhYfFdW-TBEplQteeo8aDT94JQ4iHs8Y1lnhc';
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'vfxUSHcedUAC-EQcZrZg2Nmv0-1CJihwELQz16ky4Yk';
// Apple APNs requires a valid public email domain or https URL
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:ianfrancodev@gmail.com';

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  createdAt?: string;
}

export async function broadcastPushNotification(payload: {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  senderUserId?: string;
}) {
  const subscriptions = await getDbSubscriptions();
  const logs: Array<{ endpoint: string; status: string; details?: unknown }> = [];

  const stringPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon.svg',
    url: payload.url || '/',
  });

  const sendPromises = subscriptions.map(async (sub) => {
    try {
      const res = await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        stringPayload,
        {
          TTL: 60 * 60 * 24, // 1 day
          urgency: 'high',
        }
      );
      logs.push({
        endpoint: sub.endpoint.substring(0, 40) + '...',
        status: `Success (${res.statusCode})`,
      });
    } catch (err: unknown) {
      const pushError = err as { statusCode?: number; body?: string; message?: string };
      logs.push({
        endpoint: sub.endpoint.substring(0, 40) + '...',
        status: `Error ${pushError.statusCode || 'unknown'}`,
        details: pushError.body || pushError.message || String(err),
      });

      if (pushError.statusCode === 404 || pushError.statusCode === 410) {
        await removeDbSubscription(sub.endpoint);
      }
    }
  });

  await Promise.allSettled(sendPromises);

  // Save last push logs to Redis for debugging
  try {
    const client = getRedisClient();
    await client.set('q_sale:last_push_log', JSON.stringify({
      timestamp: new Date().toISOString(),
      subscriptionsFound: subscriptions.length,
      payload,
      logs,
    }));
  } catch (e) {
    console.error('Error saving push logs to Redis:', e);
  }
}
