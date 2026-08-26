import { NextResponse } from 'next/server';
import { broadcastPushNotification } from '../../../lib/push';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, senderUserId, url } = body;

    await broadcastPushNotification({
      title: title || '¿Qué Sale? - Squad R6 🎯',
      body: message || '¡Un amigo está entrando a jugar!',
      senderUserId,
      url: url || '/',
    });

    return NextResponse.json({ success: true, message: 'Notificación enviada' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error enviando notificación push', details: String(error) },
      { status: 500 }
    );
  }
}
