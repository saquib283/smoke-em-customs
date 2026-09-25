import 'dotenv/config';
import { db } from './db';

async function main() {
  console.log('Connecting to PostgreSQL to check and apply btree_gist extension and exclusion constraint...');
  try {
    // 1. Enable btree_gist extension
    await (db as any).raw.sql`CREATE EXTENSION IF NOT EXISTS btree_gist;`;
    console.log('[OK] btree_gist extension verified/enabled.');

    // 2. Add an index or constraint if not exists
    try {
      await (db as any).raw.sql`
        ALTER TABLE bookings
        DROP CONSTRAINT IF EXISTS no_overlapping_bookings;
      `;

      await (db as any).raw.sql`
        ALTER TABLE bookings
        ADD CONSTRAINT no_overlapping_bookings
        EXCLUDE USING gist (
          "resourceId" WITH =,
          tstzrange("startAt", "endAt", '[)') WITH &&
        ) WHERE (status != 'CANCELLED');
      `;
      console.log('[OK] EXCLUDE USING gist constraint (no_overlapping_bookings) successfully created on bookings table.');
    } catch (constraintErr: any) {
      console.warn('Note on constraint creation:', constraintErr.message);
    }
  } catch (err: any) {
    console.warn('GIST setup execution note:', err.message);
  }
}

main().catch(console.error);
