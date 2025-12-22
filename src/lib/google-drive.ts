
import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

async function getAuthenticatedClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Google service account credentials are not set in environment variables.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });

  const client = await auth.getClient();
  return google.drive({ version: 'v3', auth: client });
}

export async function uploadImageToDrive(buffer: Buffer, fileName: string): Promise<string | null> {
  if (!FOLDER_ID) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set in environment variables.');
  }

  const drive = await getAuthenticatedClient();
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
      fields: 'id, webViewLink, webContentLink',
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

    // To get a direct media link, you must format it this way
    return `https://lh3.googleusercontent.com/d/${file.data.id}`;

  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error(`Failed to upload image to Google Drive: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
