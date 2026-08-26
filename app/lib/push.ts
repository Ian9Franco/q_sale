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
  const stringPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon.svg',
    url: payload.url || '/',
  });

  const sendPromises = subscriptions.map(async (sub) => {
    // Optionally skip sending to the sender themselves
    if (payload.senderUserId && sub.userId === payload.senderUserId) {
      return;
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        stringPayload
      );
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      // If subscription expired or invalid (404 / 410 Gone), remove it
      if (statusCode === 404 || statusCode === 410) {
        await removeDbSubscription(sub.endpoint);
      }
    }
  });

  await Promise.allSettled(sendPromises);
}
