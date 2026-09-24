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

export const storageProvider: StorageProvider = new LocalStorageProvider();
