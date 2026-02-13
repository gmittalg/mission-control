import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface ClientConfig {
    id: string;
    name: string;
    gateway_url: string;
    gateway_token: string;
    db_path: string;
    created_at: string;
    updated_at: string;
}

const MASTER_DB_PATH = process.env.MASTER_DATABASE_PATH || path.join(process.cwd(), 'master.db');

let masterDb: Database.Database | null = null;

const MASTER_SCHEMA = `
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gateway_url TEXT NOT NULL,
  gateway_token TEXT NOT NULL,
  db_path TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
`;

export function getMasterDb(): Database.Database {
    if (!masterDb) {
        const isNewDb = !fs.existsSync(MASTER_DB_PATH);
        masterDb = new Database(MASTER_DB_PATH);
        masterDb.pragma('journal_mode = WAL');
        masterDb.exec(MASTER_SCHEMA);

        if (isNewDb) {
            console.log('[MasterDB] New master database created at:', MASTER_DB_PATH);

            // Seed with default client if env vars are present
            const defaultUrl = process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789';
            const defaultToken = process.env.OPENCLAW_GATEWAY_TOKEN || '';
            const defaultDbPath = process.env.DATABASE_PATH || './mission-control.db';

            masterDb.prepare(`
        INSERT OR IGNORE INTO clients (id, name, gateway_url, gateway_token, db_path)
        VALUES (?, ?, ?, ?, ?)
      `).run('default', 'Default Client', defaultUrl, defaultToken, defaultDbPath);
        }
    }
    return masterDb;
}

export function getClientConfig(clientId: string): ClientConfig | undefined {
    return getMasterDb().prepare('SELECT * FROM clients WHERE id = ?').get(clientId) as ClientConfig | undefined;
}

export function listClients(): ClientConfig[] {
    return getMasterDb().prepare('SELECT * FROM clients ORDER BY name').all() as ClientConfig[];
}

export function addClient(config: Omit<ClientConfig, 'created_at' | 'updated_at'>): void {
    getMasterDb().prepare(`
    INSERT INTO clients (id, name, gateway_url, gateway_token, db_path)
    VALUES (?, ?, ?, ?, ?)
  `).run(config.id, config.name, config.gateway_url, config.gateway_token, config.db_path);
}

export function updateClient(id: string, updates: Partial<Omit<ClientConfig, 'id' | 'created_at' | 'updated_at'>>): void {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    if (fields.length === 0) return;

    getMasterDb().prepare(`
    UPDATE clients 
    SET ${fields}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(...values, id);
}

export function deleteClient(id: string): void {
    getMasterDb().prepare('DELETE FROM clients WHERE id = ?').run(id);
}
