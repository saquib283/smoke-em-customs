import { NextRequest, NextResponse } from 'next/server';
import { storageProvider } from '@/modules/storage';
import { contentService } from '@/modules/content';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'leads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum permitted limit of 10MB.' },
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

    // Create database Media entity
    const media = await contentService.createMedia({
      url: uploadResult.publicUrl,
      type: 'IMAGE',
      altText: file.name,
      provider: 'local',
      providerKey: uploadResult.providerKey,
    });

    return NextResponse.json({
      success: true,
      mediaId: media.id,
      url: media.url,
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
