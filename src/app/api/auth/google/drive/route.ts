import { NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/google-drive';

export async function GET() {
  const oauth2Client = getOAuth2Client();

  // Generate the url that will be used for the consent dialog.
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/drive.file',
    prompt: 'consent', // Force refresh token to be sent
  });

  return NextResponse.redirect(authorizeUrl);
}
