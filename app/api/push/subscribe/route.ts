import { NextResponse } from 'next/server';
import { saveSubscription, removeSubscription, VAPID_PUBLIC_KEY } from '../../../lib/push';

export async function GET() {
  return NextResponse.json({ publicKey: VAPID_PUBLIC_KEY });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, subscription, userId } = body;

    if (action === 'unsubscribe') {
      if (subscription?.endpoint) {
        removeSubscription(subscription.endpoint);
      }
      return NextResponse.json({ success: true });
    }

    if (subscription && subscription.endpoint && subscription.keys) {
      saveSubscription({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        userId,
      });
      return NextResponse.json({ success: true, message: 'Suscripción guardada con éxito' });
    }

    return NextResponse.json({ error: 'Datos de suscripción inválidos' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error procesando suscripción', details: String(error) },
      { status: 500 }
    );
  }
}
