/**
 * Storage Module — Implementation
 * Architecture §14
 * 
 * Provides an abstract StorageProvider interface with a local file-system
 * implementation for development and MVP, ready for zero-code swap to
 * S3 or Cloudflare R2 in production.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface StorageProvider {
  getSignedUploadUrl(params: {
    contentType: string;
    sizeBytes: number;
    folder: string;
  }): Promise<{ uploadUrl: string; publicUrl: string; providerKey: string }>;
  uploadFile(file: {
    buffer: Buffer;
    filename: string;
    contentType: string;
    folder?: string;
  }): Promise<{ publicUrl: string; providerKey: string }>;
  deleteObject(providerKey: string): Promise<void>;
  getPublicUrl(providerKey: string): string;
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(process.cwd(), 'public', 'uploads');
  }

  private async ensureDir(folder?: string): Promise<string> {
    const targetDir = folder ? path.join(this.baseDir, folder) : this.baseDir;
    await fs.mkdir(targetDir, { recursive: true });
    return targetDir;
  }

  async uploadFile(file: {
    buffer: Buffer;
    filename: string;
    contentType: string;
    folder?: string;
  }): Promise<{ publicUrl: string; providerKey: string }> {
    const targetDir = await this.ensureDir(file.folder);
    const ext = path.extname(file.filename) || this.getExtensionFromContentType(file.contentType);
    const uniqueId = crypto.randomUUID();
    const safeName = `${Date.now()}-${uniqueId}${ext}`;
    const filePath = path.join(targetDir, safeName);

    await fs.writeFile(filePath, file.buffer);

    const providerKey = file.folder ? `${file.folder}/${safeName}` : safeName;
    const publicUrl = `/uploads/${providerKey}`;

    return {
      publicUrl,
      providerKey,
    };
  }

  async getSignedUploadUrl(params: {
    contentType: string;
    sizeBytes: number;
    folder: string;
  }): Promise<{ uploadUrl: string; publicUrl: string; providerKey: string }> {
    const uniqueId = crypto.randomUUID();
    const ext = this.getExtensionFromContentType(params.contentType);
    const filename = `${Date.now()}-${uniqueId}${ext}`;
    const providerKey = `${params.folder}/${filename}`;

    return {
      uploadUrl: `/api/uploads`,
      publicUrl: `/uploads/${providerKey}`,
      providerKey,
    };
  }

  async deleteObject(providerKey: string): Promise<void> {
    const filePath = path.join(this.baseDir, providerKey);
    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }

  getPublicUrl(providerKey: string): string {
    return `/uploads/${providerKey}`;
  }

  private getExtensionFromContentType(contentType: string): string {
    switch (contentType.toLowerCase()) {
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/avif':
        return '.avif';
      case 'video/mp4':
        return '.mp4';
      case 'video/webm':
        return '.webm';
      default:
        return '.bin';
    }
  }
}

/**
 * Vercel Blob Storage Provider — Production Cloud Storage
 * Uses Vercel's global edge network via @vercel/blob.
 */
export class VercelBlobStorageProvider implements StorageProvider {
  private token?: string;

  constructor(token?: string) {
    this.token = token || process.env.BLOB_READ_WRITE_TOKEN;
  }

  async uploadFile(file: {
    buffer: Buffer;
    filename: string;
    contentType: string;
    folder?: string;
  }): Promise<{ publicUrl: string; providerKey: string }> {
    const { put } = await import('@vercel/blob');
    const ext = path.extname(file.filename);
    const base = path.basename(file.filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueId = crypto.randomUUID().slice(0, 8);
    const targetFolder = file.folder ? `${file.folder}/` : '';
    const pathname = `${targetFolder}${Date.now()}-${uniqueId}-${base}${ext}`;

    const blob = await put(pathname, file.buffer, {
      access: 'public',
      contentType: file.contentType,
      token: this.token,
    });

    return {
      publicUrl: blob.url,
      providerKey: blob.url,
    };
  }

  async getSignedUploadUrl(params: {
    contentType: string;
    sizeBytes: number;
    folder: string;
  }): Promise<{ uploadUrl: string; publicUrl: string; providerKey: string }> {
    return {
      uploadUrl: `/api/uploads`,
      publicUrl: '',
      providerKey: `${params.folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    };
  }

  async deleteObject(providerKey: string): Promise<void> {
    try {
      const { del } = await import('@vercel/blob');
      await del(providerKey, { token: this.token });
    } catch (err: any) {
      console.warn(`Failed to delete Vercel Blob object: ${providerKey}`, err.message);
    }
  }

  getPublicUrl(providerKey: string): string {
    if (providerKey.startsWith('http://') || providerKey.startsWith('https://')) {
      return providerKey;
    }
    return `/uploads/${providerKey}`;
  }
}

/**
 * Automatically creates the appropriate storage provider:
 * - VercelBlobStorageProvider when BLOB_READ_WRITE_TOKEN is set or STORAGE_PROVIDER=vercel-blob
 * - LocalStorageProvider for local development and offline test suites
 */
export function createStorageProvider(): StorageProvider {
  const providerType = process.env.STORAGE_PROVIDER?.toLowerCase();
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;

  if (providerType === 'vercel-blob' || (!providerType && hasBlobToken) || providerType === 'blob') {
    return new VercelBlobStorageProvider();
  }

  return new LocalStorageProvider();
}

export const storageProvider: StorageProvider = createStorageProvider();

