import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/google-drive';

export async function GET(req: NextRequest) {
  const oauth2Client = getOAuth2Client();
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (typeof code !== 'string') {
    return NextResponse.json({ 
      error: 'Invalid Request: Authorization code is missing.',
      message: 'This page is a callback for Google Authentication and should not be visited directly. Please start the process by navigating to /api/auth/google/drive.',
    }, { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // The refresh_token is only sent on the first authorization.
    // Store it securely (e.g., in a database or environment variable).
    if (tokens.refresh_token) {
      console.log('*******************************************************************');
      console.log('** OBTAINED REFRESH TOKEN. STORE THIS IN YOUR .env FILE **');
      console.log('**');
      console.log(`** GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('**');
      console.log('*******************************************************************');

      return NextResponse.json({
        message: 'Authentication successful! Refresh token has been printed to the server console (e.g., Netlify Function logs). Please copy it to your environment variables and restart/re-deploy the server.',
        refreshToken: 'Printed to server console for security.',
      });
    }

    return NextResponse.json({
      message: 'Authentication successful! You are already set up with a refresh token.',
      accessToken: tokens.access_token,
    });

  } catch (error) {
    console.error('Error retrieving access token', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to retrieve access token', details: message }, { status: 500 });
  }
}
