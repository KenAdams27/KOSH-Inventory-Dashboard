
import { google } from 'googleapis';
import { Readable } from 'stream';
import type { OAuth2Client } from 'google-auth-library';

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// Dynamically determine the redirect URI based on the environment
const getRedirectUri = () => {
  if (process.env.NODE_ENV === 'production') {
    // Use the explicit production URL for Netlify to avoid any ambiguity.
    return 'https://koshinventory.netlify.app/api/auth/google/drive/callback';
  }

  // Development environment
  return 'http://localhost:9002/api/auth/google/drive/callback';
};

const REDIRECT_URI = getRedirectUri();


export function getOAuth2Client(): OAuth2Client {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials are not set in environment variables.');
  }
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

async function getAuthenticatedClient(): Promise<OAuth2Client> {
  const oauth2Client = getOAuth2Client();
  const { GOOGLE_DRIVE_REFRESH_TOKEN } = process.env;

  if (!GOOGLE_DRIVE_REFRESH_TOKEN) {
    throw new Error('Google Drive refresh token is not set. Please authenticate via /api/auth/google/drive');
  }

  oauth2Client.setCredentials({
    refresh_token: GOOGLE_DRIVE_REFRESH_TOKEN,
  });

  // Test the connection by getting a new access token
  try {
    await oauth2Client.getAccessToken();
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    throw new Error('Could not refresh access token. The refresh token might be expired or invalid. Please re-authenticate.');
  }

  return oauth2Client;
}

export async function uploadImageToDrive(buffer: Buffer, fileName: string): Promise<string | null> {
  if (!FOLDER_ID) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set in environment variables.');
  }

  const auth = await getAuthenticatedClient();
  const drive = google.drive({ version: 'v3', auth });

  const readableStream = new Readable();
  readableStream.push(buffer);
  readableStream.push(null);

  const fileMetadata = {
    name: fileName,
    parents: [FOLDER_ID],
  };

  const media = {
    mimeType: 'image/jpeg', // Adjust based on your file type
    body: readableStream,
  };

  try {
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    if (!file.data.id) {
        throw new Error("File ID not found after upload.");
    }
    
    // Make the file publicly readable
    await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    });

    // Return the direct link for viewing/embedding
    return `https://drive.google.com/uc?id=${file.data.id}`;

  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    const gaxiosError = error as any;
    if (gaxiosError.response?.data?.error) {
        console.error('Google API Error Details:', gaxiosError.response.data.error);
        throw new Error(`Google API Error: ${gaxiosError.response.data.error.message}`);
    }
    throw new Error(`Failed to upload image to Google Drive: ${gaxiosError.message || 'Unknown error'}`);
  }
}
