import { NextRequest, NextResponse } from 'next/server';
import { storageProvider } from '@/modules/storage';
import { contentService } from '@/modules/content';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'video/mp4',
  'video/webm',
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'gallery';

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file format. Supported: JPEG, PNG, WebP, AVIF, MP4, WebM.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum permitted limit of 50MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to storage provider
    const uploadResult = await storageProvider.uploadFile({
      buffer,
      filename: file.name,
      contentType: file.type,
      folder,
    });

    const isVideo = file.type.toLowerCase().startsWith('video/');
    const isBlob =
      uploadResult.publicUrl.includes('vercel-storage.com') ||
      process.env.STORAGE_PROVIDER === 'vercel-blob' ||
      Boolean(process.env.BLOB_READ_WRITE_TOKEN);

    // Create database Media entity
    const media = await contentService.createMedia({
      url: uploadResult.publicUrl,
      type: isVideo ? 'VIDEO' : 'IMAGE',
      altText: file.name,
      provider: isBlob ? 'vercel-blob' : 'local',
      providerKey: uploadResult.providerKey,
    });

    return NextResponse.json({
      success: true,
      mediaId: media.id,
      url: media.url,
      type: media.type,
      filename: file.name,
    });
  } catch (err: any) {
    console.error('Error handling upload:', err);
    return NextResponse.json(
      { error: err.message || 'An error occurred during file upload.' },
      { status: 500 }
    );
  }
}
