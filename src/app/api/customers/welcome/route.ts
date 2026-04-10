
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/brevo';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email || !name) {
      return NextResponse.json(
        { success: false, message: 'Email and name are required.' },
        { status: 400 }
      );
    }

    const result = await sendWelcomeEmail({
      customerEmail: email,
      customerName: name,
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Welcome email sent.' });
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API Welcome Email] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
