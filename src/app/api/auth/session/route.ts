
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Durée de validité du cookie de session (ex: 7 jours)
const SESSION_DURATION = 60 * 60 * 24 * 7; 

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
        return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    }

    cookies().set('firebase-auth-token', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_DURATION,
      path: '/',
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Session POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
    try {
        cookies().delete('firebase-auth-token');
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Session DELETE error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
