import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

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

const DATA_DIR = path.join(process.cwd(), 'data');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');

let memorySubscriptions: PushSubscriptionData[] = [];

export function getSubscriptions(): PushSubscriptionData[] {
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      memorySubscriptions = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn('Could not read subscriptions file:', err);
  }
  return memorySubscriptions;
}

export function saveSubscription(sub: PushSubscriptionData) {
  const current = getSubscriptions();
  // Filter out duplicate endpoints
  const filtered = current.filter(s => s.endpoint !== sub.endpoint);
  filtered.push({
    ...sub,
    createdAt: new Date().toISOString(),
  });
  memorySubscriptions = filtered;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save subscriptions file:', err);
  }
}

export function removeSubscription(endpoint: string) {
  const current = getSubscriptions();
  const filtered = current.filter(s => s.endpoint !== endpoint);
  memorySubscriptions = filtered;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not remove subscription from file:', err);
  }
}

export async function broadcastPushNotification(payload: {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  senderUserId?: string;
}) {
  const subscriptions = getSubscriptions();
  const stringPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon.svg',
    url: payload.url || '/',
  });

  const sendPromises = subscriptions.map(async (sub) => {
    // Optionally skip sending to the sender themselves if senderUserId is matched
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
        removeSubscription(sub.endpoint);
      }
    }
  });

  await Promise.allSettled(sendPromises);
}
