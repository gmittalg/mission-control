import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { schema } from './schema';
import { runMigrations } from './migrations';

import { getClientConfig } from './master';

const dbCache = new Map<string, Database.Database>();

export function getDb(clientId: string = 'default'): Database.Database {
  if (dbCache.has(clientId)) {
    return dbCache.get(clientId)!;
  }

  const config = getClientConfig(clientId);
  if (!config && clientId !== 'default') {
    throw new Error(`Client configuration not found for ID: ${clientId}`);
  }

  const dbPath = config?.db_path || process.env.DATABASE_PATH || path.join(process.cwd(), 'mission-control.db');

  const isNewDb = !fs.existsSync(dbPath);

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Initialize base schema (creates tables if they don't exist)
  db.exec(schema);

  // Run migrations for schema updates
  runMigrations(db);

  if (isNewDb) {
    console.log(`[DB] New database created for client ${clientId} at:`, dbPath);
  }

  dbCache.set(clientId, db);
  return db;
}

export function closeDb(clientId?: string): void {
  if (clientId) {
    const db = dbCache.get(clientId);
    if (db) {
      db.close();
      dbCache.delete(clientId);
    }
  } else {
    for (const [id, db] of dbCache.entries()) {
      db.close();
    }
    dbCache.clear();
  }
}

// Type-safe query helpers
export function queryAll<T>(clientId: string, sql: string, params: unknown[] = []): T[] {
  const stmt = getDb(clientId).prepare(sql);
  return stmt.all(...params) as T[];
}

export function queryOne<T>(clientId: string, sql: string, params: unknown[] = []): T | undefined {
  const stmt = getDb(clientId).prepare(sql);
  return stmt.get(...params) as T | undefined;
}

export function run(clientId: string, sql: string, params: unknown[] = []): Database.RunResult {
  const stmt = getDb(clientId).prepare(sql);
  return stmt.run(...params);
}

export function transaction<T>(clientId: string, fn: () => T): T {
  const db = getDb(clientId);
  return db.transaction(fn)();
}

// Export migration utilities for CLI use
export { runMigrations, getMigrationStatus } from './migrations';
export { getMasterDb } from './master';
