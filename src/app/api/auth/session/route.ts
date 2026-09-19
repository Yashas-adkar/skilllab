import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing or invalid Authorization header' },
      { status: 401 }
    );
  }

  const token = authHeader.split('Bearer ')[1];

  // Server-side token validation stub
  // In production with Firebase Admin SDK:
  // const decodedToken = await adminAuth.verifyIdToken(token);
  // const uid = decodedToken.uid;
  if (!token || token === 'undefined') {
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  return NextResponse.json({
    status: 'authenticated',
    message: 'Session verified on server architecture',
  });
}
