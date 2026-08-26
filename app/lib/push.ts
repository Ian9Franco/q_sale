import webpush from 'web-push';
import { getDbSubscriptions, removeDbSubscription } from './redis';

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BA5J0HjyMmHL-cg6U3dNV62YoZCUXizp0Gix0Iv-4Fa4smprOdmhYfFdW-TBEplQteeo8aDT94JQ4iHs8Y1lnhc';
export const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'vfxUSHcedUAC-EQcZrZg2Nmv0-1CJihwELQz16ky4Yk';
export const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@qsale.local';

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
  console.log(`[PUSH] Found ${subscriptions.length} subscriptions in DB to notify`);

  const stringPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon.svg',
    url: payload.url || '/',
  });

  const sendPromises = subscriptions.map(async (sub) => {
    try {
      console.log(`[PUSH] Sending to endpoint: ${sub.endpoint.substring(0, 40)}...`);
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        stringPayload
      );
      console.log(`[PUSH] Successfully sent notification to endpoint.`);
    } catch (err: unknown) {
      console.error('[PUSH] Failed sending push notification:', err);
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        console.log('[PUSH] Removing expired subscription endpoint:', sub.endpoint);
        await removeDbSubscription(sub.endpoint);
      }
    }
  });

  await Promise.allSettled(sendPromises);
}
