import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getBrandList, getModelsForBrand, detectVehicleType } from '../src/lib/vehicles.ts';
import { LocalStorageProvider } from '../src/modules/storage/index.ts';
import path from 'path';
import fs from 'fs/promises';

describe('Phase 4 — StorageProvider & Vehicle Catalogue Tests', () => {
  it('detects vehicle segments correctly based on model and brand catalog', () => {
    assert.strictEqual(detectVehicleType('BMW', '330i M Sport'), 'SEDAN');
    assert.strictEqual(detectVehicleType('BMW', 'X5 xDrive40i'), 'SUV');
    assert.strictEqual(detectVehicleType('Porsche', '911 Carrera'), 'LUXURY');
    assert.strictEqual(detectVehicleType('Mahindra', 'Thar Roxx'), 'SUV');
    assert.strictEqual(detectVehicleType('Toyota', 'Innova Hycross'), 'MUV');
    assert.strictEqual(detectVehicleType('Volkswagen', 'Polo GT'), 'HATCHBACK');
    assert.strictEqual(detectVehicleType('Superbike / Motorcycle', 'Ducati Panigale'), 'TWO_WHEELER');
  });

  it('lists popular brands and retrieves associated models', () => {
    const brands = getBrandList();
    assert.ok(brands.includes('BMW'));
    assert.ok(brands.includes('Porsche'));
    assert.ok(brands.includes('Mercedes-Benz'));
    assert.ok(brands.includes('Mahindra'));

    const porscheModels = getModelsForBrand('Porsche');
    assert.ok(porscheModels.length >= 4);
    assert.ok(porscheModels.some((m) => m.name.includes('911')));
    assert.ok(porscheModels.some((m) => m.name.includes('Macan')));
  });

  it('LocalStorageProvider creates uploads and returns public url', async () => {
    const testDir = path.join(process.cwd(), 'public', 'uploads', 'test_tmp');
    const provider = new LocalStorageProvider(testDir);

    const dummyBuffer = Buffer.from('fake image binary content');
    const result = await provider.uploadFile({
      buffer: dummyBuffer,
      filename: 'sample_defect.jpg',
      contentType: 'image/jpeg',
      folder: 'defects',
    });

    assert.ok(result.publicUrl.startsWith('/uploads/defects/'));
    assert.ok(result.providerKey.startsWith('defects/'));

    // Check file exists on disk
    const onDisk = path.join(testDir, result.providerKey);
    const stat = await fs.stat(onDisk);
    assert.ok(stat.size > 0);

    // Clean up
    await provider.deleteObject(result.providerKey);
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('enforces 3-day follow-up threshold only for open leads', () => {
    const now = new Date('2026-10-15T12:00:00Z');
    const fourDaysAgo = new Date('2026-10-11T12:00:00Z');

    function checkFollowUp(status: string, lastActivity: Date) {
      const isClosed = ['BOOKED', 'COMPLETED', 'LOST'].includes(status);
      const diffMs = now.getTime() - lastActivity.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return !isClosed && diffDays >= 3;
    }

    // Open lead 4 days inactive -> True
    assert.strictEqual(checkFollowUp('NEW', fourDaysAgo), true);
    assert.strictEqual(checkFollowUp('CONTACTED', fourDaysAgo), true);
    assert.strictEqual(checkFollowUp('QUOTE_SENT', fourDaysAgo), true);
    assert.strictEqual(checkFollowUp('FOLLOW_UP', fourDaysAgo), true);

    // Closed leads 4 days inactive -> False
    assert.strictEqual(checkFollowUp('BOOKED', fourDaysAgo), false);
    assert.strictEqual(checkFollowUp('COMPLETED', fourDaysAgo), false);
    assert.strictEqual(checkFollowUp('LOST', fourDaysAgo), false);
  });
});
