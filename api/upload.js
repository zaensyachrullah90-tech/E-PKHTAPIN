import { google } from 'googleapis';
import stream from 'stream';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST');

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/gm, '\n'),
      },
      scopes: ['[https://www.googleapis.com/auth/drive.file](https://www.googleapis.com/auth/drive.file)'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Contoh: req.body.file adalah string base64 gambar
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(req.body.file, 'base64'));

    const upload = await drive.files.create({
      requestBody: { name: 'FotoLaporan.png', parents: ['ID_FOLDER_GOOGLE_DRIVE'] },
      media: { mimeType: 'image/png', body: bufferStream },
    });

    res.status(200).json({ id: upload.data.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
