import { NextRequest, NextResponse } from 'next/server';
import { storageProvider } from '@/modules/storage';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'video/mp4',
  'video/webm',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (to allow detailing short video clips)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contentType, sizeBytes, folder } = body;

    if (!contentType) {
      return NextResponse.json({ error: 'Missing contentType in request payload' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(contentType.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file format. Supported: JPEG, PNG, WebP, AVIF, MP4, WebM.' },
        { status: 400 }
      );
    }

    if (sizeBytes && sizeBytes > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum permitted limit of 50MB.' },
        { status: 400 }
      );
    }

    const targetFolder = folder || 'gallery';

    const signedData = await storageProvider.getSignedUploadUrl({
      contentType,
      sizeBytes: sizeBytes || 0,
      folder: targetFolder,
    });

    return NextResponse.json({
      success: true,
      uploadUrl: signedData.uploadUrl,
      publicUrl: signedData.publicUrl,
      providerKey: signedData.providerKey,
    });
  } catch (err: any) {
    console.error('Error generating signed upload URL:', err);
    return NextResponse.json(
      { error: err.message || 'Server error generating signed upload URL' },
      { status: 500 }
    );
  }
}
